// Aurora Bridge: a right-hand pane that shows what Claude is doing as it does it.
//   heartbeat   a flame equaliser, fast while Claude works, slow when idle
//   activity    one glowing dot per tool call, a row per turn, a colour per kind of tool
//   gate        how many permission checks were allowed, asked, denied
//   agents      subagents, running first
//   files       the most-edited files
//   last turn   a one-line receipt
// It only watches: it never changes a call, a prompt or a decision, and every hook hands the event on untouched.
import { atom, read, update } from 'claude-code'
import type { Hook, Register } from 'claude-code'

import { EMPTY, clean, demoState, fmtCount, fmtDuration, kindOf, lastTurn, mixCounts, onAgentEnd, onAgentStart, onFile, onGate, onToolEnd, onToolStart, onTurnComplete, onTurnStart, plural, runningAgents, shortPath, timelineRows, topFiles, turnStats } from './core'
import type { Bridge } from './core'
import { KINDS, parsePalette } from './palette'
import type { Palette } from './palette'
import { gateBar, mixBar, pack, timeline, wave } from './raster'

type Dollar = Parameters<Hook<'session.start'>>[0]
const PANE = 'aurora-bridge'
const bridge = atom({ plugin: 'aurora-bridge', key: 'bridge' } as const, EMPTY)

const TICK_MS = 125
const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback

/** The tool's own arguments carry the thing worth showing: a path, a pattern, a command. */
function targetOf(e: object): string | undefined {
  const a = e as Record<string, unknown>
  for (const k of ['file_path', 'path', 'notebook_path', 'pattern', 'command', 'url', 'query', 'description']) {
    if (typeof a[k] === 'string' && a[k]) return clean(a[k], 80)
  }
  return undefined
}
const pathOf = (e: object): string | undefined => {
  const a = e as Record<string, unknown>
  const v = a.file_path ?? a.notebook_path ?? a.path
  return typeof v === 'string' && v ? v : undefined
}

type Anim = { mounted: { w: number; h: number } | null; phase: number; level: number; tick: number; busy: boolean; at: number }

/** One animation frame: repaint the heartbeat (and now and then the timeline) in place, without redrawing the pane. */
async function paint($: Dollar, anim: Anim, P: Palette): Promise<void> {
  if (!anim.mounted) return
  // Working: every tick (8 frames a second). Idle: every fourth tick (2 a second), and the state is not even read on the others.
  if (!anim.busy && anim.tick % 4 !== 0) return
  const s = await read($, bridge)
  const busy = s.working || runningAgents(s).length > 0 || s.calls.some((c) => c.end === undefined)
  anim.busy = busy
  const now = Date.now(), dt = anim.at ? Math.min(0.5, (now - anim.at) / 1000) : TICK_MS / 1000
  anim.at = now
  anim.level += ((busy ? 1 : 0.35) - anim.level) * Math.min(1, dt * 1.6)
  anim.phase += (busy ? 2.4 : 0.45) * dt
  const { w, h } = anim.mounted
  await $.ui.blit({ requestId: PANE, key: 'wave', cells: pack(wave(w, 2, anim.phase, anim.level, P)) })
  if (anim.tick % 4 === 0) {
    const pulse = 0.5 + 0.5 * Math.sin(anim.phase * 3)
    await $.ui.blit({ requestId: PANE, key: 'timeline', cells: pack(timeline(timelineRows(s, Math.floor((w - 3) / 2), h), w, h, pulse, P)) })
  }
  // the elapsed times in the text need a redraw now and then while something runs
  if (busy && anim.tick % 8 === 0) $.ui.invalidate('ui.render')
}

export const register: Register = (on, options) => {
  const P = parsePalette(options.palette)
  const width = clampInt(options.width, 40, 100, 58)
  const animate = options.animate !== 'off'
  const demo = options.demo === 'on'
  const openOnStart = options.openOnStart !== false

  // What the animation needs between ticks. It starts over on a reload, which is fine: it is only a phase.
  const anim: Anim = { mounted: null, phase: 0, level: 0.35, tick: 0, busy: false, at: 0 }
  let ids = 0

  /** Never let the pane's own bookkeeping break a call: if the state write fails, carry on. */
  const safe = async (work: () => Promise<unknown>): Promise<void> => {
    try { await work() } catch { /* the pane just misses this event */ }
  }

  on('session.start', async ($, e, next) => {
    await safe(() => $.command.register({ name: 'bridge', description: 'Open the Bridge pane (activity, gate, agents, files)' }))
    if (demo) await safe(async () => update($, bridge, () => demoState(Date.now())))
    if (openOnStart) await safe(() => $.ui.open({ id: PANE, title: 'Bridge', columns: width }))
    if (animate) {
      $.clock.every(TICK_MS, () => {
        anim.tick++
        void safe(() => paint($, anim, P))
      })
    }
    return next(e)
  })

  on('command.run', { command: 'bridge' }, async ($) => {
    await $.ui.open({ id: PANE, title: 'Bridge', columns: width })
    return { text: 'Bridge pane opened.' }
  })

  on('turn.start', async ($, e, next) => {
    anim.busy = true   // wake the heartbeat at once
    const now = Date.now()
    await safe(async () => update($, bridge, (s) => onTurnStart(s, now)))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const now = Date.now()
    const out = await next(e)
    if (e.agentId) await safe(async () => update($, bridge, (s) => onAgentEnd(s, e.agentId as string, now)))
    else await safe(async () => update($, bridge, (s) => onTurnComplete(s, { durationMs: e.durationMs, reason: e.reason, out: e.usage?.output_tokens }, now)))
    return out
  })

  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id ?? `local-${ids++}`
    const start = Date.now()
    const file = kindOf(e.tool) === 'write' ? pathOf(e) : undefined
    await safe(async () => update($, bridge, (s) => {
      const started = onToolStart(s, { id, tool: e.tool, sub: Boolean(e.agentId), target: targetOf(e) }, start)
      return file ? onFile(started, file) : started
    }))
    let failed = false
    try {
      const ran = await next(e)
      failed = Boolean(ran && (('deny' in ran && ran.deny) || ('isError' in ran && ran.isError)))
      return ran
    } catch (err) {
      failed = true
      throw err
    } finally {
      const end = Date.now()
      await safe(async () => update($, bridge, (s) => onToolEnd(s, id, failed, end)))
    }
  })

  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (e.tool_use_id) await safe(async () => update($, bridge, (s) => onGate(s, verdict.decision)))   // a query is not a decision
    return verdict
  })

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    if (spawned.agentId) {
      const now = Date.now()
      await safe(async () => update($, bridge, (s) => onAgentStart(s, { id: spawned.agentId as string, type: e.subagentType, label: e.description }, now)))
    }
    return spawned
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const Raster = 'Raster' in ui ? ui.Raster : undefined   // terminal only; elsewhere the pane is text
    const s = await read($, bridge)
    const now = Date.now()
    const screen = e.viewport?.columns ?? 160
    const w = Math.max(24, Math.min(width, screen - 6))
    const tall = (e.viewport?.rows ?? 40) >= 34
    const rows = tall ? 8 : 5   // not `h`: JSX compiles to calls of the global h
    anim.mounted = { w, h: rows }

    const calls = s.calls.length
    const mix = mixCounts(s)
    const running = runningAgents(s)
    const turn = s.turns.find((t) => t.n === s.turn)
    const elapsed = s.working && turn ? fmtDuration(now - turn.at) : ''
    const last = lastTurn(s)
    const lastStats = last ? turnStats(s, last.n) : undefined
    const sub = (text: string) => <Text color={P.faint}>{text}</Text>

    const Heading = (title: string, right = '') => (
      <Box justifyContent="space-between" marginTop={1}>
        <Text><Text color={P.coral}>▍ </Text><Text bold color={P.fg}>{title}</Text></Text>
        {sub(right)}
      </Box>
    )

    const state = s.working
      ? <Text bold color={P.coral}>● WORKING{elapsed ? ` ${elapsed}` : ''}</Text>
      : <Text color={P.faint}>○ IDLE</Text>

    const legend = KINDS.filter((k) => mix[k] > 0).map((k) => <Text color={P.tool[k]}>● {mix[k]} {k}   </Text>)

    return (
      <Box flexDirection="column" paddingX={1} paddingBottom={1} backgroundColor={P.surface}>
        <Box justifyContent="space-between">
          <Text><Text color={P.coral}>▍ </Text><Text bold color={P.fg}>BRIDGE</Text></Text>
          {state}
        </Box>
        {Raster && <Box marginTop={1}><Raster key="wave" columns={w} rows={2} cells={pack(wave(w, 2, anim.phase, anim.level, P))} /></Box>}

        {Heading('ACTIVITY', calls ? `${plural(calls, 'call')} · ${plural(s.turns.length, 'turn')}` : 'nothing yet')}
        {Raster && <Box marginTop={1}><Raster key="timeline" columns={w} rows={rows} cells={pack(timeline(timelineRows(s, Math.floor((w - 3) / 2), rows), w, rows, 1, P))} /></Box>}
        {calls > 0 && <Box flexWrap="wrap" marginTop={1}>{legend}</Box>}
        {Raster && <Box marginTop={1}><Raster key="mix" columns={w} rows={1} cells={pack(mixBar(s, w, P))} /></Box>}

        {Heading('GATE', `${s.gate.allow} allowed · ${s.gate.ask} asked · ${s.gate.deny} denied`)}
        {Raster && <Box marginTop={1}><Raster key="gate" columns={w} rows={1} cells={pack(gateBar(s, w, P))} /></Box>}

        {Heading('AGENTS', running.length ? `${running.length} running` : s.agents.length ? 'all done' : 'none')}
        {[...s.agents].sort((a, b) => Number(a.end !== undefined) - Number(b.end !== undefined) || b.at - a.at).slice(0, 4).map((a) => (
          <Box justifyContent="space-between">
            <Text color={a.end === undefined ? P.coral : P.muted} wrap="truncate-end">{a.end === undefined ? '● ' : '✓ '}{a.label || a.type}</Text>
            {sub(`${a.type} · ${fmtDuration((a.end ?? now) - a.at)}`)}
          </Box>
        ))}

        {Heading('HOT FILES', s.files && Object.keys(s.files).length ? 'most edited' : 'none edited')}
        {topFiles(s, 4).map((f) => (
          <Box justifyContent="space-between">
            <Text color={P.fg} wrap="truncate-start">{shortPath(f.path, w - 6)}</Text>
            {sub(`×${f.count}`)}
          </Box>
        ))}

        {last && lastStats && (
          <Box flexDirection="column">
            {Heading('LAST TURN', `#${last.n}`)}
            <Text color={P.muted}>
              {plural(lastStats.tools, 'tool')} · <Text color={lastStats.errors ? P.err : P.ok}>{plural(lastStats.errors, 'error')}</Text> · {fmtDuration(last.durationMs ?? (last.end ?? now) - last.at)}{last.out ? ` · ${fmtCount(last.out)} out` : ''}
            </Text>
          </Box>
        )}
      </Box>
    )
  })
}
