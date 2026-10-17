// complete.mjs: switch the whole setup to one version on its own (its complete.json), or back to what was there before.
//
//   node v3-win/tools/complete.mjs apply  [--dir <version folder>] [--dry-run]   save the current setup, then switch
//   node v3-win/tools/complete.mjs revert [--dir <version folder>]               put back the snapshot that apply took
//
// --dir defaults to v3-win. Each version folder holds a complete.json:
//   tag, label, palette (for the PowerShell and Rio colours, and the Claude Code theme when it is custom:<name>),
//   claude: { theme ("dark" for the built-in, "custom:<name>" to write one from the palette), remove, removeHookScript,
//             removeEnv, plugins, options }
//   terminal: { scheme ("palette" to write one from the palette, or a Windows Terminal built-in such as "Campbell"),
//               windowTheme (with a built-in scheme; default "dark"), removeDefaults }
// To go back to a saved version at any time: node v3-win/tools/snapshot.mjs restore <name>
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { save, restore } from "./snapshot.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, "..", "..")
const V2 = path.join(repo, "v2-win")
const url = (p) => "file:///" + p.replace(/\\/g, "/")
const { derive } = await import(url(path.join(V2, "tools", "lib", "palette.mjs")))
const { claudeTheme, wtScheme, wtTheme, powershellProfile, rioConfig } = await import(url(path.join(V2, "tools", "build.mjs")))
const { stripJsonc } = await import(url(path.join(V2, "tools", "lib", "wt.mjs")))

const home = process.env.RICE_HOME ?? os.homedir()
const local = process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local")
const F = {
  settings: path.join(home, ".claude", "settings.json"),
  themes: path.join(home, ".claude", "themes"),
  wt: path.join(local, "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json"),
  ps: path.join(home, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1"),
  rio: path.join(local, "rio", "config.toml"),
  state: path.join(home, ".rice", "state.json"),
  versions: path.join(home, ".rice", "versions.json"),
}
const marker = (tag) => path.join(home, ".rice", `${tag}-complete.json`)

export function loadComplete(dir = path.join(repo, "v3-win")) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "complete.json"), "utf8"))
  spec.tag ??= "v3"
  const raw = JSON.parse(fs.readFileSync(path.join(dir, spec.palette), "utf8"))
  return { spec, p: derive(raw.key, raw) }
}

/** settings.json as the version wants it. Pure. */
export function claudeSettings(s, spec) {
  const out = structuredClone(s)
  const c = spec.claude
  out.theme = c.theme
  for (const k of c.remove ?? []) delete out[k]
  if (out.hooks && c.removeHookScript) {
    for (const [event, groups] of Object.entries(out.hooks)) {
      const kept = groups.map((g) => ({ ...g, hooks: (g.hooks ?? []).filter((h) => !String(h.command ?? "").includes(c.removeHookScript)) })).filter((g) => g.hooks.length)
      if (kept.length) out.hooks[event] = kept; else delete out.hooks[event]
    }
    if (!Object.keys(out.hooks).length) delete out.hooks
  }
  if (out.env) { for (const k of c.removeEnv ?? []) delete out.env[k]; if (!Object.keys(out.env).length) delete out.env }
  out.enabledPlugins = { ...(out.enabledPlugins ?? {}) }
  for (const [k, v] of Object.entries(c.plugins ?? {})) if (k in out.enabledPlugins || v) out.enabledPlugins[k] = v
  out.pluginConfigs ??= {}
  for (const [k, o] of Object.entries(c.options ?? {})) out.pluginConfigs[k] = { ...(out.pluginConfigs[k] ?? {}), options: { ...(out.pluginConfigs[k]?.options ?? {}), ...o } }
  return out
}

/** Windows Terminal settings with the version's scheme and window theme selected and other versions' extras taken out. Pure. */
export function terminalSettings(s, spec, p) {
  const out = structuredClone(s)
  const t = spec.terminal
  let scheme
  if (t.scheme === "palette") {
    out.schemes = (out.schemes ?? []).filter((x) => x.name !== p.label).concat(wtScheme(p))
    out.themes = (out.themes ?? []).filter((x) => x.name !== p.label).concat(wtTheme(p))
    out.theme = p.label
    scheme = p.label
  } else {
    out.theme = t.windowTheme ?? "dark"
    scheme = t.scheme
  }
  const defaults = { ...(out.profiles?.defaults ?? {}), colorScheme: scheme }
  for (const k of t.removeDefaults ?? []) delete defaults[k]
  out.profiles = { ...out.profiles, defaults }
  return out
}

function apply(dir, { dryRun = false } = {}) {
  const { spec, p } = loadComplete(dir)
  const custom = spec.claude.theme.startsWith("custom:") ? spec.claude.theme.slice("custom:".length) : null
  const on = Object.entries(spec.claude.plugins).filter(([, v]) => v).map(([k]) => k.split("@")[0])
  const plan = [
    `${F.settings}: theme ${spec.claude.theme}; remove ${(spec.claude.remove ?? []).join(", ")}, the ${spec.claude.removeHookScript} hook; rice mods on: ${on.join(", ") || "none"}`,
    ...(custom ? [`${path.join(F.themes, custom + ".json")}: Claude Code theme from ${p.label}`] : []),
    `${F.wt}: scheme ${spec.terminal.scheme === "palette" ? `"${p.label}"` : `"${spec.terminal.scheme}" (built in)`}, no shader, tab colour, padding or cursor shape`,
    `${F.ps}: ${p.label} colours`, `${F.rio}: ${p.label} colours`]
  if (dryRun) { console.log(`${spec.tag}-complete would write:\n  ` + plan.join("\n  ")); return }
  const name = `before-${spec.tag}-complete-${new Date().toISOString().replace(/[:.]/g, "-")}`
  save(name)
  const s = JSON.parse(fs.readFileSync(F.settings, "utf8"))
  if (custom) { fs.mkdirSync(F.themes, { recursive: true }); fs.writeFileSync(path.join(F.themes, custom + ".json"), JSON.stringify(claudeTheme(p), null, 2) + "\n") }
  fs.writeFileSync(F.settings, JSON.stringify(claudeSettings(s, spec), null, 2) + "\n")
  if (fs.existsSync(F.wt)) fs.writeFileSync(F.wt, JSON.stringify(terminalSettings(JSON.parse(stripJsonc(fs.readFileSync(F.wt, "utf8"))), spec, p), null, 4) + "\n")
  fs.mkdirSync(path.dirname(F.ps), { recursive: true }); fs.writeFileSync(F.ps, powershellProfile(p))
  fs.mkdirSync(path.dirname(F.rio), { recursive: true }); fs.writeFileSync(F.rio, rioConfig(p, path.join(local, "Microsoft", "WindowsApps", "pwsh.exe")))
  fs.writeFileSync(F.state, JSON.stringify({ applied: `${spec.tag}-complete`, label: spec.label ?? spec.tag, at: new Date().toISOString(), snapshot: name }, null, 2) + "\n")
  fs.writeFileSync(F.versions, JSON.stringify({ history: [] }, null, 2) + "\n")
  for (const f of fs.readdirSync(path.join(home, ".rice")).filter((f) => /^v\d+-complete\.json$/.test(f))) fs.rmSync(path.join(home, ".rice", f))
  fs.writeFileSync(marker(spec.tag), JSON.stringify({ snapshot: name }, null, 2) + "\n")
  console.log(`${spec.tag}-complete applied; what was there before is saved as "${name}".\n  ${plan.join("\n  ")}\nRestart Claude Code and open a NEW Windows Terminal window (the profile and scheme apply to new windows).`)
}

function revert(dir) {
  const { spec } = loadComplete(dir)
  if (!fs.existsSync(marker(spec.tag))) { console.log(`${spec.tag}-complete is not applied`); return }
  const { snapshot } = JSON.parse(fs.readFileSync(marker(spec.tag), "utf8"))
  restore(snapshot)
  fs.rmSync(marker(spec.tag), { force: true })
  console.log(`restored "${snapshot}". Restart Claude Code and open a new Windows Terminal window.`)
}

export function cli(argv) {
  const [cmd, ...rest] = argv
  const i = rest.indexOf("--dir")
  const dir = i >= 0 ? path.resolve(rest[i + 1]) : path.join(repo, "v3-win")
  if (cmd === "apply") apply(dir, { dryRun: rest.includes("--dry-run") })
  else if (cmd === "revert") revert(dir)
  else { console.log("usage: node v3-win/tools/complete.mjs <apply [--dry-run] | revert> [--dir <version folder>]"); process.exitCode = cmd ? 1 : 0 }
}

if (process.argv[1] && import.meta.url === url(process.argv[1])) cli(process.argv.slice(2))
