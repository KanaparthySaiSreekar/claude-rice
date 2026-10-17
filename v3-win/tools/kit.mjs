// kit.mjs: switch the live Claude Code setup to a "community mod" version (v3 to v6) and back, and stage a preview of it.
// Every one of those versions sits on top of the v2 rice (palette, theme, status line, Bridge pane) and changes only which
// mods run and how they are configured. Each version folder holds a version.json:
//
//   { "tag": "v3", "label": "...", "plugins": { "<name>@kasasree-mods": true | false },
//     "first": ["<name>@kasasree-mods"],                  (optional) plugins moved to the front of enabledPlugins
//     "options": { "<name>@kasasree-mods": { "<option>": <value> } } }
//
// A string value "{palette}" becomes the palette name, "{palette:<builder>}" the JSON a builder below makes for it.
//
//   node tools/rice.mjs apply [palette] [--dry-run]   back up ~/.claude/settings.json, then merge the version into it
//   node tools/rice.mjs revert                        undo the newest apply: byte for byte if settings.json is untouched since,
//                                                     otherwise only the keys that apply set (later changes of yours stay)
//   node tools/rice.mjs status
//   node tools/rice.mjs preview <palette>             write a --settings file for a throwaway preview process (live setup untouched)
//   node tools/rice.mjs preview-order on|off          a --settings file cannot reorder plugins, so for a preview of a version
//                                                     with "first", "on" reorders settings.json's enabledPlugins (values kept,
//                                                     original saved) and "off" puts the file back byte for byte
//
// Only enabledPlugins and pluginConfigs.<plugin>.options keys named in version.json are touched; every other key survives.
import fs from "node:fs"
import crypto from "node:crypto"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
export const V2 = path.resolve(here, "..", "..", "v2-win")
const { getPalette } = await import(pathUrl(path.join(V2, "tools", "lib", "palette.mjs")))
const { claudeTheme, bridgePalette, statusPalette } = await import(pathUrl(path.join(V2, "tools", "build.mjs")))
export const PALETTES = path.join(V2, "palette", "palettes.json")

function pathUrl(p) { return "file:///" + p.replace(/\\/g, "/") }

export const home = () => process.env.RICE_HOME ?? os.homedir()                // tests point this at a sandbox
export const settingsFile = () => path.join(home(), ".claude", "settings.json")
export const riceDir = () => path.join(home(), ".rice")
const stateFile = () => path.join(riceDir(), "versions.json")

export function loadSpec(dir) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "version.json"), "utf8"))
  if (!/^v\d+$/.test(spec.tag ?? "")) throw new Error(`version.json in ${dir} has no tag like "v3"`)
  return { ...spec, dir }
}

const BUILDERS = {
  bridge: (p) => JSON.stringify(bridgePalette(p)),
  // v4, firstmate-calm: orange hull, cream sails, the dim accent (the prompt frame's colour) for the sea, muted word
  ship: (p) => JSON.stringify({ boat: p.accent.coral, sail: p.base.fg, water: p.theme?.promptBorder ?? p.darker(p.accent.coral, 0.45), label: p.base.muted }),
  // v5, context-bar: one warm shade per context category (the tool slots), messages in the accent, free and buffer dim
  ctx: (p) => JSON.stringify({ used: [p.tool.read, p.tool.run, p.tool.search, p.tool.web, p.tool.mcp, p.tool.agent], messages: p.accent.coral, free: p.base.line, buffer: p.base.dim,
    ok: p.semantic.ok, warn: p.semantic.warn, err: p.semantic.err, label: p.base.muted, accent: p.accent.coral, fg: p.base.fg }),
  // v5, usage-meter: the bars along the palette ramp, as the v2 status line draws its gauges
  usage: (p) => JSON.stringify({ ramp: p.ramp, ok: p.semantic.ok, warn: p.semantic.warn, err: p.semantic.err, label: p.base.muted, fg: p.base.fg }),
  // v6, mindful-breath: an ember that brightens as you breathe in: the dim accent, the accent, amber, the palest ramp stop
  breath: (p) => JSON.stringify({ glow: [p.theme?.promptBorder ?? p.darker(p.accent.coral, 0.45), p.accent.coral, p.accent.amber, p.ramp[0]], accent: p.accent.coral, label: p.base.muted }),
}
export const builderNames = () => Object.keys(BUILDERS)

/** version.json with its "{palette...}" placeholders filled in for one palette. */
export function resolve(spec, paletteName) {
  const p = getPalette(PALETTES, paletteName)
  const fill = (v) => {
    if (typeof v !== "string") return v
    if (v === "{palette}") return p.key
    const m = /^\{palette:(\w+)\}$/.exec(v)
    if (m) { if (!BUILDERS[m[1]]) throw new Error(`unknown builder ${m[1]}`); return BUILDERS[m[1]](p) }
    return v
  }
  const options = Object.fromEntries(Object.entries(spec.options ?? {}).map(([plugin, o]) => [plugin, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fill(v)]))]))
  const env = Object.fromEntries(Object.entries(spec.env ?? {}).map(([k, v]) => [k, String(fill(v))]))
  // "files": [{ "from": <path relative to the version folder>, "to": "~/<path under the home folder>" }]
  const files = (spec.files ?? []).map((f) => ({ from: path.resolve(spec.dir ?? ".", f.from), to: path.join(home(), String(f.to).replace(/^~[\\/]/, "")) }))
  return { tag: spec.tag, label: spec.label, palette: p, plugins: { ...(spec.plugins ?? {}) }, first: [...(spec.first ?? [])], options, env, files }
}

/** settings.json text with the version merged in. Pure, so it can be tested on any input. */
export function merged(text, version) {
  const s = JSON.parse(text)
  s.enabledPlugins = { ...(s.enabledPlugins ?? {}), ...version.plugins }
  // Claude Code loads user mods in the key order of enabledPlugins, and the first one loaded is the outermost: it
  // sees each event first and can answer it without passing it on (measured with --debug, 2.1.301). "first" lists
  // the plugins that must sit in front, e.g. Calm, which has to hide a tool row before skins draws it.
  const first = (version.first ?? []).filter((k) => k in s.enabledPlugins)
  if (first.length) s.enabledPlugins = Object.fromEntries([...first.map((k) => [k, s.enabledPlugins[k]]), ...Object.entries(s.enabledPlugins).filter(([k]) => !first.includes(k))])
  s.pluginConfigs ??= {}
  for (const [plugin, o] of Object.entries(version.options)) {
    s.pluginConfigs[plugin] = { ...(s.pluginConfigs[plugin] ?? {}), options: { ...(s.pluginConfigs[plugin]?.options ?? {}), ...o } }
  }
  if (Object.keys(version.env ?? {}).length) s.env = { ...(s.env ?? {}), ...version.env }
  return JSON.stringify(s, null, 2) + "\n"
}

const sha = (text) => crypto.createHash("sha256").update(text).digest("hex")
const touched = (version) => ({ plugins: Object.keys(version.plugins), options: Object.fromEntries(Object.entries(version.options).map(([k, o]) => [k, Object.keys(o)])), env: Object.keys(version.env ?? {}) })

/** Copy each version file over its target, saving the target first. A target that does not exist (that part of the v2 rice is not applied) is skipped. */
function copyFiles(version, backup, log) {
  const done = []
  for (const [i, f] of version.files.entries()) {
    if (!fs.existsSync(f.to)) { log(`  skipped ${f.to}: not there (apply the v2 rice first)`); continue }
    if (fs.readFileSync(f.to).equals(fs.readFileSync(f.from))) continue
    const saved = path.join(backup, "files", `${i}-${path.basename(f.to)}`)
    fs.mkdirSync(path.dirname(saved), { recursive: true })
    fs.copyFileSync(f.to, saved)
    fs.copyFileSync(f.from, f.to)
    done.push({ to: f.to, saved })
  }
  return done
}

const readState = () => (fs.existsSync(stateFile()) ? JSON.parse(fs.readFileSync(stateFile(), "utf8")) : { history: [] })

export function apply(spec, paletteName, { dryRun = false, log = console.log } = {}) {
  const version = resolve(spec, paletteName)
  const file = settingsFile()
  const before = fs.readFileSync(file, "utf8")
  const after = merged(before, version)
  const changes = []
  const was = JSON.parse(before)
  for (const [k, v] of Object.entries(version.plugins)) if (was.enabledPlugins?.[k] !== v) changes.push(`${k}: ${v ? "on" : "off"}`)
  const order = (t) => Object.keys(JSON.parse(t).enabledPlugins ?? {}).join(",")
  if (version.first.length && order(before) !== order(after)) changes.push(`load first: ${version.first.join(", ")}`)
  for (const [plugin, o] of Object.entries(version.options))
    for (const [k, v] of Object.entries(o)) if (JSON.stringify(was.pluginConfigs?.[plugin]?.options?.[k]) !== JSON.stringify(v)) changes.push(`${plugin} ${k} = ${typeof v === "string" && v.length > 40 ? v.slice(0, 37) + "..." : JSON.stringify(v)}`)
  for (const [k, v] of Object.entries(version.env)) if (was.env?.[k] !== v) changes.push(`env ${k} = ${v}`)
  const stale = version.files.filter((f) => fs.existsSync(f.to) && !fs.readFileSync(f.to).equals(fs.readFileSync(f.from)))
  for (const f of stale) changes.push(`update ${f.to}`)
  if (dryRun) { log(`${version.tag} (${version.palette.key}) would change:\n  ${changes.join("\n  ") || "nothing"}`); return { changes, dryRun: true } }
  if (before === after && !stale.length) { log(`${version.tag} (${version.palette.key}) is already applied; nothing to do`); return { changes: [] } }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backup = path.join(riceDir(), "backups", `${stamp}-${version.tag}`)
  fs.mkdirSync(backup, { recursive: true })
  fs.writeFileSync(path.join(backup, "settings.json"), before)
  fs.writeFileSync(file, after)
  const files = copyFiles(version, backup, log)
  const state = readState()
  state.history.push({ tag: version.tag, palette: version.palette.key, at: new Date().toISOString(), backup, wrote: sha(after), touched: touched(version), files })
  fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2) + "\n")
  log(`applied ${version.tag} (${version.palette.key}); backup in ${backup}\n  ${changes.join("\n  ")}\nRestart Claude Code to load the mods.`)
  return { changes, backup }
}

export function revert({ log = console.log } = {}) {
  const state = readState()
  const last = state.history.pop()
  if (!last) { log("nothing to revert"); return null }
  const saved = fs.readFileSync(path.join(last.backup, "settings.json"), "utf8")
  const now = fs.readFileSync(settingsFile(), "utf8")
  let how
  if (sha(now) === last.wrote) { fs.writeFileSync(settingsFile(), saved); how = "byte for byte" }
  else {
    // settings.json changed after the apply (a /config change, another tool): undo only the keys this version set
    const s = JSON.parse(now), b = JSON.parse(saved)
    const put = (obj, key, value) => { if (value === undefined) delete obj[key]; else obj[key] = value }
    for (const k of last.touched.plugins) put((s.enabledPlugins ??= {}), k, b.enabledPlugins?.[k])
    for (const [plugin, keys] of Object.entries(last.touched.options)) {
      const opts = { ...((s.pluginConfigs ??= {})[plugin]?.options ?? {}) }
      for (const k of keys) put(opts, k, b.pluginConfigs?.[plugin]?.options?.[k])
      if (Object.keys(opts).length) s.pluginConfigs[plugin] = { ...(s.pluginConfigs[plugin] ?? {}), options: opts }
      else if (s.pluginConfigs[plugin]) { delete s.pluginConfigs[plugin].options; if (!Object.keys(s.pluginConfigs[plugin]).length) delete s.pluginConfigs[plugin] }
    }
    for (const k of last.touched.env ?? []) put((s.env ??= {}), k, b.env?.[k])
    if (s.env && !Object.keys(s.env).length && !b.env) delete s.env
    fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2) + "\n")
    how = "only the keys it set (settings.json had other changes since; those stay)"
  }
  for (const f of last.files ?? []) fs.copyFileSync(f.saved, f.to)
  fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2) + "\n")
  log(`reverted ${last.tag} (${last.palette}), ${how}. Backup: ${last.backup}. Restart Claude Code.`)
  return { ...last, how }
}

export function status({ log = console.log } = {}) {
  const state = readState()
  const top = state.history.at(-1)
  log(top ? `applied: ${top.tag} (${top.palette}) at ${top.at}; ${state.history.length} step(s) to revert` : "no community-mod version applied (plain v2 rice)")
  return top ?? null
}

/** A --settings file for ONE preview process: the version, the palette's theme and status line, and the Bridge with demo data. */
export function preview(spec, paletteName, { log = console.log } = {}) {
  const version = resolve(spec, paletteName)
  const p = version.palette
  const dir = path.join(riceDir(), "preview", version.tag)
  fs.mkdirSync(dir, { recursive: true })
  const themeFile = path.join(home(), ".claude", "themes", `${p.key}.json`)
  const created = path.join(dir, "created-themes.json")
  const made = fs.existsSync(created) ? JSON.parse(fs.readFileSync(created, "utf8")) : []
  if (!fs.existsSync(themeFile)) { made.push(themeFile); fs.writeFileSync(created, JSON.stringify(made)) }
  fs.mkdirSync(path.dirname(themeFile), { recursive: true })
  fs.writeFileSync(themeFile, JSON.stringify(claudeTheme(p), null, 2) + "\n")
  const palFile = path.join(dir, `statusline-${p.key}.json`)
  fs.writeFileSync(palFile, JSON.stringify(statusPalette(p), null, 2))
  const shim = path.join(dir, `deck-${p.key}.cmd`)
  fs.writeFileSync(shim, `@echo off\r\nset "AURORA_DECK_PALETTE=${palFile}"\r\n"${process.execPath}" "${path.join(V2, "statusline", "aurora-deck.mjs")}"\r\n`)
  const bridge = "aurora-bridge@kasasree-mods"
  const settings = {
    theme: `custom:${p.key}`,
    ...(Object.keys(version.env).length ? { env: version.env } : {}),
    statusLine: { type: "command", command: `exec "${shim.replace(/\\/g, "/")}"`, refreshInterval: 60 },
    enabledPlugins: { "flightdeck@kasasree-mods": false, [bridge]: true, ...version.plugins },
    pluginConfigs: {
      [bridge]: { options: { openOnStart: true, demo: "on", palette: JSON.stringify(bridgePalette(p)) } },
      ...Object.fromEntries(Object.entries(version.options).map(([k, o]) => [k, { options: { ...(k === bridge ? { openOnStart: true, demo: "on" } : {}), ...o } }])),
    },
  }
  const out = path.join(dir, `settings.${p.key}.json`)
  fs.writeFileSync(out, JSON.stringify(settings, null, 2))
  log(out)
  return out
}

/** Remove the theme files a preview created (the ones that did not exist before it). */
export function previewClean(spec) {
  const created = path.join(riceDir(), "preview", spec.tag, "created-themes.json")
  if (!fs.existsSync(created)) return []
  const made = JSON.parse(fs.readFileSync(created, "utf8"))
  for (const f of made) fs.rmSync(f, { force: true })
  fs.rmSync(created, { force: true })
  return made
}

/** For a preview only: put the version's "first" plugins in front of the live enabledPlugins, or put the file back. */
export function previewOrder(spec, mode, { log = console.log } = {}) {
  const saved = path.join(riceDir(), "preview", spec.tag, "settings.order-backup.json")
  if (mode === "off") {
    if (!fs.existsSync(saved)) { log("nothing to put back"); return false }
    fs.copyFileSync(saved, settingsFile()); fs.rmSync(saved); log("settings.json is back, byte for byte"); return true
  }
  const before = fs.readFileSync(settingsFile(), "utf8")
  const s = JSON.parse(before)
  const first = (spec.first ?? []).filter((k) => k in (s.enabledPlugins ?? {}))
  if (!first.length) { log("nothing to reorder"); return false }
  fs.mkdirSync(path.dirname(saved), { recursive: true })
  if (!fs.existsSync(saved)) fs.writeFileSync(saved, before)
  s.enabledPlugins = Object.fromEntries([...first.map((k) => [k, s.enabledPlugins[k]]), ...Object.entries(s.enabledPlugins).filter(([k]) => !first.includes(k))])
  fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2) + "\n")
  log(`load order now starts with ${first.join(", ")}; run preview-order off when done`)
  return true
}

/** The CLI every version's tools/rice.mjs hands its argv to. */
export function cli(dir, argv) {
  const spec = loadSpec(dir)
  const [cmd, ...rest] = argv
  const palette = rest.find((a) => !a.startsWith("--"))
  if (cmd === "apply") apply(spec, palette, { dryRun: rest.includes("--dry-run") })
  else if (cmd === "revert") revert()
  else if (cmd === "status") status()
  else if (cmd === "preview") preview(spec, palette)
  else if (cmd === "preview-order") previewOrder(spec, rest[0] === "off" ? "off" : "on")
  else if (cmd === "preview-clean") console.log(`removed: ${previewClean(spec).join(", ") || "nothing"}`)
  else { console.log(`usage: node tools/rice.mjs <apply [palette] [--dry-run] | revert | status | preview <palette> | preview-order on|off | preview-clean>`); process.exitCode = cmd ? 1 : 0 }
}
