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

// ---------------------------------------------------------------------------------------------
// the plain palettes: black with one warm accent, no picture behind the text
// ---------------------------------------------------------------------------------------------
import fs from "node:fs"
import { bridgePalette } from "../tools/build.mjs"

const PLAIN = ["ember", "amber", "crimson"]

test("ember, amber and crimson pass the audit, are complete, and are near-black", () => {
  for (const name of PLAIN) {
    const q = getPalette(PAL, name)
    assert.deepEqual(audit(q), [], name)
    for (const group of ["base", "accent", "ansi", "tool"]) for (const [k, v] of Object.entries(p[group])) assert.ok(k in q[group] || group === "tool", `${name} lacks ${group}.${k}`)
    for (const k of Object.keys(p.accent)) assert.match(q.accent[k], HEX, `${name} accent.${k}`)
    const [r, g, b] = parseHex(q.base.bg); assert.ok(Math.max(r, g, b) < 24, `${name} background ${q.base.bg} is near-black`)
    assert.equal(q.art, null, `${name} has no background art`)
  }
  assert.equal(loadPalettes(PAL).default, "ember")
})

test("a palette without art produces no background-image settings, one with art still does", () => {
  const q = getPalette(PAL, "ember")
  const d = wtProfileDefaults(q, "C:\\x\\assets")
  for (const k of ["backgroundImage", "backgroundImageOpacity", "backgroundImageStretchMode", "backgroundImageAlignment"]) assert.ok(!(k in d), k)
  assert.equal(d["experimental.pixelShaderPath"], "C:\\x\\assets\\shaders\\glow.hlsl")
  assert.ok("backgroundImage" in wtProfileDefaults(p, "C:\\x\\assets"), "aurora keeps its art")
})

test("the bridge palette is complete, valid hex, and carries every kind of tool", () => {
  for (const name of PLAIN) {
    const b = bridgePalette(getPalette(PAL, name))
    for (const k of ["bg", "surface", "raised", "line", "dim", "faint", "muted", "fg", "ok", "warn", "err", "coral"]) assert.match(b[k], HEX, `${name}.${k}`)
    assert.ok(b.ramp.length >= 2 && b.ramp.every((c) => HEX.test(c)))
    for (const k of ["read", "write", "run", "search", "web", "mcp", "agent", "other"]) assert.match(b.tool[k], HEX, `${name}.tool.${k}`)
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(b)))
  }
})

test("the mod's built-in defaults are the ember palette (so it looks right with no option set)", () => {
  const src = fs.readFileSync(path.join(path.dirname(PAL), "..", "mods", "aurora-bridge", "hooks", "palette.ts"), "utf8")
  const lit = src.slice(src.indexOf("export const EMBER"))
  const b = bridgePalette(getPalette(PAL, "ember"))
  for (const k of ["bg", "surface", "raised", "line", "dim", "faint", "muted", "fg", "ok", "warn", "err", "coral"]) assert.ok(lit.includes(`${k}: '${b[k]}'`), `EMBER.${k} should be ${b[k]}`)
  for (const [k, v] of Object.entries(b.tool)) assert.ok(lit.includes(`${k}: '${v}'`), `EMBER.tool.${k} should be ${v}`)
  assert.ok(lit.includes(`ramp: [${b.ramp.map((c) => `'${c}'`).join(", ")}]`), "EMBER.ramp")
})

// ---------------------------------------------------------------------------------------------
// detail colour: the plain palettes once turned every "highlight" role into a near-white (2026-10-17: "everything in the text is white")
// ---------------------------------------------------------------------------------------------
import { toOklab } from "../tools/lib/color.mjs"

const chromaOf = (hex) => { const [, a, b] = toOklab(parseHex(hex)); return Math.hypot(a, b) }
const hueOf = (hex) => { const [, a, b] = toOklab(parseHex(hex)); return (Math.atan2(b, a) * 180) / Math.PI }
const distance = (x, y) => { const A = toOklab(parseHex(x)), B = toOklab(parseHex(y)); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) }
const ROLES = ["read", "write", "run", "search", "web", "mcp", "agent"]   // paths/types, edits, shell/strings, inline code/numbers, URLs/keywords, versions/functions, subagents

test("every highlight role in a plain palette is a real colour, not a white", () => {
  for (const name of PLAIN) {
    const q = getPalette(PAL, name)
    for (const k of ROLES) assert.ok(chromaOf(q.tool[k]) >= 0.06, `${name} tool.${k} ${q.tool[k]} is too close to white (chroma ${chromaOf(q.tool[k]).toFixed(3)})`)
    for (const k of ["coralLight", "pink", "violet", "blue", "cyan", "amber", "red"]) assert.ok(chromaOf(q.accent[k]) >= 0.06, `${name} accent.${k} ${q.accent[k]} is too close to white`)
  }
})

test("the highlight roles of a plain palette do not look alike", () => {
  for (const name of PLAIN) {
    const q = getPalette(PAL, name)
    for (let i = 0; i < ROLES.length; i++) for (let j = i + 1; j < ROLES.length; j++) {
      const d = distance(q.tool[ROLES[i]], q.tool[ROLES[j]])
      assert.ok(d >= 0.05, `${name}: tool.${ROLES[i]} ${q.tool[ROLES[i]]} and tool.${ROLES[j]} ${q.tool[ROLES[j]]} are only ${d.toFixed(3)} apart`)
    }
  }
})

test("a plain palette has no cool synth hues: every tinted colour is red-to-yellow, except green for success", () => {
  for (const name of PLAIN) {
    const q = getPalette(PAL, name)
    const colours = [...Object.entries(q.accent).filter(([k]) => k !== "mint"), ...Object.entries(q.tool),
      ...Object.entries(q.ansi).filter(([k]) => !/green|black|white/i.test(k))]
    for (const [k, v] of colours) {
      if (chromaOf(v) < 0.03) continue                        // neutral greys are fine
      const h = hueOf(v)
      assert.ok(h >= -40 && h <= 110, `${name} ${k} ${v} has hue ${h.toFixed(0)}° (blue/purple/cyan are not part of this palette)`)
    }
  }
})

test("a palette can pin Claude Code theme tokens, and one that does not leaves them mapped from its accents", () => {
  const e = getPalette(PAL, "ember")
  assert.equal(claudeTheme(e).overrides.promptBorder, e.theme.promptBorder)
  assert.notEqual(e.theme.promptBorder, e.accent.violet)
  const a = getPalette(PAL, "aurora")
  assert.equal(a.theme, undefined)
  assert.equal(claudeTheme(a).overrides.promptBorder, a.accent.violet)
})
