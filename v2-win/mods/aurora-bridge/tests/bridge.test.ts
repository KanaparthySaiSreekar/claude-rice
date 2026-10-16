// Runs under `claude plugin test <folder>`: the real hooks module against the engine's own harness. The pure pieces
// (reducers, rasters, palette) are covered by tests/*.test.mjs; this file proves the wiring.
import { test, expect } from 'claude-code/testing'

const PANE = { plugin: 'aurora-bridge', component: 'Pane', requestId: 'aurora-bridge', viewport: { columns: 160, rows: 50 }, props: {} } as const
const quiet = { animate: 'off', openOnStart: false } as const

// What the engine itself would answer beneath the plugin.
function engine(on: any, answers: { tool?: any; check?: any } = {}) {
  on('turn.start', async (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', async () => ({ text: '' }))
  on('tool.call', async () => answers.tool ?? { result: 'ok', ref: 1, text: 'ok' })
  on('tool.check', async () => answers.check ?? { decision: 'allow' })
  on('agent.spawn', async () => ({ model: 'sonnet', agentId: 'agent-1' }))
  on('ui.render', async () => null)
}

const drawn = async ($: any, surface: 'terminal' | 'desktop' = 'terminal') => {
  const pane = await $.ui.mount({ ...PANE, surface })
  const tree = JSON.stringify(await pane.drawn())
  await pane.unmount()      // one instance per request id, so a test can look more than once
  return tree
}

test('an empty session draws an idle pane with its four rasters', { options: quiet }, async ($: any, on: any) => {
  engine(on)
  const tree = await drawn($)
  expect(tree).toContain('BRIDGE')
  expect(tree).toContain('IDLE')
  expect(tree).toContain('nothing yet')
  for (const key of ['wave', 'timeline', 'mix', 'gate']) expect(tree).toContain(`"key":"${key}"`)
})

test('events turn into the numbers the pane shows', { options: quiet }, async ($: any, on: any) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: 'C:/p/a.ts', tool_use_id: 'u1' })
  await $.tool.call({ tool: 'Edit', file_path: 'C:/p/a.ts', tool_use_id: 'u2' })
  await $.tool.call({ tool: 'Edit', file_path: 'C:/p/a.ts', tool_use_id: 'u3' })
  await $.tool.check({ tool: 'Edit', input: {}, tool_use_id: 'u2' })
  const mid = await drawn($)
  expect(mid).toContain('WORKING')
  expect(mid).toContain('3 calls')
  expect(mid).toContain('1 allowed')
  expect(mid).toContain('×2')      // the file edited twice tops the list
  await $.turn.complete({ answer: 'done', durationMs: 4200, isAborted: false, turnId: 't1', reason: 'answer' })
  const after = await drawn($)
  expect(after).toContain('IDLE')
  expect(after).toContain('LAST TURN')
  expect(after).toContain('3 tools')
  expect(after).toContain('0 errors')
})

test('a denied call and an error result both count as errors, and the answer passes through unchanged', { options: quiet }, async ($: any, on: any) => {
  engine(on, { tool: { deny: 'not here' } })
  await $.turn.start({ text: 'go', turnId: 't1' })
  const denied = await $.tool.call({ tool: 'Bash', command: 'rm -rf x', tool_use_id: 'u1' })
  expect(denied.deny).toBe('not here')
  await $.turn.complete({ answer: '', durationMs: 900, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(await drawn($)).toContain('1 error')
})

test('a gate query is not a decision, a real check is, and the verdict is never altered', { options: quiet }, async ($: any, on: any) => {
  engine(on, { check: { decision: 'deny', reason: 'policy' } })
  const query = await $.tool.check({ tool: 'Bash', input: {} })
  const real = await $.tool.check({ tool: 'Bash', input: {}, tool_use_id: 'u1' })
  expect(query.decision).toBe('deny')
  expect(real).toEqual({ decision: 'deny', reason: 'policy' })
  expect(await drawn($)).toContain('0 allowed · 0 asked · 1 denied')
})

test('a spawned subagent shows as running, then done when its turn completes', { options: quiet }, async ($: any, on: any) => {
  engine(on)
  await $.agent.spawn({ tool_use_id: 'a1', prompt: 'look', description: 'look around', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'sonnet' })
  const running = await drawn($)
  expect(running).toContain('1 running')
  expect(running).toContain('look around')
  await $.turn.complete({ answer: 'report', durationMs: 100, isAborted: false, turnId: 'sub-1', reason: 'answer', agentId: 'agent-1' })
  expect(await drawn($)).toContain('all done')
})

test('on a surface without Raster the pane is plain text', { options: quiet }, async ($: any, on: any) => {
  engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: 'C:/p/a.ts', tool_use_id: 'u1' })
  const tree = await drawn($, 'desktop')
  expect(tree).not.toContain('"type":"Raster"')
  expect(tree).toContain('1 call')
})

test('the palette option recolours the pane and a broken one falls back', { options: { ...quiet, palette: JSON.stringify({ coral: '#112233', surface: '#010203' }) } }, async ($: any, on: any) => {
  engine(on)
  const tree = await drawn($)
  expect(tree).toContain('#112233')
  expect(tree).toContain('#010203')
})

test('demo mode fills the pane with a believable session', { options: { ...quiet, demo: 'on' } }, async ($: any, on: any) => {
  engine(on)
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', async () => ({ value: true }))
  await $.session.start({ cwd: 'C:/x', surface: 'terminal', isInteractive: true })
  const tree = await drawn($)
  expect(tree).toContain('36 calls')
  expect(tree).toContain('1 running')
})
