// apply.mjs: put a built palette into the live config, with a backup of every file it touches, and take it out again.
//   node tools/rice.mjs apply  [palette] [--dry-run]
//   node tools/rice.mjs revert [backup-folder]          (default: the newest backup)
//   node tools/rice.mjs status
//
// Everything is a MERGE into your existing files (keys the rice does not own are left alone), and every
// file is copied to ~/.rice/backups/<timestamp>/ first. Set RICE_SANDBOX=<dir> to run the whole thing against
// a throwaway copy of the layout (that is how the tests run it).
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { stripJsonc } from "./lib/wt.mjs"
import { claudeTheme, skin as buildSkin, wtScheme, wtTheme, wtProfileDefaults, rioConfig, powershellProfile, statusPalette, bridgePalette } from "./build.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))

export function locations(sandbox = process.env.RICE_SANDBOX) {
  const home = sandbox ? path.join(sandbox, "home") : os.homedir()
  const local = sandbox ? path.join(sandbox, "localappdata") : (process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local"))
  return {
    home, local,
    rice: sandbox ? path.join(home, ".rice") : (process.env.RICE_DIR ?? path.join(home, ".rice")),
    claudeSettings: path.join(home, ".claude", "settings.json"),
    claudeThemes: path.join(home, ".claude", "themes"),
    skinsStore: path.join(home, ".claude", "plugins", "store", "skins_kasasree-mods-2f16574f50f4.json"),
    wtSettings: path.join(local, "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json"),
    psProfile: path.join(home, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1"),
    rioConfig: path.join(local, "rio", "config.toml"),
  }
}

const readJson = (f) => JSON.parse(stripJsonc(fs.readFileSync(f, "utf8")))
const writeJson = (f, o, indent = 2) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, indent) + "\n") }
const exists = (f) => fs.existsSync(f)
const PREVIEW_GUID = "{7b1c9f10-0a15-4c0e-9e2b-0c1a55e5a001}"
export const FLIGHTDECK = "flightdeck@kasasree-mods"
export const HUD = "claude-hud@kasasree-mods"
export const BRIDGE = "aurora-bridge@kasasree-mods"
export const PANELS = "architect,gate,agents,loops,receipt,log"

// ---------------------------------------------------------------------------------------------
// pure merges (tested on their own)
// ---------------------------------------------------------------------------------------------
export function mergeClaudeSettings(s, p, { shim }) {
  const out = structuredClone(s)
  out.theme = `custom:${p.key}`
  out.statusLine = { type: "command", command: `exec "${shim.replace(/\\/g, "/")}"`, refreshInterval: 60 }
  out.pluginConfigs = { ...(out.pluginConfigs ?? {}) }
  const enabled = { ...(out.enabledPlugins ?? {}) }
  if (HUD in enabled) enabled[HUD] = false   // the new status line replaces claude-hud
  if (BRIDGE in enabled) {
    // the right-hand pane is our own Bridge, drawn in the palette; flightdeck stays installed but off
    enabled[BRIDGE] = true
    if (FLIGHTDECK in enabled) enabled[FLIGHTDECK] = false
    out.pluginConfigs[BRIDGE] = { ...(out.pluginConfigs[BRIDGE] ?? {}), options: { ...(out.pluginConfigs[BRIDGE]?.options ?? {}), openOnStart: true, palette: JSON.stringify(bridgePalette(p)) } }
  } else {
    // Bridge not installed: keep flightdeck, recoloured through the theme
    out.pluginConfigs[FLIGHTDECK] = { ...(out.pluginConfigs[FLIGHTDECK] ?? {}), options: { ...(out.pluginConfigs[FLIGHTDECK]?.options ?? {}), openOnStart: true, statusLine: false, panels: PANELS } }
  }
  if (out.enabledPlugins || Object.keys(enabled).length) out.enabledPlugins = enabled
  return out
}

export function mergeWtSettings(s, p, assets) {
  const out = structuredClone(s)
  out.schemes = (out.schemes ?? []).filter((x) => x.name !== p.label).concat(wtScheme(p))
  out.themes = (out.themes ?? []).filter((x) => x.name !== p.label).concat(wtTheme(p))
  out.theme = p.label
  const defaults = { ...(out.profiles?.defaults ?? {}), ...wtProfileDefaults(p, assets) }
  // switching from a palette that had art to one that has none must take the picture away again
  if (!p.art) for (const k of ["backgroundImage", "backgroundImageOpacity", "backgroundImageStretchMode", "backgroundImageAlignment"]) delete defaults[k]
  // and a palette without the glow takes an earlier apply's shader away
  if (p.glow !== true) delete defaults["experimental.pixelShaderPath"]
  out.profiles = { ...out.profiles, defaults }
  out.profiles.list = (out.profiles.list ?? []).filter((x) => x.guid !== PREVIEW_GUID)
  return out
}

export function mergeSkinsStore(store, p) {
  const out = structuredClone(store)
  const s = buildSkin(p)
  out.custom = { ...(out.custom ?? {}), [s.name]: { name: s.name, label: p.label, base: "tokyo-night", palette: s.palette, spinner: s.spinner, done: s.done } }
  out.prefs = { ...(out.prefs ?? {}), skin: s.name, ...s.settings }
  return out
}

// ---------------------------------------------------------------------------------------------
// backup / restore
// ---------------------------------------------------------------------------------------------
function backupAll(L, files) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const dir = path.join(L.rice, "backups", stamp)
  const entries = files.map((f) => {
    const rel = path.relative(L.home, f).startsWith("..") ? path.join("_outside_home", path.basename(f)) : path.relative(L.home, f)
    if (exists(f)) { const dest = path.join(dir, "files", rel); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(f, dest); return { target: f, backup: dest, existed: true } }
    return { target: f, backup: null, existed: false }
  })
  fs.mkdirSync(dir, { recursive: true })
  writeJson(path.join(dir, "manifest.json"), { createdAt: new Date().toISOString(), entries })
  return dir
}

export function revert(L, folder) {
  const root = path.join(L.rice, "backups")
  const dir = folder ?? (fs.existsSync(root) ? fs.readdirSync(root).filter((d) => exists(path.join(root, d, "manifest.json"))).sort().pop() : null)
  if (!dir) throw new Error("no backup to revert to")
  const full = path.isAbsolute(dir) ? dir : path.join(root, dir)
  const { entries } = JSON.parse(fs.readFileSync(path.join(full, "manifest.json"), "utf8"))
  const log = []
  for (const e of entries) {
    if (e.existed) { fs.mkdirSync(path.dirname(e.target), { recursive: true }); fs.copyFileSync(e.backup, e.target); log.push(`restored ${e.target}`) }
    else if (exists(e.target)) { fs.rmSync(e.target, { force: true }); log.push(`removed ${e.target} (did not exist before)`) }
  }
  fs.rmSync(path.join(L.rice, "current"), { recursive: true, force: true })
  fs.rmSync(path.join(L.rice, "state.json"), { force: true })
  return { dir: full, log }
}

// ---------------------------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------------------------
export function apply(p, L, { buildDir, nodePath = process.execPath, dryRun = false, skipTerminal = false }) {
  const current = path.join(L.rice, "current")
  const shim = path.join(current, "statusline", "aurora-deck.cmd")
  const themeFile = path.join(L.claudeThemes, `${p.key}.json`)
  const targets = [L.claudeSettings, themeFile, L.skinsStore, L.wtSettings, L.psProfile, L.rioConfig].filter((f) => !(skipTerminal && [L.wtSettings, L.psProfile, L.rioConfig].includes(f)))
  const plan = targets.map((f) => `${exists(f) ? "update" : "create"} ${f}`)
  if (dryRun) return { plan, backup: null }

  const backup = backupAll(L, targets)
  // 1. runtime assets: the status line script and palette, the art and the shader
  fs.rmSync(current, { recursive: true, force: true })
  fs.cpSync(buildDir, current, { recursive: true })
  const deckDir = path.join(current, "statusline"); fs.mkdirSync(deckDir, { recursive: true })
  fs.copyFileSync(path.join(HERE, "..", "statusline", "aurora-deck.mjs"), path.join(deckDir, "aurora-deck.mjs"))
  fs.writeFileSync(shim, `@echo off\r\n"${nodePath}" "%~dp0aurora-deck.mjs"\r\n`)
  // 2. Claude Code
  fs.mkdirSync(L.claudeThemes, { recursive: true })
  writeJson(themeFile, claudeTheme(p))
  writeJson(L.claudeSettings, mergeClaudeSettings(exists(L.claudeSettings) ? readJson(L.claudeSettings) : {}, p, { shim }))
  if (exists(L.skinsStore)) fs.writeFileSync(L.skinsStore, JSON.stringify(mergeSkinsStore(readJson(L.skinsStore), p)))
  // 3. the terminal side
  if (!skipTerminal) {
    if (exists(L.wtSettings)) writeJson(L.wtSettings, mergeWtSettings(readJson(L.wtSettings), p, current), 4)
    fs.mkdirSync(path.dirname(L.psProfile), { recursive: true }); fs.writeFileSync(L.psProfile, powershellProfile(p))
    fs.mkdirSync(path.dirname(L.rioConfig), { recursive: true }); fs.writeFileSync(L.rioConfig, rioConfig(p, path.join(L.local, "Microsoft", "WindowsApps", "pwsh.exe")))
  }
  writeJson(path.join(L.rice, "state.json"), { applied: p.key, label: p.label, at: new Date().toISOString(), backup })
  return { plan, backup }
}

export function status(L) {
  const f = path.join(L.rice, "state.json")
  return exists(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null
}
