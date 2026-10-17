// background.mjs: put the palette's background (v2-win/palette/palettes.json, base.bg) into the live files that
// draw it, without a full v2 apply (which would also rewrite settings.json under the v7 kit). v7 moved Ember's
// bg from #0A0908 to #121110, the black the side panel already used.
//
//   node v7-win/tools/background.mjs [palette] [--dry-run]
//
// Touches: ~/.claude/themes/<palette>.json, the "Claude <Palette>" Windows Terminal scheme, and the status line's
// ~/.rice/current/statusline/palette.json. Each file is copied to ~/.rice/backups/<timestamp>-v7-background/ first.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const V2 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "v2-win")
const url = (p) => "file:///" + p.replace(/\\/g, "/")
const { getPalette } = await import(url(path.join(V2, "tools", "lib", "palette.mjs")))
const { claudeTheme, wtScheme, statusPalette } = await import(url(path.join(V2, "tools", "build.mjs")))
const { readWt, writeWt, upsert, WT_SETTINGS } = await import(url(path.join(V2, "tools", "lib", "wt.mjs")))

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const p = getPalette(path.join(V2, "palette", "palettes.json"), args.find((a) => !a.startsWith("--")) ?? "ember")
const home = os.homedir()
const themeFile = path.join(home, ".claude", "themes", `${p.key}.json`)
const deckPalette = path.join(home, ".rice", "current", "statusline", "palette.json")
const backup = path.join(home, ".rice", "backups", `${new Date().toISOString().replace(/[:.]/g, "-")}-v7-background`)

const keep = (file) => {
  if (dryRun || !fs.existsSync(file)) return
  fs.mkdirSync(backup, { recursive: true })
  fs.copyFileSync(file, path.join(backup, path.basename(file)))
}
const writeJson = (file, obj, indent = 2) => fs.writeFileSync(file, JSON.stringify(obj, null, indent) + "\n")

const changes = []
keep(themeFile)
changes.push(`${themeFile}: background ${p.base.bg}`)
if (!dryRun) writeJson(themeFile, claudeTheme(p))
if (fs.existsSync(WT_SETTINGS)) {
  keep(WT_SETTINGS)
  const wt = readWt()
  const scheme = wtScheme(p)
  wt.schemes = upsert(wt.schemes ?? [], scheme)
  changes.push(`Windows Terminal scheme "${scheme.name}": background ${scheme.background}`)
  if (!dryRun) writeWt(wt)
}
if (fs.existsSync(deckPalette)) {
  keep(deckPalette)
  changes.push(`${deckPalette}: base.bg ${p.base.bg}`)
  if (!dryRun) writeJson(deckPalette, statusPalette(p))
}
console.log(`${dryRun ? "would change" : "changed"}:\n  ${changes.join("\n  ")}${dryRun ? "" : `\nbackup in ${backup}`}`)
