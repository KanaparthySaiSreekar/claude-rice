import test from 'node:test'
import assert from 'node:assert/strict'
import { toBase64, pack, pairCount, blank, put, mix, rgb, chan, rampAt, wave, timeline, stackedBar, mixBar, gateBar } from '../hooks/raster'
import { timelineRows, demoState, onTurnStart, onToolStart, EMPTY } from '../hooks/core'
import { EMBER, toInt } from '../hooks/palette'

const P = EMBER
const GLYPH_OK = (cp) => cp >= 0x20 && cp <= 0xffff && !(cp >= 0xd800 && cp <= 0xdfff) && !(cp >= 0x7f && cp <= 0x9f)
const cell = (c, x, y) => { const i = (y * c.columns + x) * 3; return { ch: String.fromCodePoint(c.words[i]), fg: c.words[i + 1], bg: c.words[i + 2] } }
const validCells = (c) => {
  assert.equal(c.words.length, c.columns * c.rows * 3)
  for (let i = 0; i < c.columns * c.rows; i++) {
    assert.ok(GLYPH_OK(c.words[i * 3]), `cell ${i} glyph ${c.words[i * 3]}`)
    assert.ok(c.words[i * 3 + 1] <= 0xffffff && c.words[i * 3 + 2] <= 0xffffff, `cell ${i} colour`)
  }
}
const luma = (c) => { const [r, g, b] = chan(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const brightness = (c) => { let sum = 0; for (let i = 0; i < c.columns * c.rows; i++) sum += luma(c.words[i * 3 + 1]) + luma(c.words[i * 3 + 2]); return sum / (2 * c.columns * c.rows) }

test('base64 matches Node for every remainder length', () => {
  for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 100, 255]) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 255)
    assert.equal(toBase64(bytes), Buffer.from(bytes).toString('base64'), `${n} bytes`)
  }
})

test('pack: little-endian u32 triplets that decode back to the cells', () => {
  const c = blank(3, 2, 0x112233)
  put(c, 1, 1, '█', 0xff8800, 0x010203)
  const raw = Buffer.from(pack(c), 'base64')
  assert.equal(raw.length, 3 * 2 * 3 * 4)
  const i = (1 * 3 + 1) * 12
  assert.deepEqual([raw.readUInt32LE(i), raw.readUInt32LE(i + 4), raw.readUInt32LE(i + 8)], [0x2588, 0xff8800, 0x010203])
})

test('put clips to the grid and swaps an unprintable glyph for a space', () => {
  const c = blank(2, 1, 0)
  put(c, -1, 0, 'x', 1, 1); put(c, 5, 0, 'x', 1, 1); put(c, 0, 3, 'x', 1, 1)
  assert.equal(cell(c, 0, 0).ch, ' ')
  put(c, 0, 0, String.fromCharCode(27), 1, 1); assert.equal(cell(c, 0, 0).ch, ' ', 'ESC never reaches the terminal as a glyph')
  put(c, 1, 0, '😀', 1, 1); assert.equal(cell(c, 1, 0).ch, ' ', 'outside the BMP is refused by the Raster, so it is replaced')
})

test('colour helpers', () => {
  assert.equal(mix(0x000000, 0xffffff, 0), 0); assert.equal(mix(0x000000, 0xffffff, 1), 0xffffff); assert.equal(mix(0x000000, 0xfefefe, 0.5), 0x7f7f7f)
  assert.deepEqual(chan(rgb(300, -5, 10.4)), [255, 0, 10])
  const stops = P.ramp.map(toInt)
  assert.equal(rampAt(stops, 0), stops[0]); assert.equal(rampAt(stops, 1), stops.at(-1)); assert.equal(rampAt(stops, -3), stops[0]); assert.equal(rampAt([5], 0.7), 5)
})

test('the wave: right size, only block glyphs on even columns, valid, deterministic, tiny colour budget at any width', () => {
  for (const w of [8, 40, 56, 100, 160]) {
    const r = wave(w, 2, 1.7, 1, P)
    assert.equal(r.columns, w); assert.equal(r.rows, 2); validCells(r)
    for (let y = 0; y < 2; y++) for (let x = 0; x < w; x++) {
      const c = cell(r, x, y)
      if (x % 2 === 1) assert.equal(c.ch, ' ', 'the gap between bars is empty')
      else assert.ok(' ▁▂▃▄▅▆▇█'.includes(c.ch), `bar glyph ${c.ch}`)
    }
    assert.ok(pairCount(r) <= 16, `${w} columns use ${pairCount(r)} colour pairs`)
  }
  assert.deepEqual(wave(56, 2, 2.2, 1, P), wave(56, 2, 2.2, 1, P))
})

test('the wave moves with the phase, is taller when working, always keeps a line, and runs hot at the foot', () => {
  const filled = (c) => { let n = 0; for (let x = 0; x < c.columns; x++) for (let y = 0; y < c.rows; y++) n += Math.max(0, ' ▁▂▃▄▅▆▇█'.indexOf(cell(c, x, y).ch)); return n }
  assert.notDeepEqual(wave(56, 2, 0, 1, P).words, wave(56, 2, 0.9, 1, P).words)
  assert.ok(filled(wave(56, 2, 1, 1, P)) > filled(wave(56, 2, 1, 0.35, P)), 'working is taller than idle')
  const quiet = wave(56, 2, 1, 0, P)
  for (let x = 0; x < 56; x += 2) assert.notEqual(cell(quiet, x, 1).ch, ' ', 'even at zero intensity every bar keeps its foot')
  const loud = wave(56, 2, 0, 1, P); let found = false
  for (let x = 0; x < 56 && !found; x += 2) if (cell(loud, x, 0).ch === '█' || cell(loud, x, 0).ch !== ' ') { found = true; assert.notEqual(cell(loud, x, 0).fg, cell(loud, x, 1).fg, 'the tip and the foot differ in colour') }
  assert.ok(found, 'a bar reaches the top row at full intensity')
  validCells(wave(1, 1, 0.3, 1, P)); validCells(wave(0, 2, 0.3, 1, P))
})

test('an empty timeline shows a centred hint instead of a blank block', () => {
  const c = timeline([], 40, 8, 1, P); validCells(c)
  let line = ''; for (let y = 0; y < 8; y++) { let s = ''; for (let x = 0; x < 40; x++) s += cell(c, x, y).ch; if (s.trim()) line = s.trim() }
  assert.equal(line, 'waiting for the first tool call')
  const narrow = timeline([], 12, 3, 1, P); validCells(narrow)   // narrower than the hint: clipped, never throws
})

test('the timeline: newest row at the bottom, turn numbers in the margin, one dot per call two cells apart', () => {
  let s = EMPTY
  for (let t = 0; t < 3; t++) { s = onTurnStart(s, t); for (let i = 0; i < 2 + t; i++) s = onToolStart(s, { id: `a${t}${i}`, tool: 'Read' }, t * 10 + i) }
  const rows = timelineRows(s, 10, 6)
  const c = timeline(rows, 30, 6, 1, P); validCells(c)
  assert.equal(c.rows, 6)
  assert.equal(cell(c, 0, 5).ch + cell(c, 1, 5).ch, '03', 'newest turn is the last row')
  assert.equal(cell(c, 0, 4).ch + cell(c, 1, 4).ch, '02'); assert.equal(cell(c, 0, 3).ch + cell(c, 1, 3).ch, '01')
  assert.equal(cell(c, 0, 0).ch, ' ', 'rows above the history are empty')
  assert.deepEqual([3, 5, 7, 9, 11].map((x) => cell(c, x, 5).ch), ['●', '●', '●', '●', ' '], 'turn 3 had four calls, drawn two cells apart')
  assert.deepEqual([3, 5, 7].map((x) => cell(c, x, 3).ch), ['●', '●', ' '], 'turn 1 had two calls')
  assert.equal(cell(c, 4, 5).ch, ' ', 'the cell between two dots is empty')
})

test('timeline glyphs: failed ✕ red, running pulses, subagent smaller and dimmer, wrapped rows get ↳', () => {
  const s0 = demoState(9_000_000)
  const rows = timelineRows(s0, 12, 8)
  const c = timeline(rows, 30, 8, 1, P); validCells(c)
  const glyphs = new Set(); for (let y = 0; y < c.rows; y++) for (let x = 0; x < c.columns; x++) glyphs.add(cell(c, x, y).ch)
  for (const g of ['●', '✕', '•']) assert.ok(glyphs.has(g), `missing ${g}`)
  const find = (ch) => { for (let y = 0; y < c.rows; y++) for (let x = 0; x < c.columns; x++) if (cell(c, x, y).ch === ch) return cell(c, x, y) }
  assert.equal(find('✕').fg, toInt(P.err))
  // a running call dims and brightens with the pulse
  let s = onToolStart(onTurnStart(EMPTY, 0), { id: 'run', tool: 'Bash' }, 1)
  const on = cell(timeline(timelineRows(s, 5, 1), 12, 1, 1, P), 3, 0).fg, off = cell(timeline(timelineRows(s, 5, 1), 12, 1, 0, P), 3, 0).fg
  assert.equal(on, toInt(P.tool.run)); assert.ok(luma(off) < luma(on))
  let w = onTurnStart(EMPTY, 0); for (let i = 0; i < 7; i++) w = onToolStart(w, { id: `w${i}`, tool: 'Read' }, i)
  const wrapped = timeline(timelineRows(w, 3, 5), 12, 5, 1, P)
  assert.ok([0, 1, 2, 3, 4].some((y) => cell(wrapped, 1, y).ch === '↳'))
})

test('timeline never throws for an empty history, a narrow width or more rows than room', () => {
  validCells(timeline([], 20, 3, 0.5, P)); validCells(timeline(timelineRows(EMPTY, 5, 5), 5, 1, 0, P))
  const many = timelineRows(demoState(1_000_000), 4, 50)
  validCells(timeline(many, 4, 2, 1, P)); validCells(timeline(many, 3, 3, 1, P))
})

test('stacked bar: a single segment is solid, two meet on a half-cell step, totals proportion the cells', () => {
  const solid = stackedBar([{ weight: 5, color: 0xff0000 }], 10, P)
  for (let x = 0; x < 10; x++) assert.deepEqual(cell(solid, x, 0), { ch: '█', fg: 0xff0000, bg: 0xff0000 })
  const two = stackedBar([{ weight: 1, color: 0xff0000 }, { weight: 1, color: 0x0000ff }], 10, P)
  assert.deepEqual(cell(two, 0, 0).ch, '█'); assert.equal(cell(two, 9, 0).fg, 0x0000ff)
  const split = stackedBar([{ weight: 1, color: 0xff0000 }, { weight: 2, color: 0x00ff00 }], 9, P)   // boundary at 3.0 cells: exactly on a cell edge
  const red = [...Array(9).keys()].filter((x) => cell(split, x, 0).fg === 0xff0000).length
  assert.equal(red, 3)
  const odd = stackedBar([{ weight: 1, color: 0xff0000 }, { weight: 1, color: 0x00ff00 }], 5, P)   // boundary at 2.5 cells: inside cell 2
  assert.deepEqual(cell(odd, 2, 0), { ch: '▌', fg: 0xff0000, bg: 0x00ff00 })
  validCells(solid); validCells(two); validCells(split); validCells(odd)
})

test('stacked bar: empty and zero-weight input draws a quiet track', () => {
  const e = stackedBar([{ weight: 0, color: 1 }], 8, P); validCells(e)
  for (let x = 0; x < 8; x++) assert.equal(cell(e, x, 0).ch, '▁')
  validCells(stackedBar([], 8, P)); validCells(stackedBar([{ weight: 3, color: 5 }], 1, P))
})

test('the mix and gate bars use the tool and status colours', () => {
  const s = demoState(3_000_000)
  const m = mixBar(s, 40, P); validCells(m)
  const colours = new Set(); for (let x = 0; x < 40; x++) { colours.add(cell(m, x, 0).fg); colours.add(cell(m, x, 0).bg) }
  for (const k of ['read', 'write', 'run', 'search']) assert.ok(colours.has(toInt(P.tool[k])), k)
  const g = gateBar(s, 40, P); validCells(g)
  assert.equal(cell(g, 0, 0).fg, toInt(P.ok)); assert.equal(cell(g, 39, 0).fg === toInt(P.err) || cell(g, 39, 0).bg === toInt(P.err) || cell(g, 39, 0).fg === toInt(P.ok), true)
  assert.equal(cell(gateBar(EMPTY, 10, P), 0, 0).ch, '▁')
})
