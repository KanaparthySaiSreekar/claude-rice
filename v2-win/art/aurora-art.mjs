// Procedural aurora wallpaper for the terminal background. No dependencies.
// Light is accumulated in LINEAR space and tone-mapped, so overlapping ribbons glow instead of
// turning grey. Each ribbon has a sharp bright lower edge and rays that hang upward from it; the
// colour ramp ping-pongs (never wraps), so there are no seams. The middle stays calm for text.
//
//   node art/aurora-art.mjs <palettes.json> <palette-name> <out.png> [width height]
import fs from "node:fs"
import zlib from "node:zlib"
import { parseHex, ramp } from "../tools/lib/color.mjs"

// ---- deterministic randomness + noise -------------------------------------------------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const hash2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
const smooth = (t) => t * t * (3 - 2 * t)
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi)
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s)
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
}
const fbm = (x, y, s) => 0.55 * vnoise(x, y, s) + 0.3 * vnoise(x * 2.1, y * 2.1, s + 1) + 0.15 * vnoise(x * 4.3, y * 4.3, s + 2)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const toSrgb = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const pingpong = (t) => { t = ((t % 2) + 2) % 2; return t > 1 ? 2 - t : t }

// ---- PNG writer (RGB, 8 bit) ----------------------------------------------------------
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePng(w, h, rgb) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3) }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))])
}

// ---- the art ----------------------------------------------------------------------------
export function renderAurora({ width = 2560, height = 1440, base, rampStops, seed = 7, intensity = 1, curtains = 3, stars = 1 }) {
  const rnd = mulberry32(seed)
  const baseLin = parseHex(base).map(toLin)
  const stopsLin = rampStops.map((s) => parseHex(s))
  const rampLin = (t) => ramp(stopsLin, t).map(toLin)
  // ribbons: smooth S-curves in the upper two thirds, each with its own colour phase
  const bands = Array.from({ length: curtains }, (_, i) => ({
    y: 0.17 + (0.38 * i) / Math.max(1, curtains - 1) + (rnd() - 0.5) * 0.05,
    a1: 0.05 + rnd() * 0.045, f1: 0.55 + rnd() * 0.5, p1: rnd(),
    a2: 0.012 + rnd() * 0.02, f2: 1.7 + rnd() * 1.2, p2: rnd(),
    low: 0.011 + rnd() * 0.009, up: 0.06 + rnd() * 0.05, hue: rnd() * 0.5 + i * 0.22, k: 0.75 + rnd() * 0.35, tilt: (rnd() - 0.5) * 0.2,
    rayScale: 120 + rnd() * 90,
  }))
  const out = Buffer.alloc(width * height * 3)
  const starMap = new Float32Array(width * height)
  const nStars = Math.round(width * height * 0.0005 * stars)
  for (let i = 0; i < nStars; i++) {
    const x = Math.floor(rnd() * width), y = Math.floor(rnd() * height * 0.8), b = rnd() ** 5
    starMap[y * width + x] = Math.max(starMap[y * width + x], 0.3 + b * 0.7)
    if (b > 0.6 && x + 1 < width && y + 1 < height) { starMap[y * width + x + 1] = Math.max(starMap[y * width + x + 1], b * 0.4); starMap[(y + 1) * width + x] = Math.max(starMap[(y + 1) * width + x], b * 0.4) }
  }
  const gain = 0.85 * intensity
  for (let y = 0; y < height; y++) {
    const v = y / height
    for (let x = 0; x < width; x++) {
      const u = x / width
      let lr = 0, lg = 0, lb = 0
      for (let i = 0; i < bands.length; i++) {
        const B = bands[i]
        const centre = B.y + B.tilt * (u - 0.5) + B.a1 * Math.sin(2 * Math.PI * (B.f1 * u + B.p1)) + B.a2 * Math.sin(2 * Math.PI * (B.f2 * u + B.p2))
        const d = v - (centre + 0.016 * (fbm(u * 7 + i * 5.7, i * 2.3, 3) - 0.5))
        // each ribbon only glows in places: a slow envelope along the width leaves dark sky between curtains
        const env = smooth(clamp01((fbm(u * 1.9 + i * 9.3, i * 3.1, 21) - 0.42) / 0.22))
        if (env < 0.01) continue
        let I
        if (d > 0) I = 0.5 * Math.exp(-((d / B.low) ** 2)) * env                  // sharp bright lower edge
        else {
          const ray = Math.max(0, fbm(u * B.rayScale + i * 31, v * 1.1, 11 + i) * 1.9 - 0.55) ** 1.5   // streaks, perfectly vertical
          I = Math.exp(-((-d / B.up) ** 1.3)) * (0.035 + 1.05 * ray) * env
        }
        if (I < 0.004) continue
        const c = rampLin(pingpong(u * 0.9 + B.hue))
        const w = I * B.k
        const edge = d > 0 ? Math.exp(-((d / B.low) ** 2)) ** 2 : 0                     // push the very edge toward white
        lr += c[0] * w + edge * 0.1; lg += c[1] * w + edge * 0.1; lb += c[2] * w + edge * 0.1
      }
      // soft corner glows
      const gl = (cx, cy, rad, c, k) => { const dx = u - cx, dy = (v - cy) * 0.56, e = Math.exp(-((dx * dx + dy * dy) / (rad * rad))) * k; const L = rampLin(c); lr += L[0] * e; lg += L[1] * e; lb += L[2] * e }
      gl(1.03, -0.06, 0.38, 0.78, 0.34); gl(-0.05, 1.06, 0.44, 0.18, 0.2); gl(0.6, 1.12, 0.7, 0.45, 0.07)
      // a very faint nebula so the dark areas are not flat
      const neb = fbm(u * 3.2, v * 2.4, 5) ** 2 * 0.07
      const nc = rampLin(0.5); lr += nc[0] * neb; lg += nc[1] * neb; lb += nc[2] * neb
      // keep the middle calm so terminal text stays readable
      const cx = (u - 0.5) / 0.5, cy = (v - 0.6) / 0.52, centre = clamp01(Math.hypot(cx, cy))
      const calm = lerp(0.3, 1, smooth(clamp01((centre - 0.1) / 0.9)))
      // filmic soft clip on the light, added to the base in linear space
      let R = baseLin[0] + (1 - Math.exp(-lr * gain * calm)), G = baseLin[1] + (1 - Math.exp(-lg * gain * calm)), Bc = baseLin[2] + (1 - Math.exp(-lb * gain * calm))
      const s = starMap[y * width + x]
      if (s > 0) { const k = s * (0.35 + 0.65 * (1 - calm * 0.6)); R += 0.75 * k; G += 0.75 * k; Bc += 0.9 * k }
      const vig = 1 - 0.34 * clamp01(Math.hypot(u - 0.5, (v - 0.5) * 0.9) - 0.3) * 1.9
      const n = (hash2(x, y, 99) - 0.5) * 1.5
      const o = (y * width + x) * 3
      out[o] = Math.max(0, Math.min(255, Math.round(toSrgb(clamp01(R * vig)) + n)))
      out[o + 1] = Math.max(0, Math.min(255, Math.round(toSrgb(clamp01(G * vig)) + n)))
      out[o + 2] = Math.max(0, Math.min(255, Math.round(toSrgb(clamp01(Bc * vig)) + n)))
    }
  }
  return encodePng(width, height, out)
}

// CLI
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const [, , palFile, name, outFile, w, h] = process.argv
  const pal = JSON.parse(fs.readFileSync(palFile, "utf8")).palettes[name]
  if (!pal) throw new Error(`no palette "${name}"`)
  const t0 = Date.now()
  const png = renderAurora({ width: Number(w) || 2560, height: Number(h) || 1440, base: pal.base.bg, rampStops: pal.ramp, ...pal.art })
  fs.writeFileSync(outFile, png)
  console.log(`wrote ${outFile} (${(png.length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`)
}
