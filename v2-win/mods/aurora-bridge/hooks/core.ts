// The pane's brain, with no dependency on Claude Code: the state it keeps, how each event changes it, and the views
// the drawing reads. Everything here is a pure function over plain JSON, so it is unit-tested on its own
// (tests/core.test.mjs) and the atoms in $.state can hold it as it is.
import { KINDS } from './palette'
import type { Kind } from './palette'

export type Call = {
  id: string
  tool: string
  kind: Kind
  /** the main-loop turn this call belongs to (a subagent's calls ride on the turn that spawned it) */
  turn: number
  at: number
  end?: number
  err?: boolean
  /** made inside a subagent */
  sub?: boolean
  target?: string
}
export type TurnRow = { n: number; at: number; end?: number; durationMs?: number; reason?: string; out?: number }
export type AgentRow = { id: string; type: string; label: string; at: number; end?: number }
export type Gate = { allow: number; ask: number; deny: number }
export type Bridge = {
  calls: Call[]
  turns: TurnRow[]
  agents: AgentRow[]
  gate: Gate
  files: Record<string, number>
  working: boolean
  turn: number
  startedAt: number
}

export const MAX_CALLS = 400
export const MAX_TURNS = 60
export const MAX_AGENTS = 24
export const MAX_FILES = 60

export const EMPTY: Bridge = { calls: [], turns: [], agents: [], gate: { allow: 0, ask: 0, deny: 0 }, files: {}, working: false, turn: 0, startedAt: 0 }

// ------------------------------------------------------------------------------------------------ kinds
const BY_TOOL: Readonly<Record<string, Kind>> = {
  Read: 'read', NotebookRead: 'read',
  Edit: 'write', Write: 'write', MultiEdit: 'write', NotebookEdit: 'write',
  Bash: 'run', PowerShell: 'run',
  Grep: 'search', Glob: 'search',
  WebFetch: 'web', WebSearch: 'web',
  Task: 'agent', Agent: 'agent',
}
export function kindOf(tool: string): Kind {
  if (tool.startsWith('mcp__')) return 'mcp'
  return BY_TOOL[tool] ?? 'other'
}

// ------------------------------------------------------------------------------------------------ text
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g
/** Text from tool input is untrusted: strip control characters (which could carry escape sequences) and cut it. */
export const clean = (s: unknown, max = 60): string => String(s ?? '').replace(CONTROL, ' ').trim().slice(0, max)

export function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return ''
  const s = Math.floor(ms / 1000)
  if (s < 1) return '<1s'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m${String(s % 60).padStart(2, '0')}s`
  return `${s}s`
}

export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return '–'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return String(Math.round(n))
}

/** The tail of a path that fits `max` cells, `…` in front when cut, always showing the file name. */
export function shortPath(p: string, max: number): string {
  const parts = clean(p, 400).split(/[\\/]+/).filter(Boolean)
  const name = parts.at(-1) ?? ''
  if (max <= 1) return name.slice(0, max)
  let out = name
  for (let i = parts.length - 2; i >= 0; i--) {
    const next = `${parts[i]}/${out}`
    if (next.length > max) break
    out = next
  }
  return out.length > max ? `…${out.slice(out.length - (max - 1))}` : out
}

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`

// ------------------------------------------------------------------------------------------------ reducers
const trim = <T,>(list: T[], max: number): T[] => (list.length > max ? list.slice(list.length - max) : list)

export function onTurnStart(s: Bridge, now: number): Bridge {
  const n = s.turn + 1
  return { ...s, working: true, turn: n, startedAt: s.startedAt || now, turns: trim([...s.turns, { n, at: now }], MAX_TURNS) }
}

export function onTurnComplete(s: Bridge, e: { durationMs?: number; reason?: string; out?: number }, now: number): Bridge {
  const bad = e.reason === 'aborted' || e.reason === 'error' || e.reason === 'refusal'
  const turns = s.turns.map((t) => (t.n === s.turn ? { ...t, end: now, durationMs: e.durationMs, reason: e.reason, out: e.out } : t))
  // a call still running when its turn ends was interrupted or never reported back
  const calls = s.calls.map((c) => (c.end === undefined && c.turn === s.turn ? { ...c, end: now, err: bad ? true : c.err } : c))
  return { ...s, working: false, turns, calls }
}

export function onToolStart(s: Bridge, e: { id: string; tool: string; sub?: boolean; target?: string }, now: number): Bridge {
  const base = s.turn === 0 ? onTurnStart(s, now) : s       // a session resumed mid-flight has calls before any turn.start
  const call: Call = { id: e.id, tool: e.tool, kind: kindOf(e.tool), turn: base.turn, at: now, sub: e.sub || undefined, target: e.target }
  return { ...base, calls: trim([...base.calls, call], MAX_CALLS) }
}

export function onToolEnd(s: Bridge, id: string, isError: boolean, now: number): Bridge {
  if (!s.calls.some((c) => c.id === id)) return s
  return { ...s, calls: s.calls.map((c) => (c.id === id ? { ...c, end: now, err: isError || undefined } : c)) }
}

export function onFile(s: Bridge, path: string): Bridge {
  const key = clean(path, 300)
  if (!key) return s
  const files = { ...s.files, [key]: (s.files[key] ?? 0) + 1 }
  const keys = Object.keys(files)
  if (keys.length > MAX_FILES) delete files[keys[0]]
  return { ...s, files }
}

export function onGate(s: Bridge, decision: unknown): Bridge {
  const g = { ...s.gate }
  if (decision === 'allow') g.allow++
  else if (decision === 'ask') g.ask++
  else if (decision === 'deny') g.deny++
  else return s
  return { ...s, gate: g }
}

export function onAgentStart(s: Bridge, e: { id: string; type: string; label: string }, now: number): Bridge {
  return { ...s, agents: trim([...s.agents, { id: e.id, type: clean(e.type, 30), label: clean(e.label, 60), at: now }], MAX_AGENTS) }
}

export function onAgentEnd(s: Bridge, id: string, now: number): Bridge {
  return { ...s, agents: s.agents.map((a) => (a.id === id && a.end === undefined ? { ...a, end: now } : a)) }
}

// ------------------------------------------------------------------------------------------------ views
export function mixCounts(s: Bridge): Record<Kind, number> {
  const out = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>
  for (const c of s.calls) out[c.kind]++
  return out
}

export type TimelineRow = { turn: number; first: boolean; calls: Call[] }

/** The calls grouped by turn into rows of at most `perRow`, a long turn wrapping; only the last `maxRows` rows. */
export function timelineRows(s: Bridge, perRow: number, maxRows: number): TimelineRow[] {
  const per = Math.max(1, Math.floor(perRow))
  const rows: TimelineRow[] = []
  let current: TimelineRow | null = null
  for (const c of s.calls) {
    if (!current || current.turn !== c.turn || current.calls.length >= per) {
      current = { turn: c.turn, first: !current || current.turn !== c.turn, calls: [] }
      rows.push(current)
    }
    current.calls.push(c)
  }
  return rows.slice(-Math.max(0, maxRows))
}

export function topFiles(s: Bridge, n: number): { path: string; count: number }[] {
  const entries = Object.entries(s.files).map(([path, count], order) => ({ path, count, order }))
  entries.sort((a, b) => b.count - a.count || b.order - a.order)
  return entries.slice(0, n).map(({ path, count }) => ({ path, count }))
}

export function turnStats(s: Bridge, n: number): { tools: number; errors: number } {
  let tools = 0, errors = 0
  for (const c of s.calls) if (c.turn === n) { tools++; if (c.err) errors++ }
  return { tools, errors }
}

export const lastTurn = (s: Bridge): TurnRow | undefined => [...s.turns].reverse().find((t) => t.end !== undefined)
export const runningAgents = (s: Bridge): AgentRow[] => s.agents.filter((a) => a.end === undefined)
export const runningCalls = (s: Bridge): Call[] => s.calls.filter((c) => c.end === undefined)

// ------------------------------------------------------------------------------------------------ demo
/** A believable mid-session state for screenshots and tests (option `demo: "on"`). Deterministic. */
export function demoState(now: number): Bridge {
  let s: Bridge = { ...EMPTY, startedAt: now - 17 * 60000 }
  const plan: { tool: string; target?: string; err?: boolean; sub?: boolean }[][] = [
    [{ tool: 'Read', target: 'palette.json' }, { tool: 'Grep', target: 'prompt_cache' }, { tool: 'Read' }, { tool: 'Edit', target: 'aurora-deck.mjs' }],
    [{ tool: 'Bash', target: 'node --test' }, { tool: 'Bash', target: 'git status', err: false }, { tool: 'Edit', target: 'aurora-deck.mjs' }, { tool: 'Read' }, { tool: 'Glob' }],
    [{ tool: 'WebSearch', target: 'pixel shader' }, { tool: 'WebFetch' }, { tool: 'Read' }, { tool: 'Read' }, { tool: 'Write', target: 'glow.hlsl' }, { tool: 'Bash', target: 'check-shader', err: true }, { tool: 'Edit', target: 'glow.hlsl' }, { tool: 'Bash', target: 'check-shader' }],
    [{ tool: 'Agent', target: 'review' }, { tool: 'Grep', sub: true }, { tool: 'Read', sub: true }, { tool: 'Read', sub: true }, { tool: 'Grep', sub: true }, { tool: 'mcp__astral__price_get' }, { tool: 'Edit', target: 'README.md' }],
    [{ tool: 'Read' }, { tool: 'Edit', target: 'tests/deck.test.mjs' }, { tool: 'Bash', target: 'npm test' }, { tool: 'Edit', target: 'README.md' }, { tool: 'Bash', target: 'git commit' }],
    [{ tool: 'Grep' }, { tool: 'Read' }, { tool: 'Edit', target: 'aurora-deck.mjs' }, { tool: 'Bash', target: 'node tools/rice.mjs' }],
  ]
  let id = 0
  const t0 = now - 16 * 60000
  plan.forEach((turn, ti) => {
    const start = t0 + ti * 150000
    s = onTurnStart(s, start)
    turn.forEach((c, ci) => {
      const at = start + 4000 + ci * 9000
      const callId = `demo-${id++}`
      s = onToolStart(s, { id: callId, tool: c.tool, sub: c.sub, target: c.target }, at)
      s = onToolEnd(s, callId, Boolean(c.err), at + 1500 + (ci % 3) * 700)
      if (kindOf(c.tool) === 'write' && c.target) s = onFile(s, c.target)
    })
    s = onTurnComplete(s, { durationMs: 70000 + ti * 21000, reason: 'answer', out: 1800 + ti * 950 }, start + 90000)
  })
  // the turn in progress: two done, one still running, a subagent running
  s = onTurnStart(s, now - 62000)
  for (const [i, tool] of ['Read', 'Grep', 'Edit'].entries()) {
    const callId = `demo-live-${i}`
    s = onToolStart(s, { id: callId, tool, target: tool === 'Edit' ? 'aurora-deck.mjs' : undefined }, now - 55000 + i * 12000)
    if (i < 2) s = onToolEnd(s, callId, false, now - 50000 + i * 12000)
  }
  s = onFile(s, 'aurora-deck.mjs')
  s = onAgentStart(s, { id: 'demo-agent-1', type: 'Explore', label: 'find every place the palette is read' }, now - 48000)
  s = onAgentStart(s, { id: 'demo-agent-0', type: 'code-reviewer', label: 'review the shader change' }, now - 400000)
  s = onAgentEnd(s, 'demo-agent-0', now - 330000)
  s = { ...s, gate: { allow: 134, ask: 0, deny: 1 } }
  return s
}
