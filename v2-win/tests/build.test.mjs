// node --test tests/build.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getPalette, audit, loadPalettes, derive } from "../tools/lib/palette.mjs"
import { contrast, parseHex, mix, toHex, ramp } from "../tools/lib/color.mjs"
import { wtScheme, wtTheme, wtProfileDefaults, claudeTheme, skin, rioConfig, powershellProfile, statusPalette } from "../tools/build.mjs"

const PAL = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "palette", "palettes.json")
const p = getPalette(PAL, "aurora")
const HEX = /^#[0-9A-Fa-f]{6}$/

// every token Claude Code's own theme table defines (read from the table inside the binary) plus `ide`, which the docs list
const KNOWN_TOKENS = new Set(`autoAccept autoAcceptShimmer skill bashBorder claude claudeShimmer claudeBlue_FOR_SYSTEM_SPINNER claudeBlueShimmer_FOR_SYSTEM_SPINNER
permission permissionShimmer planMode promptBorder promptBorderShimmer text inverseText inactive inactiveShimmer subtle suggestion remember background success error
warning merged warningShimmer diffAdded diffRemoved diffAddedDimmed diffRemovedDimmed diffAddedWord diffRemovedWord red_FOR_SUBAGENTS_ONLY blue_FOR_SUBAGENTS_ONLY
green_FOR_SUBAGENTS_ONLY yellow_FOR_SUBAGENTS_ONLY purple_FOR_SUBAGENTS_ONLY orange_FOR_SUBAGENTS_ONLY pink_FOR_SUBAGENTS_ONLY cyan_FOR_SUBAGENTS_ONLY professionalBlue
chromeYellow clawd_body clawd_background userMessageBackground userMessageBackgroundHover composerSidebarBackground selectionBg bashMessageBackgroundColor
memoryBackgroundColor rate_limit_fill rate_limit_empty fastMode fastModeShimmer effortUltra briefLabelYou briefLabelClaude ide
rainbow_red rainbow_orange rainbow_yellow rainbow_green rainbow_blue rainbow_indigo rainbow_violet
rainbow_red_shimmer rainbow_orange_shimmer rainbow_yellow_shimmer rainbow_green_shimmer rainbow_blue_shimmer rainbow_indigo_shimmer rainbow_violet_shimmer`.split(/\s+/))

test("the aurora palette passes its own audit and is internally consistent", () => {
  assert.deepEqual(audit(p), [])
  for (const group of ["base", "accent", "ansi", "tool"]) for (const [k, v] of Object.entries(p[group])) assert.match(v, HEX, `${group}.${k} = ${v}`)
  assert.ok(p.ramp.length >= 4 && p.ramp.every((c) => HEX.test(c)))
})

test("the audit actually fails on an unreadable palette", () => {
  const raw = structuredClone(loadPalettes(PAL).palettes.aurora); raw.base.fg = "#222244"; raw.accent.coral = "#101020"
  const problems = audit(derive("bad", raw))
  assert.ok(problems.some((x) => x.startsWith("fg ")) && problems.some((x) => x.includes("accent.coral")), problems.join("\n"))
})

test("every Claude theme token is one Claude Code actually knows (a typo would be silently ignored)", () => {
  const t = claudeTheme(p)
  assert.equal(t.base, "dark")
  const unknown = Object.keys(t.overrides).filter((k) => !KNOWN_TOKENS.has(k))
  assert.deepEqual(unknown, [], `unknown tokens: ${unknown}`)
  for (const [k, v] of Object.entries(t.overrides)) assert.match(v, HEX, `${k} = ${v}`)
  for (const must of ["claude", "text", "composerSidebarBackground", "userMessageBackground", "subtle", "success", "error", "warning", "promptBorder", "diffAdded", "diffRemoved"]) assert.ok(must in t.overrides, `missing ${must}`)
})

test("text-bearing theme tokens are readable on the surfaces they sit on", () => {
  const o = claudeTheme(p).overrides
  const c = (a, b) => contrast(parseHex(a), parseHex(b))
  assert.ok(c(o.text, o.userMessageBackground) >= 10, "text on the user message")
  assert.ok(c(o.text, o.composerSidebarBackground) >= 10, "text on the side pane")
  assert.ok(c(o.subtle, o.composerSidebarBackground) >= 3, "flightdeck faint text (the subtle token) on the pane")
  assert.ok(c(o.inactive, o.composerSidebarBackground) >= 5.5, "hints on the pane")
  for (const k of ["success", "error", "warning", "claude", "suggestion"]) assert.ok(c(o[k], p.base.bg) >= 5, `${k} on the background`)
  assert.ok(c(o.text, o.diffAddedWord) >= 7 && c(o.text, o.diffRemovedWord) >= 7, "text on word-level diff highlights")
})

test("the skin sets all 15 slots and a safe settings block", () => {
  const s = skin(p)
  assert.deepEqual(Object.keys(s.palette).sort(), ["err", "fg", "mcp", "muted", "ok", "other", "read", "run", "search", "surface", "user", "warn", "web", "write", "zebra"].sort())
  assert.equal(s.name, "claude-aurora"); assert.match(s.name, /^[a-z0-9-]+$/)
  assert.equal(s.settings.rail, true); assert.equal(s.settings.band, false, "usage band stays off so usage is shown once")
  assert.ok(s.spinner.length <= 12 && s.done.length <= 12)
})

test("the Windows Terminal scheme, theme and profile are well formed", () => {
  const sc = wtScheme(p)
  for (const k of ["background", "foreground", "cursorColor", "selectionBackground", "black", "brightWhite"]) assert.match(sc[k], HEX, k)
  assert.equal(Object.keys(sc).length, 1 + 4 + 16)
  const th = wtTheme(p)
  assert.equal(th.window.applicationTheme, "dark"); assert.equal(th.window.frame, p.accent.coral)
  assert.equal(th.tabRow.background, "terminalBackground"); assert.equal(th.tab.background, "terminalBackground")
  const d = wtProfileDefaults(p, "C:\\x\\assets")
  assert.equal(d.colorScheme, sc.name); assert.equal(d.opacity, 100); assert.equal(d.useAcrylic, false)
  assert.equal(d.backgroundImage, "C:\\x\\assets\\art\\bg.png"); assert.equal(d["experimental.pixelShaderPath"], "C:\\x\\assets\\shaders\\glow.hlsl")
  assert.ok(d.backgroundImageOpacity > 0.2 && d.backgroundImageOpacity < 0.7, "the art stays behind the text")
  assert.equal(d.font.face, "JetBrainsMono NFM"); assert.equal(d.antialiasingMode, "grayscale")
  assert.equal("experimental.pixelShaderPath" in wtProfileDefaults(p, "C:\\x", { shader: false }), false)
})

test("Rio gets the same palette and keeps the forced-image variable local to Rio", () => {
  const toml = rioConfig(p, "C:\\Users\\x\\pwsh.exe")
  assert.match(toml, /CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1/); assert.match(toml, new RegExp(`background = "${p.base.bg}"`)); assert.match(toml, /\\\\Users\\\\x\\\\pwsh\.exe/)
  assert.equal([...toml.matchAll(/^(light-)?(black|red|green|yellow|blue|magenta|cyan|white) = "#/gm)].length, 16)
})

test("the PowerShell profile keeps the user's keys and reads git without starting git", () => {
  const ps = powershellProfile(p)
  for (const want of ["Set-PSReadLineKeyHandler -Key Ctrl+z", "MaximumHistoryCount 10000", "function prompt", "function ls", p.accent.coral])
    assert.ok(ps.includes(want), `profile lacks ${want}`)
  const code = ps.split("\n").map((l) => l.replace(/#.*$/, "")).join("\n")           // ignore comments, which talk about git freely
  assert.ok(!/(^|[;&|(]\s*)git(\.exe)?\s/m.test(code), "the prompt must not spawn git")
  assert.ok(ps.includes("HEAD") && ps.includes("refs/heads"))
  assert.ok(!ps.includes("${"), "no unexpanded template placeholders")
})

test("the status palette carries what the runtime script reads", () => {
  const sp = statusPalette(p)
  for (const k of ["base", "accent", "ramp", "semantic"]) assert.ok(k in sp)
  assert.equal(sp.base.bg, p.base.bg)
})

test("OKLab ramps are continuous (no seams) and the ends are exact", () => {
  assert.equal(toHex(ramp(p.ramp, 0)), p.ramp[0].toUpperCase()); assert.equal(toHex(ramp(p.ramp, 1)), p.ramp.at(-1).toUpperCase())
  let prev = ramp(p.ramp, 0)
  for (let i = 1; i <= 200; i++) { const c = ramp(p.ramp, i / 200); assert.ok(Math.hypot(...c.map((v, k) => v - prev[k])) < 14, `jump at ${i / 200}`); prev = c }
  assert.equal(toHex(mix([0, 0, 0], [255, 255, 255], 0)), "#000000")
})
