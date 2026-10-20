// presets.mjs: turn the rice palettes (v2-win/palette/palettes.json, the one source of colour) into prismantis presets.
//
//   node tools/presets.mjs                       print the presets as the TypeScript prismantis keeps in hooks/presets.ts
//   node tools/presets.mjs --write <presets.ts>  put them into that file (replacing an earlier copy), before `mono`
//
// Each of prismantis's 22 colour slots takes the same role it has in the v2 skin, so a reply reads the same under either mod:
// headings, bullets, numbers and table headers in the accent, bold in the `run` shade, inline code in `search`, paths in
// `read`, links and code keywords in `web`, function names in `mcp`, italics in `agent`. Strings in code take the success
// green: prismantis colours a figure's ok marks from the theme's greenest ink, and a palette with no green in its inks
// would draw ok in orange (its own test, "warn leans red and ok leans green", catches that).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const PALETTES = path.resolve(repoRoot, "..", "v2-win", "palette", "palettes.json")
export const NAMES = ["ember", "amber", "crimson"]
export const TOKENS = [
  "accent", "heading", "strong", "emphasis", "inlineCode", "codeText", "codeCommand", "codeFlag", "codeString", "codeComment",
  "link", "path", "number", "quote", "rule", "tableHeader", "tableRule", "bullet", "diagram", "diagramText", "diffAdded", "diffRemoved",
  // local patch: GitHub alerts (> [!NOTE] ...) take these when a preset has them; upstream draws them in named blue/green/magenta
  "alertNote", "alertTip", "alertImportant", "alertWarning", "alertCaution",
]

export function preset(p) {
  const b = p.base, a = p.accent, t = p.tool
  return {
    accent: a.coral, heading: a.coral, tableHeader: a.coral, strong: t.run, emphasis: t.agent,
    inlineCode: t.search, codeText: b.fg, codeCommand: t.mcp, codeFlag: t.web, codeString: a.mint,
    codeComment: b.faint, link: t.web, path: t.read, number: a.coral, quote: b.muted,
    rule: b.line, tableRule: b.dim, bullet: a.coral, diagram: a.coral, diagramText: b.fg,
    diffAdded: a.mint, diffRemoved: a.red,
    alertNote: a.blue, alertTip: a.mint, alertImportant: a.coral, alertWarning: a.amber, alertCaution: a.red,
  }
}

export function presets(file = PALETTES) {
  const { palettes } = JSON.parse(fs.readFileSync(file, "utf8"))
  return Object.fromEntries(NAMES.map((n) => [n, { bg: palettes[n].base.bg, theme: preset(palettes[n]) }]))
}

const lower = (hex) => hex.toLowerCase()

/** The block that goes into hooks/presets.ts, in the file's own layout (five tokens a line). */
export function tsBlock(all = presets()) {
  const out = []
  for (const name of NAMES) {
    const theme = all[name].theme
    const pairs = TOKENS.map((k) => `${k}: '${lower(theme[k])}'`)
    const rows = []
    for (let i = 0; i < pairs.length; i += 5) rows.push(`    ${pairs.slice(i, i + 5).join(", ")},`)
    out.push(`  ${name}: {`, ...rows, "  },")
  }
  return out.join("\n") + "\n"
}

/** Insert (or replace) the block in a presets.ts source, just before the `mono` preset. */
export function withBlock(source, block = tsBlock()) {
  const crlf = source.includes("\r\n")        // git on Windows checks the file out with CRLF; keep whichever it has
  let s = crlf ? source.split("\r\n").join("\n") : source
  for (const name of NAMES) s = s.replace(new RegExp(`\\n  ${name}: \\{\\n(?:    .*\\n)+?  \\},`, "g"), "")
  const at = s.indexOf("\n  mono: {} as Theme,")
  if (at < 0) throw new Error("no `mono` preset found: is this prismantis's hooks/presets.ts?")
  s = s.slice(0, at + 1) + block + s.slice(at + 1)
  return crlf ? s.split("\n").join("\r\n") : s
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const i = process.argv.indexOf("--write")
  if (i < 0) process.stdout.write(tsBlock())
  else {
    const file = process.argv[i + 1]
    fs.writeFileSync(file, withBlock(fs.readFileSync(file, "utf8")))
    console.log(`wrote ${NAMES.join(", ")} into ${file}`)
  }
}
