import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPTY, MAX_CALLS, MAX_FILES, kindOf, clean, fmtDuration, fmtCount, shortPath, plural,
  onTurnStart, onTurnComplete, onToolStart, onToolEnd, onFile, onGate, onAgentStart, onAgentEnd,
  mixCounts, timelineRows, topFiles, turnStats, lastTurn, runningAgents, runningCalls, demoState,
} from '../hooks/core'
import { KINDS, EMBER, parsePalette, toInt } from '../hooks/palette'

const deepFreeze = (o) => { Object.values(o).forEach((v) => typeof v === 'object' && v !== null && deepFreeze(v)); return Object.freeze(o) }

test('every tool maps to a kind, MCP tools to mcp, unknown ones to other', () => {
  const expect = { Read: 'read', Edit: 'write', Write: 'write', MultiEdit: 'write', NotebookEdit: 'write', Bash: 'run', PowerShell: 'run', Grep: 'search', Glob: 'search', WebFetch: 'web', WebSearch: 'web', Agent: 'agent', Task: 'agent', TodoWrite: 'other', ToolSearch: 'other', mcp__astral__price_get: 'mcp', mcp__x: 'mcp' }
  for (const [tool, kind] of Object.entries(expect)) assert.equal(kindOf(tool), kind, tool)
  assert.ok(KINDS.every((k) => typeof k === 'string'))
})

test('a turn: start opens it, tools join it, complete closes it with a receipt', () => {
  let s = onTurnStart(EMPTY, 1000)
  assert.equal(s.working, true); assert.equal(s.turn, 1); assert.equal(s.startedAt, 1000)
  s = onToolStart(s, { id: 'a', tool: 'Read' }, 1100)
  s = onToolEnd(s, 'a', false, 1300)
  s = onToolStart(s, { id: 'b', tool: 'Bash', target: 'npm test' }, 1400)
  s = onToolEnd(s, 'b', true, 1900)
  s = onTurnComplete(s, { durationMs: 2000, reason: 'answer', out: 1234 }, 3000)
  assert.equal(s.working, false)
  assert.deepEqual(turnStats(s, 1), { tools: 2, errors: 1 })
  assert.deepEqual(lastTurn(s), { n: 1, at: 1000, end: 3000, durationMs: 2000, reason: 'answer', out: 1234 })
  assert.equal(s.calls[0].err, undefined); assert.equal(s.calls[1].err, true); assert.equal(s.calls[1].target, 'npm test')
})

test('a call that arrives before any turn.start opens an implicit first turn', () => {
  const s = onToolStart(EMPTY, { id: 'x', tool: 'Grep' }, 5000)
  assert.equal(s.turn, 1); assert.equal(s.calls[0].turn, 1); assert.equal(s.working, true)
})

test('a turn that ends interrupted marks its still-running calls ended and failed; a clean one only ends them', () => {
  const run = (reason) => {
    let s = onToolStart(onTurnStart(EMPTY, 0), { id: 'r', tool: 'Bash' }, 10)
    s = onTurnComplete(s, { reason }, 500)
    return s.calls[0]
  }
  assert.deepEqual([run('aborted').end, run('aborted').err], [500, true])
  assert.deepEqual([run('error').err, run('refusal').err], [true, true])
  assert.deepEqual([run('answer').end, run('answer').err], [500, undefined])
})

test('subagent calls ride on the main turn and are flagged', () => {
  let s = onTurnStart(EMPTY, 0)
  s = onToolStart(s, { id: 'p', tool: 'Agent' }, 10)
  s = onToolStart(s, { id: 'q', tool: 'Read', sub: true }, 20)
  assert.equal(s.calls[1].turn, 1); assert.equal(s.calls[1].sub, true); assert.equal(s.calls[0].sub, undefined)
})

test('ending an unknown call changes nothing', () => {
  const s = onToolStart(EMPTY, { id: 'a', tool: 'Read' }, 0)
  assert.equal(onToolEnd(s, 'zzz', true, 5), s)
})

test('reducers never mutate their input', () => {
  const s0 = deepFreeze(demoState(1_000_000))
  assert.doesNotThrow(() => {
    let s = onTurnStart(s0, 1)
    s = onToolStart(s, { id: 'n', tool: 'Edit', target: 'f' }, 2)
    s = onToolEnd(s, 'n', true, 3)
    s = onFile(s, 'f'); s = onGate(s, 'deny'); s = onAgentStart(s, { id: 'g', type: 't', label: 'l' }, 4); s = onAgentEnd(s, 'g', 5)
    onTurnComplete(s, { reason: 'answer' }, 6)
  })
})

test('the call list is capped, newest kept', () => {
  let s = onTurnStart(EMPTY, 0)
  for (let i = 0; i < MAX_CALLS + 25; i++) s = onToolStart(s, { id: `c${i}`, tool: 'Read' }, i)
  assert.equal(s.calls.length, MAX_CALLS); assert.equal(s.calls.at(-1).id, `c${MAX_CALLS + 24}`); assert.equal(s.calls[0].id, 'c25')
})

test('files: counted per path, ranked by edits then recency, capped', () => {
  let s = EMPTY
  for (const p of ['a.ts', 'b.ts', 'a.ts', 'c.ts', 'a.ts', 'b.ts']) s = onFile(s, p)
  assert.deepEqual(topFiles(s, 2), [{ path: 'a.ts', count: 3 }, { path: 'b.ts', count: 2 }])
  assert.deepEqual(topFiles(s, 9).map((f) => f.path), ['a.ts', 'b.ts', 'c.ts'])
  s = EMPTY
  for (let i = 0; i < MAX_FILES + 10; i++) s = onFile(s, `f${i}`)
  assert.equal(Object.keys(s.files).length, MAX_FILES)
  assert.equal(onFile(EMPTY, '   '), EMPTY)
})

test('gate counts allow, ask and deny and ignores anything else', () => {
  let s = EMPTY
  for (const d of ['allow', 'allow', 'ask', 'deny', 'allow', 'weird', undefined]) s = onGate(s, d)
  assert.deepEqual(s.gate, { allow: 3, ask: 1, deny: 1 })
})

test('agents start running and end once', () => {
  let s = onAgentStart(EMPTY, { id: 'a1', type: 'Explore', label: 'look around' }, 100)
  assert.equal(runningAgents(s).length, 1)
  s = onAgentEnd(s, 'a1', 400); s = onAgentEnd(s, 'a1', 900)
  assert.equal(runningAgents(s).length, 0); assert.equal(s.agents[0].end, 400, 'a second end does not move it')
})

test('mix counts every kind, including zeros', () => {
  const s = demoState(2_000_000)
  const m = mixCounts(s)
  assert.deepEqual(Object.keys(m).sort(), [...KINDS].sort())
  assert.equal(Object.values(m).reduce((a, b) => a + b, 0), s.calls.length)
})

test('timeline rows: grouped by turn, wrapped at the width, only the last rows, first-of-turn flagged', () => {
  let s = EMPTY
  for (let t = 0; t < 4; t++) { s = onTurnStart(s, t); for (let i = 0; i < 3 + t * 2; i++) s = onToolStart(s, { id: `t${t}c${i}`, tool: 'Read' }, t * 100 + i) }
  const all = timelineRows(s, 100, 100)
  assert.deepEqual(all.map((r) => [r.turn, r.calls.length, r.first]), [[1, 3, true], [2, 5, true], [3, 7, true], [4, 9, true]])
  const wrapped = timelineRows(s, 4, 100)
  assert.deepEqual(wrapped.filter((r) => r.turn === 3).map((r) => [r.calls.length, r.first]), [[4, true], [3, false]])
  assert.ok(wrapped.every((r) => r.calls.length <= 4))
  assert.equal(timelineRows(s, 4, 3).length, 3); assert.equal(timelineRows(s, 4, 3).at(-1).turn, 4)
  assert.deepEqual(timelineRows(EMPTY, 5, 5), [])
  assert.equal(timelineRows(s, 0, 5).every((r) => r.calls.length === 1), true, 'a zero width still shows one call a row')
})

test('formatters', () => {
  assert.equal(fmtDuration(400), '<1s'); assert.equal(fmtDuration(42000), '42s'); assert.equal(fmtDuration(211000), '3m31s')
  assert.equal(fmtDuration(3720000), '1h02m'); assert.equal(fmtDuration(-1), ''); assert.equal(fmtDuration(NaN), '')
  assert.equal(fmtCount(512), '512'); assert.equal(fmtCount(1500), '1.5k'); assert.equal(fmtCount(18200), '18k'); assert.equal(fmtCount(2_400_000), '2.4M')
  assert.equal(plural(1, 'tool'), '1 tool'); assert.equal(plural(3, 'tool'), '3 tools'); assert.equal(plural(0, 'error'), '0 errors')
})

test('shortPath keeps the file name, trims from the left, handles both slashes', () => {
  assert.equal(shortPath('C:\\Users\\me\\proj\\statusline\\deck.mjs', 40), 'C:/Users/me/proj/statusline/deck.mjs')
  assert.equal(shortPath('C:\\Users\\me\\proj\\statusline\\deck.mjs', 19), 'statusline/deck.mjs')
  assert.equal(shortPath('C:\\Users\\me\\proj\\statusline\\deck.mjs', 18), 'deck.mjs', 'one cell short of the parent folder drops it')
  assert.equal(shortPath('/a/b/c/deck.mjs', 12), 'b/c/deck.mjs')
  assert.equal(shortPath('/a/b/c/deck.mjs', 11), 'c/deck.mjs')
  assert.equal(shortPath('deck.mjs', 40), 'deck.mjs')
  assert.equal(shortPath('/a/very-long-directory-name/with-a-very-long-file-name.mjs', 14), '…file-name.mjs')
  for (const w of [1, 5, 14, 40]) assert.ok(shortPath('C:\\x\\y\\z\\file-with-quite-a-long-name.ts', w).length <= w)
})

test('text from tool input cannot carry control characters', () => {
  const evil = 'a' + String.fromCharCode(27) + ']0;pwned' + String.fromCharCode(7) + 'b'
  const out = clean(evil, 40)
  assert.ok(!/[\u0000-\u001f\u007f-\u009f]/.test(out)); assert.equal(clean(null), ''); assert.equal(clean('x'.repeat(100), 10).length, 10)
  assert.ok(!/[\u0000-\u001f]/.test(onAgentStart(EMPTY, { id: 'z', type: evil, label: evil }, 0).agents[0].label))
  assert.ok(!/[\u0000-\u001f]/.test(Object.keys(onFile(EMPTY, evil).files)[0]))
})

test('the demo state is deterministic and shows every part of the pane', () => {
  const a = demoState(5_000_000), b = demoState(5_000_000)
  assert.deepEqual(a, b)
  assert.equal(a.working, true); assert.ok(a.turn >= 6)
  assert.ok(runningCalls(a).length >= 1, 'a call is running'); assert.ok(runningAgents(a).length >= 1, 'an agent is running'); assert.ok(a.agents.some((x) => x.end))
  assert.ok(a.calls.some((c) => c.err), 'a failed call'); assert.ok(a.calls.some((c) => c.sub), 'a subagent call')
  assert.ok(Object.values(mixCounts(a)).filter((n) => n > 0).length >= 6, 'six kinds or more')
  assert.ok(a.gate.allow > 100 && a.gate.deny === 1); assert.ok(topFiles(a, 5).length >= 3); assert.ok(lastTurn(a))
  assert.ok(a.calls.every((c) => KINDS.includes(c.kind) && c.at > 0))
})

test('the palette option: valid colours merge over the defaults, anything else is ignored', () => {
  assert.deepEqual(parsePalette(undefined), EMBER); assert.deepEqual(parsePalette('not json'), EMBER); assert.deepEqual(parsePalette('[1,2]'), EMBER); assert.deepEqual(parsePalette(42), EMBER)
  const p = parsePalette(JSON.stringify({ coral: '#112233', ok: 'red', ramp: ['#000000', '#FFFFFF'], tool: { read: '#010203', run: 'nope' } }))
  assert.equal(p.coral, '#112233'); assert.equal(p.ok, EMBER.ok, 'invalid colour keeps the default'); assert.deepEqual(p.ramp, ['#000000', '#FFFFFF'])
  assert.equal(p.tool.read, '#010203'); assert.equal(p.tool.run, EMBER.tool.run)
  assert.deepEqual(parsePalette({ ramp: ['#000000'] }).ramp, EMBER.ramp, 'a one-stop ramp is rejected')
  assert.deepEqual(parsePalette({ ramp: ['#000000', 'bad'] }).ramp, EMBER.ramp)
  assert.equal(toInt('#FF8F66'), 0xff8f66)
  assert.notEqual(parsePalette({ coral: '#112233' }).tool, EMBER.tool, 'tool table is a copy, not shared')
})
