// node --test tests/statusline.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  effortMeter, renderDeck, gradientBar, pill, fmtTokens, fmtReset, fmtDuration, parseGitStatus, gitInfo, visibleWidth, rampAt, DEFAULT_PALETTE,
} from "../statusline/aurora-deck.mjs"
import { ramp as libRamp } from "../tools/lib/color.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const DECK = path.join(here, "..", "statusline", "aurora-deck.mjs")
const P = DEFAULT_PALETTE
const NOW = Date.UTC(2026, 9, 16, 15, 0, 0)
const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, "")

const payload = (over = {}) => ({
  model: { id: "claude-sonnet-5-5", display_name: "Sonnet 5.5" },
  workspace: { current_dir: "C:/work/claude-code-mods-research" },
  effort: { level: "xhigh" },
  context_window: { used_percentage: 29, context_window_size: 1000000, total_input_tokens: 293000 },
  rate_limits: { five_hour: { used_percentage: 15, resets_at: NOW / 1000 + 2 * 3600 + 26 * 60 }, seven_day: { used_percentage: 94, resets_at: NOW / 1000 + 6 * 3600 + 6 * 60 } },
  cost: { total_cost_usd: 22.48, total_duration_ms: 4320000, total_lines_added: 156, total_lines_removed: 23 },
  prompt_cache: { warm: true, caching_observed: true, expires_at: NOW / 1000 + 252, hit_ratio: 0.93 },
  ...over,
})
const git = { branch: "main", ahead: 1, behind: 0, dirty: 3, conflicts: 0 }
const deck = (input, ctx = {}) => renderDeck(input, { palette: P, now: NOW, git, ...ctx })

test("a full payload gives an identity row, a blank spacer and a gauge row, with every vital on screen", () => {
  const rows = deck(payload(), { columns: 124 }).map(strip)
  assert.equal(rows.length, 3)
  assert.equal(rows[1], "\u200b", "a spacer row between the two; empty or escape-only lines are dropped by Claude Code, a zero-width space is kept")
  assert.ok(rows[0].includes("Sonnet") && rows[2].includes("ctx"))
  const all = rows.join("\n")
  for (const want of ["Sonnet 5.5", "xhigh", "claude-code-mods-research", "main", "●3", "↑1", "29%", "15%", "94%", "◔ 2h26m", "◔ 6h06m", "$22.48", "93%", "1h12m", "+156", "−23", "293k/1.0M"])
    assert.ok(all.includes(want), `missing "${want}" in:\n${all}`)
})

test("no row is ever wider than the terminal", () => {
  for (const columns of [44, 56, 64, 72, 80, 90, 100, 112, 124, 160, 220]) {
    for (const row of deck(payload(), { columns })) assert.ok(visibleWidth(row) <= Math.max(40, columns - 4), `${columns} cols: row is ${visibleWidth(row)} wide`)
  }
})

test("missing or null data renders an empty state, never throws", () => {
  for (const input of [{}, null, { model: null }, { context_window: { used_percentage: null } }, { rate_limits: {} }, { cost: { total_cost_usd: "x" } }, payload({ prompt_cache: null }), payload({ effort: undefined })]) {
    const rows = deck(input ?? {}, { columns: 120 })
    assert.ok(rows.length >= 1 && rows.every((r) => typeof r === "string"))
  }
})

test("hot quotas turn red and get a bang; calm ones stay plain", () => {
  const hot = deck(payload(), { columns: 124 })[2]
  const red = `38;2;${[1, 3, 5].map((i) => parseInt(P.semantic.err.slice(i, i + 2), 16)).join(";")}`   // the palette's own error colour
  assert.ok(hot.includes(red), "94% should use the error colour")
  assert.ok(strip(hot).includes("94%") && strip(hot).includes("!"))
  const calm = deck(payload({ rate_limits: { five_hour: { used_percentage: 15 }, seven_day: { used_percentage: 20 } } }), { columns: 124 })[2]
  assert.ok(!strip(calm).includes("!"))
})

test("the cache segment warns when it is about to expire and says cold when it has", () => {
  const soon = strip(deck(payload({ prompt_cache: { warm: true, caching_observed: true, expires_at: NOW / 1000 + 30 } }), { columns: 124 })[2])
  assert.match(soon, /◕/)
  const cold = strip(deck(payload({ prompt_cache: { warm: false, caching_observed: true, expires_at: null } }), { columns: 124 })[2])
  assert.match(cold, /cold/)
  const none = strip(deck(payload({ prompt_cache: { caching_observed: false } }), { columns: 124 })[2])
  assert.ok(!/cache/.test(none))
})

test("gradient bar: right number of cells, monotonic fill, partial blocks, pale-to-hot colour", () => {
  const cells = (pct, n = 10) => strip(gradientBar(pct, n, P))
  assert.equal(cells(0).length, 10); assert.equal(cells(100).length, 10)
  assert.equal(cells(100), "█".repeat(10)); assert.equal(cells(0), " ".repeat(10))
  const filled = (pct) => [...cells(pct)].reduce((n, ch) => n + ("▏▎▍▌▋▊▉█".indexOf(ch) + 1) / 8 * (ch === " " ? 0 : 1), 0)
  let last = -1
  for (const pct of [0, 5, 12, 29, 47, 63, 80, 94, 100]) { const f = filled(pct); assert.ok(f >= last - 1e-9); last = f }
  assert.ok(/[▏▎▍▌▋▊▉]/.test(cells(29)), "29% of 10 cells lands mid-cell")
  const first = /38;2;(\d+);(\d+);(\d+)/.exec(gradientBar(100, 10, P)), lastC = [...gradientBar(100, 10, P).matchAll(/38;2;(\d+);(\d+);(\d+)/g)].pop()
  const lum = (m) => 0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])
  assert.ok(lum(first) > lum(lastC), "the bar starts at the pale end of the palette's ramp and finishes at the hot end")
  assert.equal(gradientBar(null, 6, P).replace(/\u001b\[[0-9;]*m/g, "").trim(), "")
})

test("pills have rounded caps, block caps or none", () => {
  assert.ok(pill("x", "#FF8F66", "#0C0A18", "powerline").includes("\ue0b6"))
  assert.ok(pill("x", "#FF8F66", "#0C0A18", "block").includes("▌"))
  assert.equal(strip(pill("x", "#FF8F66", "#0C0A18", "none")), " x ")
})

test("formatters", () => {
  assert.equal(fmtTokens(293000), "293k"); assert.equal(fmtTokens(1000000), "1.0M"); assert.equal(fmtTokens(1250000), "1.3M"); assert.equal(fmtTokens(512), "512")
  assert.equal(fmtReset(NOW / 1000 + 2 * 3600 + 26 * 60, NOW), "2h26m"); assert.equal(fmtReset(NOW / 1000 + 6 * 3600 + 6 * 60, NOW), "6h06m")
  assert.equal(fmtReset(NOW / 1000 + 3 * 86400 + 4 * 3600, NOW), "3d4h"); assert.equal(fmtReset(NOW / 1000 + 9 * 60, NOW), "9m"); assert.equal(fmtReset(NOW / 1000 - 5, NOW), "0m")
  assert.equal(fmtDuration(4320000), "1h12m"); assert.equal(fmtDuration(240000), "4m"); assert.equal(fmtDuration(38000), "38s"); assert.equal(fmtDuration(10), "")
})

test("git status v2 parsing", () => {
  const text = ["# branch.oid abc", "# branch.head feature/login", "# branch.upstream origin/feature/login", "# branch.ab +2 -1",
    "1 .M N... 100644 100644 100644 a b src/a.ts", "2 R. N... 100644 100644 100644 a b R100 new.ts\told.ts", "u UU N... 1 2 3 4 a b c conflict.ts", "? untracked.txt"].join("\n")
  assert.deepEqual(parseGitStatus(text), { branch: "feature/login", ahead: 2, behind: 1, dirty: 4, conflicts: 1 })
  assert.equal(parseGitStatus("# branch.head (detached)\n").branch, "")
})

test("git info is cached for a few seconds and falls back to HEAD when git fails", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-git-")), repo = path.join(dir, "r", ".git")
  fs.mkdirSync(repo, { recursive: true }); fs.writeFileSync(path.join(repo, "HEAD"), "ref: refs/heads/fallback-branch\n")
  let calls = 0
  const run = () => { calls++; return "# branch.head main\n# branch.ab +0 -0\n1 .M x\n" }
  const opts = { cacheDir: path.join(dir, "cache"), run }
  const a = gitInfo(path.join(dir, "r"), { ...opts, now: 1000 }), b = gitInfo(path.join(dir, "r"), { ...opts, now: 2000 }), c = gitInfo(path.join(dir, "r"), { ...opts, now: 9000 })
  assert.equal(calls, 2, "second call inside 3s is served from the cache"); assert.equal(a.dirty, 1); assert.deepEqual(a, b); assert.ok(c)
  const failing = gitInfo(path.join(dir, "r"), { cacheDir: path.join(dir, "cache2"), now: 1000, run: () => null })
  assert.equal(failing.branch, "fallback-branch"); assert.equal(failing.partial, true)
  assert.equal(gitInfo(path.join(dir, "nowhere"), { cacheDir: path.join(dir, "cache3"), now: 1000, run: () => null }), null)
  fs.rmSync(dir, { recursive: true, force: true })
})

test("hostile text cannot inject escape sequences", () => {
  const evil = "x" + String.fromCharCode(27) + "]0;pwned" + String.fromCharCode(7) + "y"
  const rows = deck(payload({ model: { display_name: evil }, workspace: { current_dir: "C:/a/" + evil } }), { columns: 124, git: { ...git, branch: evil } })
  const esc = String.fromCharCode(27)
  for (const row of rows) assert.ok(!row.includes(esc + "]") && !row.includes(String.fromCharCode(7)), "no OSC or BEL from user-controlled text")
})

test("the inlined OKLab ramp matches the shared colour library", () => {
  for (const t of [0, 0.13, 0.37, 0.5, 0.74, 0.99, 1]) {
    const a = rampAt(P.ramp, t), b = libRamp(P.ramp, t)
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(a[i] - b[i]) < 1, `t=${t} channel ${i}: ${a[i]} vs ${b[i]}`)
  }
})

test("run as a program: valid, invalid and empty stdin all exit 0 with output; NO_COLOR is ignored", () => {
  for (const input of [JSON.stringify(payload()), "not json", ""]) {
    const r = spawnSync(process.execPath, [DECK], { input, encoding: "utf8", env: { ...process.env, COLUMNS: "120", NO_COLOR: "1", RICE_CAPS: "block" } })
    assert.equal(r.status, 0); assert.ok(r.stdout.trim().length > 0)
    assert.ok(r.stdout.includes(String.fromCharCode(27) + "[38;2;"), "colour survives NO_COLOR")
  }
})

test("the script imports only node built-ins", () => {
  const src = fs.readFileSync(DECK, "utf8")
  const imports = [...src.matchAll(/^import .* from "(.+)"$/gm)].map((m) => m[1])
  assert.ok(imports.length > 0 && imports.every((m) => m.startsWith("node:")), `imports: ${imports}`)
})

test("effort is a five-segment meter", () => {
  assert.equal(effortMeter("low"), "◆◇◇◇◇"); assert.equal(effortMeter("xhigh"), "◆◆◆◆◇"); assert.equal(effortMeter("max"), "◆◆◆◆◆"); assert.equal(effortMeter("???"), "◇◇◇◇◇")
  assert.ok(strip(deck(payload(), { columns: 124 })[0]).includes("◆◆◆◆◇ xhigh"))
})

test("the status line's embedded default palette matches palettes.json (no silent drift)", async () => {
  const { getPalette } = await import("../tools/lib/palette.mjs")
  const real = getPalette(path.join(here, "..", "palette", "palettes.json"), "ember")
  for (const group of ["base", "accent", "semantic"]) assert.deepEqual(P[group], real[group], `${group} differs from palettes.json`)
  assert.deepEqual(P.ramp, real.ramp)
})

// Glyphs that exist in JetBrainsMono NFM (read from the font's cmap with WPF's GlyphTypeface, 2026-10-17). A glyph the font lacks
// is drawn from a fallback font at another width and spills into the next cell: the old reset arrow touched its time that way.
const FONT_SAFE = new Set([..."–−…│▏▎▍▌▋▊▉█▐▕▇◆◇◌◔◕◈●○✓✕⚡⌂⌥↑↓·•→"])   // the last two are the Powerline pill caps
test("the status line draws only glyphs the terminal font really has", () => {
  const src = fs.readFileSync(DECK, "utf8").split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n")
  const bad = [...new Set([...src].filter((c) => c.codePointAt(0) > 127 && c !== " " && !FONT_SAFE.has(c)))]
  assert.deepEqual(bad, [], `not in the font: ${bad.join(" ")}`)
})

test("a reset time never touches the glyph before it", () => {
  const row = strip(deck(payload(), { columns: 124 })[2])
  for (const m of row.matchAll(/◔(.)/g)) assert.equal(m[1], " ", `glyph runs into "${m[1]}" in: ${row}`)
})

test("AURORA_DECK_PALETTE points the status line at another palette (used by the throwaway previews)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-pal-"))
  const file = path.join(dir, "palette.json")
  fs.writeFileSync(file, JSON.stringify({ accent: { ...P.accent, coral: "#123456" } }))
  const r = spawnSync(process.execPath, [DECK], { input: JSON.stringify(payload()), encoding: "utf8", env: { ...process.env, AURORA_DECK_PALETTE: file } })
  assert.equal(r.status, 0)
  assert.ok(r.stdout.includes("38;2;18;52;86") || r.stdout.includes("48;2;18;52;86"), "the model pill should use the override's coral #123456")
  fs.rmSync(dir, { recursive: true, force: true })
})
