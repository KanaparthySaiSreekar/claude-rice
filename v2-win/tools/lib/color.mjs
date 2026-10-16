// Small colour toolkit with no dependencies: hex <-> rgb, OKLab mixing (perceptually even gradients),
// ramps over several stops, WCAG contrast, and truecolor ANSI escapes.

export const parseHex = (hex) => {
  const h = String(hex).trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`bad colour "${hex}"`)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
export const toHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase()

const toLinear = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const fromLinear = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function toOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
export function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ].map((v) => Math.max(0, Math.min(255, v)))
}

/** Mix two rgb triples in OKLab. t in [0,1]. */
export function mix(a, b, t) {
  const A = toOklab(a), B = toOklab(b)
  return fromOklab(A.map((v, i) => v + (B[i] - v) * t))
}

/** Sample a multi-stop ramp (array of hex or rgb) at t in [0,1]. */
export function ramp(stops, t) {
  const pts = stops.map((s) => (typeof s === "string" ? parseHex(s) : s))
  if (t <= 0) return pts[0]
  if (t >= 1) return pts[pts.length - 1]
  const x = t * (pts.length - 1), i = Math.floor(x)
  return mix(pts[i], pts[i + 1], x - i)
}

export const luminance = (rgb) => { const [r, g, b] = rgb.map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export function contrast(a, b) {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (la + 0.05) / (lb + 0.05)
}

/** Lighten (t>0) or darken (t<0) toward white or black in OKLab. */
export const shade = (rgb, t) => (t >= 0 ? mix(rgb, [255, 255, 255], t) : mix(rgb, [0, 0, 0], -t))

const R = (v) => Math.round(v)
export const ESC = String.fromCharCode(27)
export const RESET = `${ESC}[0m`
export const fg = ([r, g, b]) => `${ESC}[38;2;${R(r)};${R(g)};${R(b)}m`
export const bg = ([r, g, b]) => `${ESC}[48;2;${R(r)};${R(g)};${R(b)}m`
export const bold = `${ESC}[1m`
export const dim = `${ESC}[2m`
