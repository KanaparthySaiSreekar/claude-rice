// The colours the pane draws with. Everything is a plain "#RRGGBB" string so the palette can arrive as one JSON
// option (`options.palette`), written by the rice's apply step from the same palette file that drives the terminal,
// the theme and the status line. A missing or malformed option falls back to the defaults, key by key.

export type Kind = 'read' | 'write' | 'run' | 'search' | 'web' | 'mcp' | 'agent' | 'other'
export const KINDS: readonly Kind[] = ['read', 'write', 'run', 'search', 'web', 'mcp', 'agent', 'other']

export type Palette = {
  bg: string
  surface: string
  raised: string
  line: string
  dim: string
  faint: string
  muted: string
  fg: string
  ok: string
  warn: string
  err: string
  coral: string
  ramp: string[]
  tool: Record<Kind, string>
}

/** Claude Ember: near-black, hot orange, warm white. Keep in step with palette/palettes.json in the rice (a test there checks the colours agree). */
export const EMBER: Palette = {
  bg: '#0A0908',
  surface: '#121110',
  raised: '#1B1917',
  line: '#3B352F',
  dim: '#80776D',
  faint: '#9E948A',
  muted: '#BFB5AA',
  fg: '#F8F4EE',
  ok: '#8ED69B',
  warn: '#FFC53D',
  err: '#FF4D4D',
  coral: '#FF7A1A',
  ramp: ['#FFE3A3', '#FFC53D', '#FF7A1A', '#F0451E'],
  tool: { read: '#FFF6E8', write: '#FF7A1A', run: '#FFC53D', search: '#E6D8C3', web: '#FFA55C', mcp: '#E8553C', agent: '#FFD9B0', other: '#B3A99E' },
}

const HEX = /^#[0-9a-fA-F]{6}$/
const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

/** Merge whatever valid colours the option carries over the defaults. Never throws. */
export function parsePalette(raw: unknown): Palette {
  let given: unknown = raw
  if (typeof raw === 'string') {
    try {
      given = JSON.parse(raw)
    } catch {
      return EMBER
    }
  }
  if (typeof given !== 'object' || given === null) return EMBER
  const g = given as Record<string, unknown>
  const out: Palette = { ...EMBER, ramp: [...EMBER.ramp], tool: { ...EMBER.tool } }
  for (const k of ['bg', 'surface', 'raised', 'line', 'dim', 'faint', 'muted', 'fg', 'ok', 'warn', 'err', 'coral'] as const) {
    if (isHex(g[k])) out[k] = g[k] as string
  }
  if (Array.isArray(g.ramp) && g.ramp.length >= 2 && g.ramp.length <= 12 && g.ramp.every(isHex)) out.ramp = [...(g.ramp as string[])]
  if (typeof g.tool === 'object' && g.tool !== null) {
    for (const k of KINDS) {
      const v = (g.tool as Record<string, unknown>)[k]
      if (isHex(v)) out.tool[k] = v
    }
  }
  return out
}

export const toInt = (hex: string): number => parseInt(hex.slice(1), 16)
