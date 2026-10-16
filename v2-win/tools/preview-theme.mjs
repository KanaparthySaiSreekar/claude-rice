// preview-theme.mjs: try a Windows Terminal window-chrome variant for a moment, and put the settings back.
// The theme is a GLOBAL Windows Terminal setting, so while a variant is on, every open window shows it.
//   node tools/preview-theme.mjs on <mica|art>      back up settings.json, apply the variant
//   node tools/preview-theme.mjs off                restore settings.json exactly as it was
import fs from "node:fs"
import path from "node:path"
import { readWt, writeWt, upsert, PREVIEW_GUID, WT_SETTINGS } from "./lib/wt.mjs"
import { getPalette } from "./lib/palette.mjs"
import { wtScheme, wtTheme } from "./build.mjs"
import { PALETTES, RICE } from "./rice.mjs"

const BACKUP = path.join(RICE, "backups", "wt-settings.before-theme-preview.json")
const [mode, variant] = process.argv.slice(2)

if (mode === "on") {
  const p = getPalette(PALETTES)
  if (!fs.existsSync(BACKUP)) fs.copyFileSync(WT_SETTINGS, BACKUP)
  const s = readWt(), th = wtTheme(p)
  if (variant === "art") { th.window.useMica = false; s.profiles.list.find((x) => x.guid === PREVIEW_GUID)["experimental.useBackgroundImageForWindow"] = true }
  s.schemes = upsert(s.schemes, wtScheme(p)); s.themes = upsert(s.themes ?? [], th); s.theme = th.name
  writeWt(s); console.log(`theme variant "${variant}" on`)
} else if (mode === "off") {
  if (!fs.existsSync(BACKUP)) { console.log("nothing to restore"); process.exit(0) }
  fs.copyFileSync(BACKUP, WT_SETTINGS); fs.rmSync(BACKUP); console.log("windows terminal settings restored")
} else { console.log("usage: node tools/preview-theme.mjs on <mica|art> | off"); process.exit(1) }
