// Painters for the pane's Rasters. A Raster is a grid of cells, each a glyph with a foreground and a background
// (RasterProps in the mod API); the painters here use eighth-block glyphs (the wave) and half-cell splits (the bars) to
// land on finer steps than whole cells.
// Pure functions returning plain cell grids, so they are tested without Claude Code.
import { KINDS, toInt } from './palette'
import type { Palette } from './palette'
import { mixCounts } from './core'
import type { Bridge, TimelineRow } from './core'

export type Cells = { columns: number; rows: number; words: Uint32Array }

// ------------------------------------------------------------------------------------------------ colour
const clamp = (v: number, lo = 0, hi = 255): number => (v < lo ? lo : v > hi ? hi : v)
export const chan = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255]
export const rgb = (r: number, g: number, b: number): number => ((clamp(Math.round(r)) << 16) | (clamp(Math.round(g)) << 8) | clamp(Math.round(b))) >>> 0
export function mix(a: number, b: number, t: number): number {
  const [ar, ag, ab] = chan(a), [br, bg, bb] = chan(b)
  return rgb(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}
export function rampAt(stops: number[], t: number): number {
  if (stops.length === 1 || t <= 0) return stops[0]
  if (t >= 1) return stops[stops.length - 1]
  const x = t * (stops.length - 1), i = Math.floor(x)
  return mix(stops[i], stops[i + 1], x - i)
}
const pingpong = (t: number): number => { const m = ((t % 2) + 2) % 2; return m > 1 ? 2 - m : m }
const TAU = Math.PI * 2

// ------------------------------------------------------------------------------------------------ cells
const BMP_PRINTABLE = (cp: number): boolean => cp >= 0x20 && cp <= 0xffff && !(cp >= 0xd800 && cp <= 0xdfff) && !(cp >= 0x7f && cp <= 0x9f)

export function blank(columns: number, rows: number, bg: number): Cells {
  const words = new Uint32Array(columns * rows * 3)
  for (let i = 0; i < columns * rows; i++) { words[i * 3] = 0x20; words[i * 3 + 1] = bg; words[i * 3 + 2] = bg }
  return { columns, rows, words }
}

export function put(c: Cells, x: number, y: number, ch: string, fg: number, bg: number): void {
  if (x < 0 || y < 0 || x >= c.columns || y >= c.rows) return
  const cp = ch.codePointAt(0) ?? 0x20
  const i = (y * c.columns + x) * 3
  c.words[i] = BMP_PRINTABLE(cp) ? cp : 0x20
  c.words[i + 1] = fg
  c.words[i + 2] = bg
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
/** Standard padded base64, written out by hand: the mod runtime is not Node and has no Buffer. */
export function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0
    const n = (a << 16) | (b << 8) | c
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=')
  }
  return out
}

/** `cells` as the Raster element wants them: row-major little-endian u32 triplets [code point, foreground, background]. */
export function pack(c: Cells): string {
  return toBase64(new Uint8Array(c.words.buffer, c.words.byteOffset, c.words.byteLength))
}

/** How many distinct (foreground, background) pairs a grid uses; the terminal paints 1024 at once, the rest as nearest. */
export function pairCount(c: Cells): number {
  const seen = new Set<number>()
  for (let i = 0; i < c.columns * c.rows; i++) seen.add(c.words[i * 3 + 1] * 16777216 + c.words[i * 3 + 2])
  return seen.size
}

// ------------------------------------------------------------------------------------------------ the wave
const EIGHTHS = ' ▁▂▃▄▅▆▇█'

/**
 * The pane's heartbeat: an equaliser, one bar every other column, heights from a smooth travelling mix of sines. Each
 * cell takes its colour from its height in the bar, so every bar runs hot at the foot to bright at the tip, like a
 * flame. `phase` is the animation clock (the caller advances it faster while Claude works) and `intensity` the
 * overall height (about 0.35 idle, 1 working). Every bar keeps at least one eighth, so an idle pane still has a line.
 */
export function wave(columns: number, rows: number, phase: number, intensity: number, P: Palette): Cells {
  const W = Math.max(1, columns), eighths = rows * 8
  const stops = P.ramp.map(toInt), bg = toInt(P.surface)
  const out = blank(W, rows, bg)
  for (let x = 0; x < W; x += 2) {
    const u = x / Math.max(1, W - 1)
    const n = 0.5 + 0.5 * (0.55 * Math.sin(TAU * 1.1 * u - phase * 1.3) + 0.3 * Math.sin(TAU * 2.7 * u + phase * 2.1) + 0.15 * Math.sin(TAU * 5.3 * u - phase * 3.4))
    const h = clamp(Math.round((0.1 + 0.9 * n) * clamp(intensity, 0, 1) * eighths), 1, eighths)
    for (let r = 0; r < rows; r++) {
      const fromBottom = rows - 1 - r
      const fill = clamp(h - fromBottom * 8, 0, 8)
      if (fill === 0) continue
      put(out, x, r, EIGHTHS[fill], rampAt(stops, 1 - (fromBottom + 0.5) / rows), bg)
    }
  }
  return out
}

// ------------------------------------------------------------------------------------------------ the timeline
/**
 * One glowing dot per tool call, a row per turn (a long turn wraps), newest at the bottom, the turn number in the margin.
 * A running call pulses with `pulse` (0..1), a failed one is a red ✕, a subagent's call a smaller, dimmer dot.
 */
export function timeline(rows: TimelineRow[], columns: number, height: number, pulse: number, P: Palette): Cells {
  const bg = toInt(P.surface), dim = toInt(P.dim), err = toInt(P.err)
  const out = blank(columns, Math.max(1, height), bg)
  if (rows.length === 0) {
    // nothing yet: a faint hint in the middle, so an empty pane reads as waiting rather than broken
    const hint = 'waiting for the first tool call'
    const x0 = Math.max(0, Math.floor((columns - hint.length) / 2)), y = Math.floor((out.rows - 1) / 2)
    for (let i = 0; i < hint.length && x0 + i < columns; i++) put(out, x0 + i, y, hint[i], mix(dim, bg, 0.25), bg)
    return out
  }
  const first = out.rows - rows.length
  rows.forEach((row, i) => {
    const y = first + i
    if (y < 0) return
    if (row.first) {
      const label = String(row.turn % 100).padStart(2, '0')
      put(out, 0, y, label[0], dim, bg); put(out, 1, y, label[1], dim, bg)
    } else {
      put(out, 1, y, '↳', mix(dim, bg, 0.4), bg)
    }
    row.calls.forEach((call, j) => {
      const x = 3 + j * 2
      const kind = toInt(P.tool[call.kind])
      if (call.err) put(out, x, y, '✕', err, bg)
      else if (call.end === undefined) put(out, x, y, '●', mix(kind, bg, 0.7 * (1 - pulse)), bg)
      else if (call.sub) put(out, x, y, '•', mix(kind, bg, 0.4), bg)
      else put(out, x, y, '●', kind, bg)
    })
  })
  return out
}

// ------------------------------------------------------------------------------------------------ stacked bars
export type Segment = { weight: number; color: number }

/**
 * A one-row stacked bar. Where two segments meet inside a cell the cell is `▌` with the left segment as foreground and
 * the right as background, so boundaries land on half-cell steps.
 */
export function stackedBar(segments: Segment[], columns: number, P: Palette): Cells {
  const track = toInt(P.raised)
  const out = blank(columns, 1, track)
  const live = segments.filter((s) => s.weight > 0)
  const total = live.reduce((n, s) => n + s.weight, 0)
  if (total === 0) {
    for (let x = 0; x < columns; x++) put(out, x, 0, '▁', toInt(P.line), track)
    return out
  }
  const at = (pos: number): number => {
    let acc = 0
    for (const s of live) { acc += s.weight; if (pos < acc) return s.color }
    return live[live.length - 1].color
  }
  for (let x = 0; x < columns; x++) {
    const a = at(((x + 0.25) / columns) * total), b = at(((x + 0.75) / columns) * total)
    if (a === b) put(out, x, 0, '█', a, a)
    else put(out, x, 0, '▌', a, b)
  }
  return out
}

export function mixBar(s: Bridge, columns: number, P: Palette): Cells {
  const counts = mixCounts(s)
  return stackedBar(KINDS.map((k) => ({ weight: counts[k], color: toInt(P.tool[k]) })), columns, P)
}

export function gateBar(s: Bridge, columns: number, P: Palette): Cells {
  return stackedBar([
    { weight: s.gate.allow, color: toInt(P.ok) },
    { weight: s.gate.ask, color: toInt(P.warn) },
    { weight: s.gate.deny, color: toInt(P.err) },
  ], columns, P)
}
