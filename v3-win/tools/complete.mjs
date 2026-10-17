// complete.mjs: switch the whole setup to v3 on its own (complete.json), or back to what was there before.
//
//   node tools/complete.mjs apply [--dry-run]   save the current setup as a snapshot, then write v3-complete
//   node tools/complete.mjs revert              put back the snapshot apply took (byte for byte)
//
// To go back to v2 itself at any time: node tools/snapshot.mjs restore v2.2-ember
// The Claude Code theme, the Windows Terminal scheme and window theme, the PowerShell profile and the Rio config are
// written by the v2 builders from palette/gruvbox.json: the same code, Gruvbox's colours.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { save, restore } from "./snapshot.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "..")
const V2 = path.resolve(root, "..", "v2-win")
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
  marker: path.join(home, ".rice", "v3-complete.json"),
}

export function loadComplete() {
  const spec = JSON.parse(fs.readFileSync(path.join(root, "complete.json"), "utf8"))
  const raw = JSON.parse(fs.readFileSync(path.join(root, spec.palette), "utf8"))
  return { spec, p: derive(raw.key, raw) }
}

/** settings.json as v3-complete wants it. Pure. */
export function claudeSettings(s, spec) {
  const out = structuredClone(s)
  const c = spec.claude
  out.theme = c.theme
  for (const k of c.remove) delete out[k]
  if (out.hooks) {
    for (const [event, groups] of Object.entries(out.hooks)) {
      const kept = groups.map((g) => ({ ...g, hooks: (g.hooks ?? []).filter((h) => !String(h.command ?? "").includes(c.removeHookScript)) })).filter((g) => g.hooks.length)
      if (kept.length) out.hooks[event] = kept; else delete out.hooks[event]
    }
    if (!Object.keys(out.hooks).length) delete out.hooks
  }
  if (out.env) { for (const k of c.removeEnv) delete out.env[k]; if (!Object.keys(out.env).length) delete out.env }
  out.enabledPlugins = { ...(out.enabledPlugins ?? {}) }
  for (const [k, v] of Object.entries(c.plugins)) if (k in out.enabledPlugins || v) out.enabledPlugins[k] = v
  out.pluginConfigs ??= {}
  for (const [k, o] of Object.entries(c.options)) out.pluginConfigs[k] = { ...(out.pluginConfigs[k] ?? {}), options: { ...(out.pluginConfigs[k]?.options ?? {}), ...o } }
  return out
}

/** Windows Terminal settings with the Gruvbox scheme and window theme selected and v2's extras taken out. Pure. */
export function terminalSettings(s, spec, p) {
  const out = structuredClone(s)
  out.schemes = (out.schemes ?? []).filter((x) => x.name !== p.label).concat(wtScheme(p))
  out.themes = (out.themes ?? []).filter((x) => x.name !== p.label).concat(wtTheme(p))
  out.theme = p.label
  const defaults = { ...(out.profiles?.defaults ?? {}), colorScheme: p.label }
  for (const k of spec.terminal.removeDefaults) delete defaults[k]
  out.profiles = { ...out.profiles, defaults }
  return out
}

function apply({ dryRun = false } = {}) {
  const { spec, p } = loadComplete()
  const plan = [`${F.settings}: theme ${spec.claude.theme}; remove ${spec.claude.remove.join(", ")}, the ${spec.claude.removeHookScript} hook; only prismantis on (${spec.claude.options["prismantis@kasasree-mods"].theme})`,
    `${path.join(F.themes, "gruvbox.json")}: Claude Code theme`, `${F.wt}: scheme and window theme "${p.label}", no shader, tab colour, padding or cursor shape`, `${F.ps}: Gruvbox colours`, `${F.rio}: Gruvbox colours`]
  if (dryRun) { console.log("v3-complete would write:\n  " + plan.join("\n  ")); return }
  const name = `before-v3-complete-${new Date().toISOString().replace(/[:.]/g, "-")}`
  save(name)
  const s = JSON.parse(fs.readFileSync(F.settings, "utf8"))
  fs.mkdirSync(F.themes, { recursive: true })
  fs.writeFileSync(path.join(F.themes, "gruvbox.json"), JSON.stringify(claudeTheme(p), null, 2) + "\n")
  fs.writeFileSync(F.settings, JSON.stringify(claudeSettings(s, spec), null, 2) + "\n")
  if (fs.existsSync(F.wt)) fs.writeFileSync(F.wt, JSON.stringify(terminalSettings(JSON.parse(stripJsonc(fs.readFileSync(F.wt, "utf8"))), spec, p), null, 4) + "\n")
  fs.mkdirSync(path.dirname(F.ps), { recursive: true }); fs.writeFileSync(F.ps, powershellProfile(p))
  fs.mkdirSync(path.dirname(F.rio), { recursive: true }); fs.writeFileSync(F.rio, rioConfig(p, path.join(local, "Microsoft", "WindowsApps", "pwsh.exe")))
  fs.writeFileSync(F.state, JSON.stringify({ applied: "v3-complete", label: "v3: prismantis, Gruvbox Dark", at: new Date().toISOString(), snapshot: name }, null, 2) + "\n")
  fs.writeFileSync(F.versions, JSON.stringify({ history: [] }, null, 2) + "\n")
  fs.writeFileSync(F.marker, JSON.stringify({ snapshot: name }, null, 2) + "\n")
  console.log(`v3-complete applied; what was there before is saved as "${name}".\n  ${plan.join("\n  ")}\nRestart Claude Code and open a NEW Windows Terminal window (the profile and scheme apply to new windows).`)
}

function revert() {
  if (!fs.existsSync(F.marker)) { console.log("v3-complete is not applied"); return }
  const { snapshot } = JSON.parse(fs.readFileSync(F.marker, "utf8"))
  restore(snapshot)
  fs.rmSync(F.marker)
  console.log(`restored "${snapshot}". Restart Claude Code and open a new Windows Terminal window.`)
}

if (import.meta.url === url(process.argv[1] ?? "")) {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === "apply") apply({ dryRun: rest.includes("--dry-run") })
  else if (cmd === "revert") revert()
  else { console.log("usage: node tools/complete.mjs <apply [--dry-run] | revert>"); process.exitCode = cmd ? 1 : 0 }
}
