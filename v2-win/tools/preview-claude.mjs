// preview-claude.mjs: stage the v2 look for ONE throwaway `claude` process without changing your live setup.
//   node tools/preview-claude.mjs seed  [palette]   write the (unselected) theme file, seed the skins store (backed up), write the --settings file
//   node tools/preview-claude.mjs restore           put the skins store back exactly as it was
//
// The preview process is then started with:  claude --resume <demo session> --settings <printed path>
// `--settings` overrides theme, status line and flightdeck panels for that process only. The skins mod keeps its
// state in a JSON file, so `seed` edits it (with a backup) and `restore` undoes that.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { getPalette } from "./lib/palette.mjs"
import { skin as buildSkin, claudeTheme } from "./build.mjs"
import { PALETTES, RICE, repoRoot } from "./rice.mjs"

const STORE = path.join(os.homedir(), ".claude", "plugins", "store", "skins_kasasree-mods-2f16574f50f4.json")
const BACKUP = path.join(RICE, "backups", "skins-store.original.json")
const PREVIEW = path.join(RICE, "preview")
const [cmd, name] = process.argv.slice(2)

function seed(paletteName) {
  const p = getPalette(PALETTES, paletteName)
  fs.mkdirSync(PREVIEW, { recursive: true }); fs.mkdirSync(path.dirname(BACKUP), { recursive: true })
  // 1. the theme file (selecting it is what changes the look, and only the preview settings select it)
  const themeFile = path.join(os.homedir(), ".claude", "themes", `${p.key}.json`)
  fs.mkdirSync(path.dirname(themeFile), { recursive: true })
  const marker = path.join(PREVIEW, "seed.json")
  if (!fs.existsSync(marker)) fs.writeFileSync(marker, JSON.stringify({ themeFile, createdTheme: !fs.existsSync(themeFile) }))   // remember whether the theme file was ours
  fs.writeFileSync(themeFile, JSON.stringify(claudeTheme(p), null, 2) + "\n")
  // 2. the skins store
  if (!fs.existsSync(BACKUP)) fs.copyFileSync(STORE, BACKUP)      // first backup wins: it is the true original
  const store = JSON.parse(fs.readFileSync(BACKUP, "utf8"))
  const s = buildSkin(p)
  store.custom[s.name] = { name: s.name, label: p.label, base: "tokyo-night", palette: s.palette, spinner: s.spinner, done: s.done }
  store.prefs = { ...store.prefs, skin: s.name, ...s.settings }
  fs.writeFileSync(STORE, JSON.stringify(store))
  // 3. the status line shim + the per-process settings
  const shim = path.join(PREVIEW, "deck.cmd")
  fs.writeFileSync(shim, `@echo off\r\n"${process.execPath}" "${path.join(repoRoot, "statusline", "aurora-deck.mjs")}"\r\n`)
  const settings = {
    theme: `custom:${p.key}`,
    statusLine: { type: "command", command: `exec "${shim.replace(/\\/g, "/")}"`, refreshInterval: 60 },
    pluginConfigs: { "flightdeck@kasasree-mods": { options: { openOnStart: true, statusLine: false, panels: "architect,gate,agents,loops,receipt,log" } } },
  }
  const settingsFile = path.join(PREVIEW, "settings.preview.json")
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2))
  console.log(JSON.stringify({ themeFile, store: STORE, backup: BACKUP, shim, settingsFile }))
}

function restore() {
  if (fs.existsSync(BACKUP)) { fs.copyFileSync(BACKUP, STORE); console.log(`restored ${STORE}`) } else console.log("no skins store backup to restore")
  const marker = path.join(PREVIEW, "seed.json")
  if (fs.existsSync(marker)) {
    const { themeFile, createdTheme } = JSON.parse(fs.readFileSync(marker, "utf8"))
    if (createdTheme) { fs.rmSync(themeFile, { force: true }); console.log(`removed ${themeFile} (the preview created it)`) }
    fs.rmSync(marker, { force: true })
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  if (cmd === "seed") seed(name)
  else if (cmd === "restore") restore()
  else { console.log("usage: node tools/preview-claude.mjs <seed|restore> [palette]"); process.exit(cmd ? 1 : 0) }
}
