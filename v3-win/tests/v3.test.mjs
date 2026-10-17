// v3 tests: the prismantis presets come from the palette file, the pinned plugin has them, and apply/revert are safe.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const { presets, tsBlock, withBlock, NAMES, TOKENS } = await import("../tools/presets.mjs")
const { loadSpec, resolve, merged } = await import("../tools/kit.mjs")
const LOCAL = path.resolve(root, "..", "..", "claude-mods-local")
const pinned = path.join(LOCAL, "plugins", "prismantis", "hooks", "presets.ts")

test("every rice preset fills every prismantis slot (and the alert slots) with a hex colour", () => {
  for (const [name, { theme }] of Object.entries(presets())) {
    assert.deepEqual(TOKENS.filter((k) => !/^#[0-9A-Fa-f]{6}$/.test(theme[k] ?? "")), [], name)
  }
})

test("the pinned plugin carries exactly the presets the palette file makes today (no drift)", { skip: !fs.existsSync(pinned) && "local marketplace not on this machine" }, () => {
  const source = fs.readFileSync(pinned, "utf8").split("\r\n").join("\n")
  assert.ok(source.includes(tsBlock()), "run: node tools/presets.mjs --write <presets.ts>")
})

test("writing the presets twice changes nothing, keeps CRLF, and leaves the other presets alone", () => {
  const upstream = "export const PRESETS = {\r\n  nord: {\r\n    accent: '#88c0d0',\r\n  },\r\n  mono: {} as Theme,\r\n} satisfies Record<string, Theme>\r\n"
  const once = withBlock(upstream)
  assert.equal(withBlock(once), once)
  assert.ok(!once.replace(/\r\n/g, "").includes("\n"), "a bare LF slipped into a CRLF file")
  assert.ok(once.includes("  nord: {\r\n    accent: '#88c0d0',\r\n  },"))
  for (const n of NAMES) assert.equal(once.split(`\r\n  ${n}: {`).length, 2, n)
  assert.ok(once.indexOf("crimson") < once.indexOf("mono"))
})

test("version.json resolves {palette} and names only plugins the local marketplace has", () => {
  const spec = loadSpec(root)
  const v = resolve(spec, "amber")
  assert.equal(v.options["prismantis@kasasree-mods"].theme, "amber")
  assert.equal(v.plugins["skins@kasasree-mods"], false, "two transcript renderers must never run together")
  const manifest = path.join(LOCAL, ".claude-plugin", "marketplace.json")
  if (fs.existsSync(manifest)) {
    const have = JSON.parse(fs.readFileSync(manifest, "utf8")).plugins.map((p) => `${p.name}@kasasree-mods`)
    for (const k of [...Object.keys(v.plugins), ...Object.keys(v.options)]) assert.ok(have.includes(k), k)
  }
})

test("merging keeps every key the version does not own, and merges option objects instead of replacing them", () => {
  const before = JSON.stringify({ model: "opus", enabledPlugins: { "skins@kasasree-mods": true, "x@y": true }, pluginConfigs: { "prismantis@kasasree-mods": { options: { clock: "24h" } }, "filetree@kasasree-mods": { options: { start: "off" } } } })
  const after = JSON.parse(merged(before, resolve(loadSpec(root), "ember")))
  assert.equal(after.model, "opus")
  assert.equal(after.enabledPlugins["x@y"], true)
  assert.equal(after.enabledPlugins["skins@kasasree-mods"], false)
  assert.equal(after.pluginConfigs["prismantis@kasasree-mods"].options.clock, "24h")
  assert.equal(after.pluginConfigs["prismantis@kasasree-mods"].options.theme, "ember")
  assert.deepEqual(after.pluginConfigs["filetree@kasasree-mods"], { options: { start: "off" } })
})

// apply / revert against a throwaway home directory
async function sandbox(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-v3-"))
  const prev = process.env.RICE_HOME
  process.env.RICE_HOME = dir
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
  const file = path.join(dir, ".claude", "settings.json")
  fs.writeFileSync(file, JSON.stringify({ theme: "custom:ember", enabledPlugins: { "skins@kasasree-mods": true } }, null, 4) + "\n")
  try { return await fn(file) } finally { if (prev === undefined) delete process.env.RICE_HOME; else process.env.RICE_HOME = prev; fs.rmSync(dir, { recursive: true, force: true }) }
}
const quiet = { log: () => {} }

test("a dry run writes nothing, apply is idempotent, and revert is byte for byte", async () => {
  const { apply, revert } = await import("../tools/kit.mjs")
  await sandbox((file) => {
    const original = fs.readFileSync(file, "utf8")
    apply(loadSpec(root), "ember", { dryRun: true, ...quiet })
    assert.equal(fs.readFileSync(file, "utf8"), original)
    apply(loadSpec(root), "ember", quiet)
    const once = fs.readFileSync(file, "utf8")
    assert.notEqual(once, original)
    assert.deepEqual(apply(loadSpec(root), "ember", quiet).changes, [])
    assert.equal(fs.readFileSync(file, "utf8"), once)
    assert.equal(revert(quiet).how, "byte for byte")
    assert.equal(fs.readFileSync(file, "utf8"), original)
    assert.equal(revert(quiet), null)
  })
})

test("revert after a later edit undoes only the version's keys and keeps the edit", async () => {
  const { apply, revert } = await import("../tools/kit.mjs")
  await sandbox((file) => {
    apply(loadSpec(root), "ember", quiet)
    const s = JSON.parse(fs.readFileSync(file, "utf8"))
    s.model = "sonnet"                                              // a /config change made after the apply
    s.pluginConfigs["prismantis@kasasree-mods"].options.clock = "24h"
    fs.writeFileSync(file, JSON.stringify(s, null, 2))
    assert.match(revert(quiet).how, /only the keys/)
    const after = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.equal(after.model, "sonnet")
    assert.equal(after.enabledPlugins["skins@kasasree-mods"], true)
    assert.equal(after.enabledPlugins["prismantis@kasasree-mods"], undefined)
    assert.deepEqual(after.pluginConfigs["prismantis@kasasree-mods"].options, { clock: "24h" })
  })
})
