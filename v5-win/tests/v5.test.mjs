// v5 tests: the meters' palettes, their load order, the status line switch and the deck file swap, apply and revert.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const { loadSpec, resolve, merged, apply, revert } = await import("../../v3-win/tools/kit.mjs")
const CTX = "context-bar@kasasree-mods", USAGE = "usage-meter@kasasree-mods"
const quiet = { log: () => {} }
const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
  if (d < 0.08) return null
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}
const warm = (hex) => { const h = hue(hex); return h === null || h < 150 || h > 300 }

test("each palette gives context-bar six different warm category shades and usage-meter a warm ramp; nothing blue, purple or cyan", () => {
  for (const name of ["ember", "amber", "crimson"]) {
    const v = resolve(loadSpec(root), name)
    const ctx = JSON.parse(v.options[CTX].palette), usage = JSON.parse(v.options[USAGE].palette)
    assert.equal(new Set(ctx.used.map((c) => c.toLowerCase())).size, 6, `${name}: category colours must differ`)
    for (const c of [...ctx.used, ctx.messages, ctx.accent, ctx.warn, ctx.err, ...usage.ramp]) assert.ok(warm(c), `${name}: ${c} is a cool hue`)
    assert.ok(usage.ramp.length >= 2 && usage.ramp.every((c) => /^#[0-9A-Fa-f]{6}$/.test(c)))
  }
})

test("usage-meter loads before context-bar (it joins the line context-bar draws beneath it), and the deck is told to draw one row", () => {
  const before = JSON.stringify({ enabledPlugins: { "skins@kasasree-mods": true, [CTX]: false, [USAGE]: false }, env: { KEEP: "1" } })
  const after = JSON.parse(merged(before, resolve(loadSpec(root), "ember")))
  const order = Object.keys(after.enabledPlugins)
  assert.equal(order[0], USAGE)
  assert.ok(order.indexOf(USAGE) < order.indexOf(CTX))
  assert.deepEqual(after.env, { KEEP: "1", AURORA_DECK_ROWS: "1" })
  assert.equal(after.pluginConfigs[CTX].options.style, "line")
  assert.equal(after.pluginConfigs[USAGE].options.join, "on")
})

async function sandbox(fn, { deck = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-v5-"))
  const prev = process.env.RICE_HOME
  process.env.RICE_HOME = dir
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true })
  const file = path.join(dir, ".claude", "settings.json")
  fs.writeFileSync(file, JSON.stringify({ enabledPlugins: { "skins@kasasree-mods": true, [CTX]: false, [USAGE]: false } }, null, 2) + "\n")
  const deckFile = path.join(dir, ".rice", "current", "statusline", "aurora-deck.mjs")
  if (deck) { fs.mkdirSync(path.dirname(deckFile), { recursive: true }); fs.writeFileSync(deckFile, "// the deck as v2.2 applied it\n") }
  try { return await fn(file, deckFile) } finally { if (prev === undefined) delete process.env.RICE_HOME; else process.env.RICE_HOME = prev; fs.rmSync(dir, { recursive: true, force: true }) }
}

test("apply swaps in the one-row-capable deck and sets the env; revert puts back the old deck and the exact settings file", async () => {
  await sandbox((file, deckFile) => {
    const original = fs.readFileSync(file, "utf8")
    const dry = apply(loadSpec(root), "ember", { dryRun: true, ...quiet })
    assert.ok(dry.changes.includes("env AURORA_DECK_ROWS = 1"))
    assert.ok(dry.changes.some((c) => c.startsWith("update ") && c.endsWith("aurora-deck.mjs")))
    assert.equal(fs.readFileSync(deckFile, "utf8"), "// the deck as v2.2 applied it\n", "a dry run copies nothing")
    apply(loadSpec(root), "ember", quiet)
    assert.match(fs.readFileSync(deckFile, "utf8"), /AURORA_DECK_ROWS/)
    assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).env.AURORA_DECK_ROWS, "1")
    revert(quiet)
    assert.equal(fs.readFileSync(file, "utf8"), original)
    assert.equal(fs.readFileSync(deckFile, "utf8"), "// the deck as v2.2 applied it\n")
  })
})

test("revert after a later settings edit removes only v5's env key and keeps yours", async () => {
  await sandbox((file) => {
    apply(loadSpec(root), "ember", quiet)
    const s = JSON.parse(fs.readFileSync(file, "utf8"))
    s.env.MINE = "x"
    fs.writeFileSync(file, JSON.stringify(s, null, 2))
    revert(quiet)
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")).env, { MINE: "x" })
  })
})

test("with no applied v2 rice (no deck to replace), apply still switches the mods and skips the file", async () => {
  await sandbox((file, deckFile) => {
    apply(loadSpec(root), "ember", quiet)
    assert.equal(fs.existsSync(deckFile), false)
    assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).enabledPlugins[USAGE], true)
  }, { deck: false })
})
