// v6 tests: the breathing glow comes from the palette, warm and brightening; the mod loads first; apply/revert are safe.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const { loadSpec, resolve, merged, apply, revert } = await import("../../v3-win/tools/kit.mjs")
const MOD = "mindful-breath@kasasree-mods"
const quiet = { log: () => {} }
const lum = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)

test("each palette's glow is four #RRGGBB stops that get brighter, empty lungs to full", () => {
  for (const name of ["ember", "amber", "crimson"]) {
    const p = JSON.parse(resolve(loadSpec(root), name).options[MOD].palette)
    assert.equal(p.glow.length, 4)
    for (const c of [...p.glow, p.accent, p.label]) assert.match(c, /^#[0-9A-Fa-f]{6}$/)
    assert.ok(lum(p.glow[0]) < lum(p.glow[3]), `${name}: the full breath must be brighter than the empty one`)
  }
})

test("the band is asked for 5 rows and the mod loads first", () => {
  const after = JSON.parse(merged(JSON.stringify({ enabledPlugins: { "skins@kasasree-mods": true, [MOD]: false } }), resolve(loadSpec(root), "ember")))
  assert.equal(Object.keys(after.enabledPlugins)[0], MOD)
  assert.equal(after.pluginConfigs[MOD].options.rows, "5")
})

test("apply then revert gives back the exact settings file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-v6-"))
  const prev = process.env.RICE_HOME
  process.env.RICE_HOME = dir
  try {
    fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
    const file = path.join(dir, ".claude", "settings.json")
    fs.writeFileSync(file, JSON.stringify({ enabledPlugins: { "skins@kasasree-mods": true, [MOD]: false } }, null, 2) + "\n")
    const original = fs.readFileSync(file, "utf8")
    apply(loadSpec(root), "ember", quiet)
    assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).enabledPlugins[MOD], true)
    revert(quiet)
    assert.equal(fs.readFileSync(file, "utf8"), original)
  } finally { if (prev === undefined) delete process.env.RICE_HOME; else process.env.RICE_HOME = prev; fs.rmSync(dir, { recursive: true, force: true }) }
})
