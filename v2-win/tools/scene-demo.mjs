// scene-demo.mjs: prints a screen that imitates Claude Code (prompt block, assistant reply with a
// heading, tool rows, a table, a diff, the input box) in the palette's colours. It is a stand-in for
// judging colour, glow and background; the real UI is checked separately.
//   node tools/scene-demo.mjs [palette]
import { getPalette } from "./lib/palette.mjs"
import { parseHex, fg, bg, RESET, bold, dim, ramp } from "./lib/color.mjs"
import { PALETTES } from "./rice.mjs"

const p = getPalette(PALETTES, process.argv[2])
const c = (hex) => fg(parseHex(hex))
const on = (hex) => bg(parseHex(hex))
const A = p.accent, B = p.base, T = p.tool
const W = process.stdout.columns || 118
const pad = (s, n) => s + " ".repeat(Math.max(0, n - [...s.replace(/\x1b\[[0-9;]*m/g, "")].length))
const out = []
const line = (s = "") => out.push(s)

line()
// user prompt
line(`${on(B.raised)}${c(A.coral)}▍${c(B.fg)} can you make the status line show git, context and quota without wasting rows?${" ".repeat(Math.max(0, W - 82))}${RESET}`)
line()
// assistant heading + prose
line(`${c(A.coral)}▍${RESET} ${bold}${c(B.fg)}What I changed${RESET}`)
line(`  ${c(B.fg)}The deck is one palette, one script. ${c(B.muted)}Context, 5h and 7d are bars that warm from cyan to coral as they fill.${RESET}`)
line()
// tool rows with the rail on the same line
const row = (stub, glyphColor, label, labelColor, target, meta = "") =>
  line(`${c(A.violet)}${stub}${c(glyphColor)}● ${c(labelColor)}${pad(label, 7)}${c(B.muted)}${pad(target, 56)}${c(B.faint)}${meta}${RESET}`)
row("┣━", p.semantic.ok, "Read", T.read, "statusline/aurora-deck.mjs", "12ms")
row("┣━", p.semantic.ok, "Search", T.search, "prompt_cache  (14 matches)", "31ms")
row("┣━", p.semantic.ok, "Edit", T.write, "statusline/aurora-deck.mjs", "+84 −12")
row("┣━", p.semantic.warn, "Run", T.run, "node --test tests/", "2.4s")
row("┣━", p.semantic.err, "Run", T.run, "node tools/rice.mjs apply  ✖ exit 1", "0.3s")
row("┗━", B.faint, "Web", T.web, "learn.microsoft.com/windows/terminal", "…")
line()
// table with zebra
const cols = [18, 14, 14]
const tr = (cells, bgc, bolds = false) => line("  " + on(bgc) + cells.map((s, i) => `${bolds ? bold : ""}${c(bolds ? A.coralLight : B.fg)} ${pad(s, cols[i])}`).join(`${c(B.line)}│`) + " " + RESET)
tr(["Segment", "Source", "Updates"], B.raised, true)
tr(["context bar", "context_window", "each reply"], B.surface)
tr(["5h / 7d quota", "rate_limits", "each reply"], B.bg)
tr(["cache clock", "prompt_cache", "at expiry"], B.surface)
line()
// diff
const d = (sign, text, hex, bgHex) => line(`  ${on(bgHex)}${c(hex)} ${sign} ${pad(text, 66)}${RESET}`)
d("-", "  const bar = fill(pct, 10)", A.red, p.diff.removed)
d("+", "  const bar = gradientBar(pct, 14, p.ramp)", A.mint, p.diff.added)
line()
// spinner + input box
line(`${c(A.coral)}✦ ${c(A.coralLight)}Spelunking${c(B.faint)} (14s · ↑ 3.2k tokens)${RESET}`)
line()
line(`${c(A.violet)}╭${"─".repeat(W - 4)}╮${RESET}`)
line(`${c(A.violet)}│${RESET} ${c(A.coral)}❯${RESET} ${c(B.fg)}now make it flash on the 7d limit${c(A.coral)}▌${RESET}${" ".repeat(Math.max(0, W - 42))}${c(A.violet)}│${RESET}`)
line(`${c(A.violet)}╰${"─".repeat(W - 4)}╯${RESET}`)
line(`  ${c(B.faint)}⏵⏵ bypass permissions on (shift+tab to cycle)${RESET}`)
process.stdout.write(out.join("\n") + "\n")
