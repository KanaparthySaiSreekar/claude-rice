// node --test tests/apply.test.mjs   (everything runs against a throwaway copy of the layout under the OS temp dir)
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getPalette } from "../tools/lib/palette.mjs"
import { writeBuild } from "../tools/build.mjs"
import { apply, revert, status, locations, mergeClaudeSettings, mergeWtSettings, mergeSkinsStore, FLIGHTDECK, HUD, BRIDGE, PANELS } from "../tools/apply.mjs"
import { bridgePalette } from "../tools/build.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const p = getPalette(path.join(ROOT, "palette", "palettes.json"), "aurora")

const SETTINGS = {
  env: { CLAUDE_CODE_DISABLE_TERMINAL_TITLE: "1" }, model: "sonnet",
  hooks: { Stop: [{ hooks: [{ type: "command", command: "node tab-title.mjs" }] }] },
  statusLine: { type: "command", command: "exec hud.cmd" },
  enabledPlugins: { [HUD]: true, "skins@kasasree-mods": true, [FLIGHTDECK]: true, "getlayers@getlayers": true },
  extraKnownMarketplaces: { "kasasree-mods": { source: { source: "directory", path: "C:\\x" } } },
  pluginConfigs: { [FLIGHTDECK]: { options: { openOnStart: true, statusLine: false } }, "filetree@kasasree-mods": { options: { start: "off" } } },
  spinnerVerbs: { mode: "replace", verbs: ["Pondering"] }, theme: "custom:claude", tui: "fullscreen", skipDangerousModePermissionPrompt: true,
}
const WT = {
  $schema: "https://aka.ms/terminal-profiles-schema", defaultProfile: "{574e775e-4f2a-5b96-ac1e-a2962a402336}",
  keybindings: [{ id: "Terminal.CopyToClipboard", keys: "ctrl+c" }], actions: [],
  profiles: { defaults: { antialiasingMode: "grayscale", colorScheme: "Claude", opacity: 95, padding: "14, 10, 14, 10", tabColor: "#D97757", useAcrylic: true, font: { face: "JetBrainsMono NFM", size: 11, weight: "medium" } },
    list: [{ guid: "{574e775e-4f2a-5b96-ac1e-a2962a402336}", name: "PowerShell" }, { guid: "{7b1c9f10-0a15-4c0e-9e2b-0c1a55e5a001}", name: "rice-preview", hidden: true }] },
  schemes: [{ name: "Claude", background: "#2B2A27" }], themes: [],
}
const STORE = { custom: { "claude-warm": { name: "claude-warm", palette: { user: "#d97757" } } }, prefs: { skin: "claude-warm", rail: false, band: false, shimmer: true, tables: "on", countdown: false } }
const OLD_PROFILE = "# my old profile\nSet-PSReadLineOption -EditMode Windows\n"
const OLD_RIO = "# old rio\n"

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-sandbox-"))
  const L = locations(dir)
  const put = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text) }
  put(L.claudeSettings, JSON.stringify(SETTINGS, null, 2) + "\n")
  put(L.skinsStore, JSON.stringify(STORE))
  put(L.wtSettings, JSON.stringify(WT, null, 4) + "\n")
  put(L.psProfile, OLD_PROFILE)
  put(L.rioConfig, OLD_RIO)
  const buildDir = path.join(L.rice, "builds", p.key)
  writeBuild(p, buildDir, { assetsDir: buildDir, pwshPath: "C:\\pwsh.exe", repoRoot: ROOT, art: false })
  return { dir, L, buildDir }
}
const read = (f) => fs.readFileSync(f, "utf8")
const json = (f) => JSON.parse(read(f))
const snapshot = (L) => Object.fromEntries([L.claudeSettings, L.skinsStore, L.wtSettings, L.psProfile, L.rioConfig].map((f) => [f, read(f)]))

test("dry run reports a plan and changes nothing", () => {
  const { dir, L, buildDir } = sandbox(); const before = snapshot(L)
  const res = apply(p, L, { buildDir, dryRun: true })
  assert.ok(res.plan.length >= 6 && res.plan.every((l) => /^(update|create) /.test(l)))
  assert.deepEqual(snapshot(L), before); assert.equal(status(L), null); assert.ok(!fs.existsSync(path.join(L.rice, "backups")))
  fs.rmSync(dir, { recursive: true, force: true })
})

test("apply merges into Claude settings and leaves everything else alone", () => {
  const { dir, L, buildDir } = sandbox()
  apply(p, L, { buildDir })
  const s = json(L.claudeSettings)
  assert.equal(s.theme, "custom:aurora")
  assert.match(s.statusLine.command, /^exec "[^"\\]+\/\.rice\/current\/statusline\/aurora-deck\.cmd"$/, "forward slashes, as Git Bash needs")
  assert.equal(s.statusLine.refreshInterval, 60)
  assert.equal(s.pluginConfigs[FLIGHTDECK].options.panels, PANELS); assert.equal(s.pluginConfigs[FLIGHTDECK].options.statusLine, false); assert.equal(s.pluginConfigs[FLIGHTDECK].options.openOnStart, true)
  assert.deepEqual(s.pluginConfigs["filetree@kasasree-mods"], SETTINGS.pluginConfigs["filetree@kasasree-mods"], "other plugin options untouched")
  assert.equal(s.enabledPlugins[HUD], false, "claude-hud is replaced by the new status line"); assert.equal(s.enabledPlugins["skins@kasasree-mods"], true); assert.equal(s.enabledPlugins["getlayers@getlayers"], true)
  for (const k of ["env", "model", "hooks", "extraKnownMarketplaces", "spinnerVerbs", "tui", "skipDangerousModePermissionPrompt"]) assert.deepEqual(s[k], SETTINGS[k], `${k} must be untouched`)
  assert.ok(fs.existsSync(path.join(L.claudeThemes, "aurora.json")))
  fs.rmSync(dir, { recursive: true, force: true })
})

test("apply installs the runtime files the status line needs", () => {
  const { dir, L, buildDir } = sandbox()
  apply(p, L, { buildDir, nodePath: "C:\\Program Files\\nodejs\\node.exe" })
  const cur = path.join(L.rice, "current")
  for (const f of ["statusline/aurora-deck.mjs", "statusline/aurora-deck.cmd", "statusline/palette.json", "shaders/glow.hlsl"]) assert.ok(fs.existsSync(path.join(cur, f)), f)
  const cmd = read(path.join(cur, "statusline", "aurora-deck.cmd"))
  assert.match(cmd, /^@echo off\r\n"C:\\Program Files\\nodejs\\node\.exe" "%~dp0aurora-deck\.mjs"\r\n$/)
  assert.equal(json(path.join(cur, "statusline", "palette.json")).key, "aurora")
  fs.rmSync(dir, { recursive: true, force: true })
})

test("apply merges into Windows Terminal: scheme, theme, defaults; drops the preview profile; keeps the rest", () => {
  const { dir, L, buildDir } = sandbox()
  apply(p, L, { buildDir })
  const w = json(L.wtSettings)
  assert.equal(w.theme, "Claude Aurora"); assert.ok(w.schemes.some((s) => s.name === "Claude Aurora")); assert.ok(w.schemes.some((s) => s.name === "Claude"), "the old scheme stays available")
  assert.equal(w.themes.filter((t) => t.name === "Claude Aurora").length, 1)
  assert.equal(w.profiles.defaults.colorScheme, "Claude Aurora"); assert.equal(w.profiles.defaults.useAcrylic, false); assert.equal(w.profiles.defaults.opacity, 100)
  assert.match(w.profiles.defaults.backgroundImage, /\.rice\\current\\art\\bg\.png$/); assert.match(w.profiles.defaults["experimental.pixelShaderPath"], /\.rice\\current\\shaders\\glow\.hlsl$/)
  assert.equal(w.profiles.list.length, 1, "the hidden preview profile is removed"); assert.equal(w.profiles.list[0].name, "PowerShell")
  assert.deepEqual(w.keybindings, WT.keybindings); assert.equal(w.defaultProfile, WT.defaultProfile); assert.equal(w.$schema, WT.$schema)
  fs.rmSync(dir, { recursive: true, force: true })
})

test("apply updates the skins store (adds the skin, keeps the old one, flips the settings) and writes profile + Rio config", () => {
  const { dir, L, buildDir } = sandbox()
  apply(p, L, { buildDir })
  const st = json(L.skinsStore)
  assert.ok("claude-warm" in st.custom && "claude-aurora" in st.custom)
  assert.equal(st.prefs.skin, "claude-aurora"); assert.equal(st.prefs.rail, true); assert.equal(st.prefs.band, false); assert.equal(st.prefs.countdown, false, "untouched pref survives")
  assert.match(read(L.psProfile), /function prompt/); assert.match(read(L.rioConfig), /background = "#0C0A18"/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test("applying twice changes nothing the second time, and does not duplicate anything", () => {
  const { dir, L, buildDir } = sandbox()
  apply(p, L, { buildDir }); const once = snapshot(L)
  apply(p, L, { buildDir }); const twice = snapshot(L)
  assert.deepEqual(twice, once)
  const w = json(L.wtSettings); assert.equal(w.schemes.filter((s) => s.name === "Claude Aurora").length, 1); assert.equal(w.themes.length, 1)
  assert.equal(fs.readdirSync(path.join(L.rice, "backups")).length, 2, "each apply leaves its own backup")
  fs.rmSync(dir, { recursive: true, force: true })
})

test("revert restores every file byte for byte and removes what did not exist before", () => {
  const { dir, L, buildDir } = sandbox(); const before = snapshot(L)
  apply(p, L, { buildDir })
  assert.notDeepEqual(snapshot(L), before)
  const res = revert(L)
  assert.deepEqual(snapshot(L), before, "originals are back, identical")
  assert.ok(!fs.existsSync(path.join(L.claudeThemes, "aurora.json")), "the theme file the rice created is removed")
  assert.ok(!fs.existsSync(path.join(L.rice, "current")) && status(L) === null)
  assert.ok(res.log.length >= 5)
  fs.rmSync(dir, { recursive: true, force: true })
})

test("revert goes back to the right backup after two applies", () => {
  const { dir, L, buildDir } = sandbox(); const before = snapshot(L)
  apply(p, L, { buildDir }); const mid = snapshot(L)
  apply(p, L, { buildDir })
  revert(L)                      // newest backup = the state after the first apply
  assert.deepEqual(snapshot(L), mid)
  fs.rmSync(dir, { recursive: true, force: true })
})

test("--no-terminal leaves Windows Terminal, the PowerShell profile and Rio alone", () => {
  const { dir, L, buildDir } = sandbox(); const before = snapshot(L)
  apply(p, L, { buildDir, skipTerminal: true })
  const after = snapshot(L)
  for (const f of [L.wtSettings, L.psProfile, L.rioConfig]) assert.equal(after[f], before[f])
  assert.notEqual(after[L.claudeSettings], before[L.claudeSettings])
  fs.rmSync(dir, { recursive: true, force: true })
})

test("the pure merges do not mutate their input and tolerate missing keys", () => {
  const s = structuredClone(SETTINGS); mergeClaudeSettings(s, p, { shim: "C:\\a\\b.cmd" }); assert.deepEqual(s, SETTINGS)
  const bare = mergeClaudeSettings({}, p, { shim: "C:\\a\\b.cmd" })
  assert.equal(bare.theme, "custom:aurora"); assert.equal(bare.statusLine.command, 'exec "C:/a/b.cmd"'); assert.equal(bare.pluginConfigs[FLIGHTDECK].options.panels, PANELS)
  const w = structuredClone(WT); mergeWtSettings(w, p, "C:\\assets"); assert.deepEqual(w, WT)
  assert.equal(mergeWtSettings({ profiles: {} }, p, "C:\\assets").theme, "Claude Aurora")
  const st = structuredClone(STORE); mergeSkinsStore(st, p); assert.deepEqual(st, STORE)
})

test("revert with no backup says so instead of guessing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-sandbox-")); const L = locations(dir)
  assert.throws(() => revert(L), /no backup/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test("with the Bridge installed it replaces flightdeck and gets the palette as its option", () => {
  const withBridge = structuredClone(SETTINGS); withBridge.enabledPlugins[BRIDGE] = true
  withBridge.pluginConfigs[BRIDGE] = { options: { width: 64, demo: "off" } }
  for (const name of ["aurora", "ember"]) {
    const q = getPalette(path.join(ROOT, "palette", "palettes.json"), name)
    const out = mergeClaudeSettings(withBridge, q, { shim: "C:\\a\\b.cmd" })
    assert.equal(out.enabledPlugins[BRIDGE], true); assert.equal(out.enabledPlugins[FLIGHTDECK], false, "flightdeck stays installed but off")
    assert.deepEqual(JSON.parse(out.pluginConfigs[BRIDGE].options.palette), bridgePalette(q))
    assert.equal(out.pluginConfigs[BRIDGE].options.width, 64, "the user's own option survives"); assert.equal(out.pluginConfigs[BRIDGE].options.demo, "off")
    assert.equal(out.pluginConfigs[BRIDGE].options.openOnStart, true)
    assert.ok(!(PANELS in (out.pluginConfigs[FLIGHTDECK]?.options ?? {})) && out.pluginConfigs[FLIGHTDECK]?.options.panels === undefined, "flightdeck's panels are no longer managed")
  }
  assert.deepEqual(withBridge.enabledPlugins[FLIGHTDECK], true, "input not mutated")
})

test("applying a palette with no art takes a previous palette's background picture away", () => {
  const { dir, L } = sandbox()
  const ember = getPalette(path.join(ROOT, "palette", "palettes.json"), "ember")
  const wt = json(L.wtSettings); wt.profiles.defaults.backgroundImage = "C:\\old\\bg.png"; wt.profiles.defaults.backgroundImageOpacity = 0.42
  fs.writeFileSync(L.wtSettings, JSON.stringify(wt))
  const emberBuild = path.join(L.rice, "builds", "ember"); writeBuild(ember, emberBuild, { assetsDir: emberBuild, pwshPath: "C:\\pwsh.exe", repoRoot: ROOT })
  apply(ember, L, { buildDir: emberBuild })
  const d = json(L.wtSettings).profiles.defaults
  assert.ok(!("backgroundImage" in d) && !("backgroundImageOpacity" in d), JSON.stringify(d))
  assert.equal(d.colorScheme, "Claude Ember"); assert.equal(d.opacity, 100)
  assert.ok(!fs.existsSync(path.join(emberBuild, "art")), "no art folder is built for a plain palette")
  fs.rmSync(dir, { recursive: true, force: true })
})

test("applying a palette without the glow takes an earlier apply's glow shader away", () => {
  const { dir, L } = sandbox()
  const ember = getPalette(path.join(ROOT, "palette", "palettes.json"), "ember")
  const wt = json(L.wtSettings); wt.profiles.defaults["experimental.pixelShaderPath"] = "C:\\old\\.rice\\current\\shaders\\glow.hlsl"
  fs.writeFileSync(L.wtSettings, JSON.stringify(wt))
  const emberBuild = path.join(L.rice, "builds", "ember"); writeBuild(ember, emberBuild, { assetsDir: emberBuild, pwshPath: "C:\\pwsh.exe", repoRoot: ROOT })
  apply(ember, L, { buildDir: emberBuild })
  const d = json(L.wtSettings).profiles.defaults
  assert.ok(!("experimental.pixelShaderPath" in d), JSON.stringify(d))
  assert.equal(d.colorScheme, "Claude Ember")
  fs.rmSync(dir, { recursive: true, force: true })
})
