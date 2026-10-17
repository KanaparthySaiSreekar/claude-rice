// kit.mjs: switch the live Claude Code setup to a "community mod" version (v3 to v6) and back, and stage a preview of it.
// Every one of those versions sits on top of the v2 rice (palette, theme, status line, Bridge pane) and changes only which
// mods run and how they are configured. Each version folder holds a version.json:
//
//   { "tag": "v3", "label": "...", "plugins": { "<name>@kasasree-mods": true | false },
//     "options": { "<name>@kasasree-mods": { "<option>": <value> } } }
//
// A string value "{palette}" becomes the palette name, "{palette:<builder>}" the JSON a v2 builder makes for it.
//
//   node tools/rice.mjs apply [palette] [--dry-run]   back up ~/.claude/settings.json, then merge the version into it
//   node tools/rice.mjs revert                        undo the newest apply: byte for byte if settings.json is untouched since,
//                                                     otherwise only the keys that apply set (later changes of yours stay)
//   node tools/rice.mjs status
//   node tools/rice.mjs preview <palette>             write a --settings file for a throwaway preview process (live setup untouched)
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
  return spec
}

const BUILDERS = { bridge: (p) => JSON.stringify(bridgePalette(p)) }

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
  return { tag: spec.tag, label: spec.label, palette: p, plugins: { ...(spec.plugins ?? {}) }, options }
}

/** settings.json text with the version merged in. Pure, so it can be tested on any input. */
export function merged(text, version) {
  const s = JSON.parse(text)
  s.enabledPlugins = { ...(s.enabledPlugins ?? {}), ...version.plugins }
  s.pluginConfigs ??= {}
  for (const [plugin, o] of Object.entries(version.options)) {
    s.pluginConfigs[plugin] = { ...(s.pluginConfigs[plugin] ?? {}), options: { ...(s.pluginConfigs[plugin]?.options ?? {}), ...o } }
  }
  return JSON.stringify(s, null, 2) + "\n"
}

const sha = (text) => crypto.createHash("sha256").update(text).digest("hex")
const touched = (version) => ({ plugins: Object.keys(version.plugins), options: Object.fromEntries(Object.entries(version.options).map(([k, o]) => [k, Object.keys(o)])) })

const readState = () => (fs.existsSync(stateFile()) ? JSON.parse(fs.readFileSync(stateFile(), "utf8")) : { history: [] })

export function apply(spec, paletteName, { dryRun = false, log = console.log } = {}) {
  const version = resolve(spec, paletteName)
  const file = settingsFile()
  const before = fs.readFileSync(file, "utf8")
  const after = merged(before, version)
  const changes = []
  const was = JSON.parse(before)
  for (const [k, v] of Object.entries(version.plugins)) if (was.enabledPlugins?.[k] !== v) changes.push(`${k}: ${v ? "on" : "off"}`)
  for (const [plugin, o] of Object.entries(version.options))
    for (const [k, v] of Object.entries(o)) if (JSON.stringify(was.pluginConfigs?.[plugin]?.options?.[k]) !== JSON.stringify(v)) changes.push(`${plugin} ${k} = ${typeof v === "string" && v.length > 40 ? v.slice(0, 37) + "..." : JSON.stringify(v)}`)
  if (dryRun) { log(`${version.tag} (${version.palette.key}) would change:\n  ${changes.join("\n  ") || "nothing"}`); return { changes, dryRun: true } }
  if (before === after) { log(`${version.tag} (${version.palette.key}) is already applied; nothing to do`); return { changes: [] } }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backup = path.join(riceDir(), "backups", `${stamp}-${version.tag}`)
  fs.mkdirSync(backup, { recursive: true })
  fs.writeFileSync(path.join(backup, "settings.json"), before)
  fs.writeFileSync(file, after)
  const state = readState()
  state.history.push({ tag: version.tag, palette: version.palette.key, at: new Date().toISOString(), backup, wrote: sha(after), touched: touched(version) })
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
    fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2) + "\n")
    how = "only the keys it set (settings.json had other changes since; those stay)"
  }
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

/** The CLI every version's tools/rice.mjs hands its argv to. */
export function cli(dir, argv) {
  const spec = loadSpec(dir)
  const [cmd, ...rest] = argv
  const palette = rest.find((a) => !a.startsWith("--"))
  if (cmd === "apply") apply(spec, palette, { dryRun: rest.includes("--dry-run") })
  else if (cmd === "revert") revert()
  else if (cmd === "status") status()
  else if (cmd === "preview") preview(spec, palette)
  else if (cmd === "preview-clean") console.log(`removed: ${previewClean(spec).join(", ") || "nothing"}`)
  else { console.log(`usage: node tools/rice.mjs <apply [palette] [--dry-run] | revert | status | preview <palette> | preview-clean>`); process.exitCode = cmd ? 1 : 0 }
}
