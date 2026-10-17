// snapshot.mjs: save the whole live rice under a name, and put it back exactly. Used to keep a version safe while
// another one is tried ("keep v2 safe and switch to v3 completely").
//
//   node tools/snapshot.mjs save <name> [--settings-from <file>]   copy every live rice file into ~/.rice/saved/<name>/
//   node tools/snapshot.mjs restore <name>                          copy them all back; files the snapshot did not have are left alone
//   node tools/snapshot.mjs list
//
// --settings-from takes Claude Code's settings.json from another file (a backup taken just before a later apply), so a
// version can be saved after the next one has already touched settings.json.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import crypto from "node:crypto"

const home = process.env.RICE_HOME ?? os.homedir()
const local = process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local")
const savedRoot = path.join(home, ".rice", "saved")

/** Every file and folder that makes up the rice on this machine. Folders are copied whole. */
export function targets() {
  const store = path.join(home, ".claude", "plugins", "store")
  const stores = fs.existsSync(store) ? fs.readdirSync(store).filter((f) => f.endsWith(".json")).map((f) => path.join(store, f)) : []
  return [
    path.join(home, ".claude", "settings.json"),
    path.join(home, ".claude", "themes"),
    path.join(home, ".claude", "hooks"),
    ...stores,                                                    // mod stores: skins' skin and settings live here
    path.join(local, "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json"),
    path.join(home, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1"),
    path.join(local, "rio", "config.toml"),
    path.join(home, ".rice", "current"),
    path.join(home, ".rice", "state.json"),
    path.join(home, ".rice", "versions.json"),
  ]
}

const rel = (p) => path.relative(home, p)
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")
const filesUnder = (p) => (fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((n) => filesUnder(path.join(p, n))) : [p])

export function save(name, { settingsFrom } = {}) {
  const dir = path.join(savedRoot, name)
  if (fs.existsSync(dir)) throw new Error(`a snapshot called "${name}" already exists: ${dir}`)
  const manifest = { name, at: new Date().toISOString(), files: [] }
  for (const t of targets()) {
    if (!fs.existsSync(t)) continue
    for (const f of filesUnder(t)) {
      const src = settingsFrom && f === targets()[0] ? settingsFrom : f
      const dest = path.join(dir, "files", rel(f))
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
      manifest.files.push({ path: rel(f), sha256: sha(dest) })
    }
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
  return manifest
}

export function restore(name) {
  const dir = path.join(savedRoot, name)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"))
  for (const f of manifest.files) {
    const from = path.join(dir, "files", f.path)
    if (sha(from) !== f.sha256) throw new Error(`the saved copy of ${f.path} changed since it was saved; nothing restored`)
  }
  for (const f of manifest.files) {
    const to = path.join(home, f.path)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(path.join(dir, "files", f.path), to)
  }
  return manifest
}

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const [cmd, name, ...rest] = process.argv.slice(2)
  const i = rest.indexOf("--settings-from")
  if (cmd === "save" && name) { const m = save(name, { settingsFrom: i >= 0 ? rest[i + 1] : undefined }); console.log(`saved "${name}": ${m.files.length} files in ${path.join(savedRoot, name)}`) }
  else if (cmd === "restore" && name) { const m = restore(name); console.log(`restored "${name}" (${m.files.length} files, saved ${m.at}). Restart Claude Code and open a new Windows Terminal window.`) }
  else if (cmd === "list") console.log(fs.existsSync(savedRoot) ? fs.readdirSync(savedRoot).join("\n") || "(none)" : "(none)")
  else { console.log("usage: node tools/snapshot.mjs <save <name> [--settings-from <file>] | restore <name> | list>"); process.exitCode = cmd ? 1 : 0 }
}
