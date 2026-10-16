// Loads a palette and derives the tokens every generator needs from it, so there is exactly one
// place where colours are chosen. All derived colours are computed in OKLab.
import fs from "node:fs"
import { parseHex, toHex, mix, shade, ramp, contrast } from "./color.mjs"

export function loadPalettes(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"))
  return { default: raw.default, palettes: raw.palettes }
}

export function getPalette(file, name) {
  const { default: def, palettes } = loadPalettes(file)
  const key = name ?? def
  const p = palettes[key]
  if (!p) throw new Error(`no palette "${key}" (have: ${Object.keys(palettes).join(", ")})`)
  return derive(key, p)
}

export function derive(key, p) {
  const bg = parseHex(p.base.bg)
  const a = p.accent
  /** a colour that is `t` of the way from the background toward `hex` */
  const tint = (hex, t) => toHex(mix(bg, parseHex(hex), t))
  const lighter = (hex, t = 0.22) => toHex(shade(parseHex(hex), t))
  const darker = (hex, t = 0.3) => toHex(shade(parseHex(hex), -t))
  const between = (x, y, t = 0.5) => toHex(mix(parseHex(x), parseHex(y), t))
  return {
    key,
    ...p,
    tint, lighter, darker, between,
    /** gradient position t in [0,1] -> "#RRGGBB" */
    gradient: (t) => toHex(ramp(p.ramp, t)),
    semantic: { ok: a.mint, warn: a.amber, err: a.red, info: a.blue },
    diff: {
      added: tint(a.mint, 0.17), removed: tint(a.red, 0.19),
      addedDimmed: tint(a.mint, 0.1), removedDimmed: tint(a.red, 0.11),
      addedWord: tint(a.mint, 0.36), removedWord: tint(a.red, 0.4),
    },
  }
}

/** Problems worth failing a build over: unreadable text, invalid colours. */
export function audit(p) {
  const bg = parseHex(p.base.bg)
  const problems = []
  const need = (label, hex, min) => {
    const c = contrast(parseHex(hex), bg)
    if (c < min) problems.push(`${label} ${hex} has contrast ${c.toFixed(2)} on the background, wants >= ${min}`)
  }
  need("fg", p.base.fg, 10)
  need("muted", p.base.muted, 5.5)
  need("faint", p.base.faint, 4.5)   // used for small secondary text, which often sits on aurora rays
  need("dim", p.base.dim, 3)         // the "subtle" theme token: flightdeck draws its faint text with it
  for (const [k, v] of Object.entries(p.accent)) need(`accent.${k}`, v, 5)
  for (const [k, v] of Object.entries(p.tool)) need(`tool.${k}`, v, 5)
  for (const k of ["red", "green", "yellow", "blue", "purple", "cyan", "white"]) need(`ansi.${k}`, p.ansi[k], 5)
  need("ansi.brightBlack", p.ansi.brightBlack, 4)
  return problems
}
