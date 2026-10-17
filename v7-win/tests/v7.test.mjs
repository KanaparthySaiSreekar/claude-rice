// v7 tests: every pane mod is on and opens its pane by itself, every option it sets exists in that mod's manifest,
// and apply and revert put the settings file back byte for byte.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MARKET = path.resolve(root, "..", "..", "claude-mods-local")
const { loadSpec, resolve, merged, apply, revert } = await import("../../v3-win/tools/kit.mjs")
const quiet = { log: () => {} }
const PANES = ["aurora-bridge", "flightdeck", "filetree", "cockpit", "paneline", "cctop", "prismantis"].map((n) => `${n}@kasasree-mods`)

test("all six pane mods are switched on, and each one that needs telling is told to open its pane on start", () => {
  const v = resolve(loadSpec(root), "ember")
  for (const id of PANES) assert.equal(v.plugins[id], true, id)
  assert.equal(v.options["aurora-bridge@kasasree-mods"].openOnStart, true)
  assert.equal(v.options["flightdeck@kasasree-mods"].openOnStart, true)
  assert.equal(v.options["filetree@kasasree-mods"].start, "on")
  assert.equal(v.options["paneline@kasasree-mods"].autoOpen, true)
  assert.equal(v.options["cctop@kasasree-mods"].openOnStart, true)
  // cockpit has no option: it opens its pane on every interactive start
})

test("paneline leaves the chat to prismantis, flightdeck leaves the status line to the deck, Bridge gets the palette", () => {
  const v = resolve(loadSpec(root), "ember")
  assert.equal(v.options["paneline@kasasree-mods"].chat, false)
  assert.equal(v.options["flightdeck@kasasree-mods"].statusLine, false)
  const bridge = JSON.parse(v.options["aurora-bridge@kasasree-mods"].palette)
  assert.match(bridge.coral, /^#[0-9A-Fa-f]{6}$/)
})

test("prismantis draws the chat instead of skins: tool calls as rows on the right with nothing under them, copy said on the button, retro diffs", () => {
  const v = resolve(loadSpec(root), "ember")
  assert.equal(v.plugins["prismantis@kasasree-mods"], true)
  assert.equal(v.plugins["skins@kasasree-mods"], false)
  const o = v.options["prismantis@kasasree-mods"]
  assert.equal(o.theme, "ember")
  assert.equal(o.toolStyle, "chat")
  assert.equal(o.toolOutput, "rows")
  assert.equal(o.copyFeedback, "button")
  assert.equal(o.headingStyle, "bar")
  assert.match(o.diffAddedColor, /^#[0-9A-F]{6}$/)
  assert.match(o.diffRemovedColor, /^#[0-9A-F]{6}$/)
  // the tint behind changed lines is mixed from those colours, not from their full hue (plain red and green)
  assert.equal(o.diffTint, "color")
})

test("cockpit draws only its panel: no band above the prompt, no status line", () => {
  const v = resolve(loadSpec(root), "ember")
  assert.deepEqual(v.options["cockpit@kasasree-mods"], { band: false, statusLine: false })
})

test("the spinner words are plain ones, and revert puts the old list back even after other edits", async () => {
  const v = resolve(loadSpec(root), "ember")
  const verbs = v.settings.spinnerVerbs.verbs
  assert.equal(v.settings.spinnerVerbs.mode, "replace")
  for (const silly of ["Noodling", "Pondering", "Spelunking the codebase", "Percolating"]) assert.ok(!verbs.includes(silly), silly)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-v7-"))
  const prev = process.env.RICE_HOME
  process.env.RICE_HOME = dir
  try {
    fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
    const file = path.join(dir, ".claude", "settings.json")
    fs.writeFileSync(file, JSON.stringify({ spinnerVerbs: { mode: "replace", verbs: ["Noodling"] }, enabledPlugins: {} }, null, 2) + "\n")
    apply(loadSpec(root), "ember", quiet)
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")).spinnerVerbs.verbs, verbs)
    const s = JSON.parse(fs.readFileSync(file, "utf8"))
    s.theme = "dark"
    fs.writeFileSync(file, JSON.stringify(s, null, 2) + "\n")
    revert(quiet)
    const back = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.deepEqual(back.spinnerVerbs.verbs, ["Noodling"])
    assert.equal(back.theme, "dark")
  } finally {
    if (prev === undefined) delete process.env.RICE_HOME
    else process.env.RICE_HOME = prev
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test("every mod is in the pinned marketplace and every option v7 sets is declared in that mod's manifest", { skip: !fs.existsSync(MARKET) && "claude-mods-local is not next to this repo" }, () => {
  const market = JSON.parse(fs.readFileSync(path.join(MARKET, ".claude-plugin", "marketplace.json"), "utf8"))
  const v = resolve(loadSpec(root), "ember")
  for (const id of PANES) {
    const name = id.split("@")[0]
    const entry = market.plugins.find((p) => p.name === name)
    assert.ok(entry, `${name} is not in the marketplace`)
    const manifest = JSON.parse(fs.readFileSync(path.join(MARKET, entry.source, ".claude-plugin", "plugin.json"), "utf8"))
    for (const key of Object.keys(v.options[id] ?? {})) assert.ok(key in (manifest.userConfig ?? {}), `${name} has no option ${key}`)
  }
})

test("merging keeps every other plugin and setting as it was", () => {
  const before = JSON.stringify({ enabledPlugins: { "image-view@kasasree-mods": true, "flightdeck@kasasree-mods": false }, theme: "custom:ember" })
  const after = JSON.parse(merged(before, resolve(loadSpec(root), "ember")))
  assert.equal(after.enabledPlugins["image-view@kasasree-mods"], true)
  assert.equal(after.enabledPlugins["flightdeck@kasasree-mods"], true)
  assert.equal(after.theme, "custom:ember")
})

test("apply then revert puts the settings file back byte for byte", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-v7-"))
  const prev = process.env.RICE_HOME
  process.env.RICE_HOME = dir
  try {
    fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
    const file = path.join(dir, ".claude", "settings.json")
    const original = JSON.stringify({ enabledPlugins: { "skins@kasasree-mods": true, "filetree@kasasree-mods": true }, pluginConfigs: { "filetree@kasasree-mods": { options: { start: "off" } } } }, null, 2) + "\n"
    fs.writeFileSync(file, original)
    apply(loadSpec(root), "ember", quiet)
    const applied = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.equal(applied.pluginConfigs["filetree@kasasree-mods"].options.start, "on")
    assert.equal(applied.enabledPlugins["cctop@kasasree-mods"], true)
    revert(quiet)
    assert.equal(fs.readFileSync(file, "utf8"), original)
  } finally {
    if (prev === undefined) delete process.env.RICE_HOME
    else process.env.RICE_HOME = prev
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
