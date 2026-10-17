// v4 tests: the Calm fork's palette from the rice palettes, the load order Calm needs, and apply/revert/preview-order safety.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const kit = await import("../../v3-win/tools/kit.mjs")
const { loadSpec, resolve, merged, apply, revert, previewOrder } = kit
const LOCAL = path.resolve(root, "..", "..", "claude-mods-local")
const CALM = "firstmate-calm@kasasree-mods"
const quiet = { log: () => {} }

const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
  if (d < 0.08) return null
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

test("the boat's palette comes from each rice palette: four #RRGGBB colours, none of them blue, purple or cyan", () => {
  for (const name of ["ember", "amber", "crimson"]) {
    const ship = JSON.parse(resolve(loadSpec(root), name).options[CALM].palette)
    assert.deepEqual(Object.keys(ship).sort(), ["boat", "label", "sail", "water"], name)
    for (const [k, v] of Object.entries(ship)) {
      assert.match(v, /^#[0-9A-Fa-f]{6}$/, `${name}.${k}`)
      const h = hue(v)
      assert.ok(h === null || h < 150 || h > 300, `${name}.${k} ${v} is a cool hue`)
    }
  }
})

test("Calm is moved to the front of enabledPlugins (Claude Code loads mods in that order, first = outermost), values untouched", () => {
  const before = JSON.stringify({ enabledPlugins: { "a@x": true, "skins@kasasree-mods": true, "aurora-bridge@kasasree-mods": true, [CALM]: false }, model: "opus" })
  const after = JSON.parse(merged(before, resolve(loadSpec(root), "ember")))
  assert.equal(Object.keys(after.enabledPlugins)[0], CALM)
  assert.equal(after.enabledPlugins[CALM], true)
  assert.equal(after.enabledPlugins["skins@kasasree-mods"], true, "v4 keeps skins for the reply text")
  assert.equal(after.enabledPlugins["prismantis@kasasree-mods"], false)
  assert.deepEqual(Object.keys(after.enabledPlugins).slice(1, 4), ["a@x", "skins@kasasree-mods", "aurora-bridge@kasasree-mods"])
  assert.equal(after.model, "opus")
})

async function sandbox(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-v4-"))
  const prev = process.env.RICE_HOME
  process.env.RICE_HOME = dir
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
  const file = path.join(dir, ".claude", "settings.json")
  fs.writeFileSync(file, JSON.stringify({ enabledPlugins: { "skins@kasasree-mods": true, "aurora-bridge@kasasree-mods": true, [CALM]: false } }, null, 4) + "\n")
  try { return await fn(file) } finally { if (prev === undefined) delete process.env.RICE_HOME; else process.env.RICE_HOME = prev; fs.rmSync(dir, { recursive: true, force: true }) }
}

test("a dry run names the load-order change; apply then revert gives back the exact file, order included", async () => {
  await sandbox((file) => {
    const original = fs.readFileSync(file, "utf8")
    const dry = apply(loadSpec(root), "ember", { dryRun: true, ...quiet })
    assert.ok(dry.changes.some((c) => c.startsWith("load first")), dry.changes.join("; "))
    apply(loadSpec(root), "ember", quiet)
    assert.equal(Object.keys(JSON.parse(fs.readFileSync(file, "utf8")).enabledPlugins)[0], CALM)
    revert(quiet)
    assert.equal(fs.readFileSync(file, "utf8"), original)
  })
})

test("preview-order changes only the order, and off puts the file back byte for byte", async () => {
  await sandbox((file) => {
    const original = fs.readFileSync(file, "utf8")
    assert.equal(previewOrder(loadSpec(root), "on", quiet), true)
    const reordered = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.equal(Object.keys(reordered.enabledPlugins)[0], CALM)
    assert.deepEqual(reordered.enabledPlugins, JSON.parse(original).enabledPlugins, "values must not change")
    assert.equal(previewOrder(loadSpec(root), "off", quiet), true)
    assert.equal(fs.readFileSync(file, "utf8"), original)
    assert.equal(previewOrder(loadSpec(root), "off", quiet), false)
  })
})

const sprite = path.join(LOCAL, "plugins", "firstmate-calm", "lib", "fm-calm-working-ship-sprite.ts")
test("the pinned fork draws its sails with glyphs JetBrainsMono NFM has (not upstream's U+25FF and U+25E3)", { skip: !fs.existsSync(sprite) && "local marketplace not on this machine" }, () => {
  const src = fs.readFileSync(sprite, "utf8")
  assert.match(src, /const LEFT_SAIL = "\\uE0BA";/)
  assert.match(src, /const RIGHT_SAIL = "\\uE0B8";/)
  assert.ok(!/const (LEFT|RIGHT)_SAIL = "[\u25FF\u25E3]"/.test(src))
})
