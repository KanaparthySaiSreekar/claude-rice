#!/usr/bin/env node
// rice.mjs: the v2 command line.
//   node tools/rice.mjs audit   [palette]            contrast and sanity checks on a palette
//   node tools/rice.mjs build   [palette]            generate every artefact into ~/.rice/builds/<palette>
//   node tools/rice.mjs apply   [palette] [--dry-run] [--no-terminal]
//                                                    install it (backs up every file it touches first)
//   node tools/rice.mjs revert  [backup-folder]      put everything back from a backup (default: the newest)
//   node tools/rice.mjs status                       what is applied, and where the backup is
//   node tools/rice.mjs preview-install [palette] [--no-shader] [--image=0.42]
//                                                    add a hidden "rice-preview" Windows Terminal profile
//   node tools/rice.mjs preview-remove               take it out again
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getPalette, audit } from "./lib/palette.mjs"
import { writeBuild, wtScheme, wtProfileDefaults } from "./build.mjs"
import { readWt, writeWt, addPreviewProfile, removePreviewProfile, WT_SETTINGS } from "./lib/wt.mjs"
import { apply, revert, status, locations } from "./apply.mjs"

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const RICE = process.env.RICE_DIR ?? path.join(os.homedir(), ".rice")
export const PALETTES = path.join(repoRoot, "palette", "palettes.json")
export const PWSH = path.join(os.homedir(), "AppData", "Local", "Microsoft", "WindowsApps", "pwsh.exe")

const args = process.argv.slice(2)
const cmd = args[0]
const positional = args.slice(1).filter((a) => !a.startsWith("--"))
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
const flagValue = (name) => { const f = flag(name); return f && f.includes("=") ? f.split("=")[1] : undefined }

function loadChecked(name) {
  const p = getPalette(PALETTES, name)
  const problems = audit(p)
  if (problems.length) { console.error(`palette "${p.key}" has ${problems.length} problem(s):\n  - ` + problems.join("\n  - ")); process.exit(1) }
  return p
}

function cmdAudit(name) { const p = loadChecked(name); console.log(`palette "${p.key}" (${p.label}): contrast checks pass`) }

function buildInto(p, L) {
  const dir = path.join(L.rice, "builds", p.key)
  const t0 = Date.now()
  const out = writeBuild(p, dir, { assetsDir: dir, pwshPath: PWSH, repoRoot })
  return { dir, out, ms: Date.now() - t0 }
}

function cmdBuild(name) {
  const p = loadChecked(name)
  const { dir, out, ms } = buildInto(p, locations())
  console.log(`built "${p.key}" into ${dir} in ${ms} ms`)
  for (const [k, f] of Object.entries(out)) console.log(`  ${k.padEnd(12)} ${path.relative(dir, f)}  (${fs.statSync(f).size} bytes)`)
}

function cmdApply(name) {
  const p = loadChecked(name)
  const L = locations()
  const dryRun = Boolean(flag("dry-run"))
  const { dir } = dryRun ? { dir: path.join(L.rice, "builds", p.key) } : buildInto(p, L)
  const res = apply(p, L, { buildDir: dir, dryRun, skipTerminal: Boolean(flag("no-terminal")) })
  console.log(dryRun ? `dry run for "${p.key}": nothing was changed. It would:` : `applied "${p.key}" (${p.label}). Backup: ${res.backup}`)
  for (const line of res.plan) console.log("  " + line)
  if (!dryRun) {
    console.log("\nNext: restart Claude Code to load the theme, skin and status line fresh (the theme hot-reloads; the status line updates on the next reply).")
    console.log("Undo any time with:  node tools/rice.mjs revert")
  }
}

function cmdRevert(folder) {
  const { dir, log } = revert(locations(), folder)
  console.log(`reverted from ${dir}`); for (const l of log) console.log("  " + l)
}

function cmdStatus() {
  const s = status(locations())
  console.log(s ? `applied: ${s.label} (${s.applied}) at ${s.at}\nbackup : ${s.backup}` : "nothing applied (the rice is not installed)")
}

function backupFile(file, tag) {
  const dir = path.join(RICE, "backups"); fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, `${path.basename(file)}.${tag}.${new Date().toISOString().replace(/[:.]/g, "-")}`)
  fs.copyFileSync(file, dest); return dest
}

function cmdPreviewInstall(name) {
  const p = loadChecked(name)
  const dir = path.join(RICE, "builds", p.key)
  if (!fs.existsSync(path.join(dir, p.art ? "art/bg.png" : "wt/scheme.json"))) cmdBuild(name)
  const bk = backupFile(WT_SETTINGS, "before-preview")
  const defaults = wtProfileDefaults(p, dir, { shader: !flag("no-shader"), imageOpacity: flagValue("image") ? Number(flagValue("image")) : undefined })
  if (!p.art) defaults.backgroundImage = "none"   // the preview profile inherits profiles.defaults, which may still hold another palette's picture
  writeWt(addPreviewProfile(readWt(), { scheme: wtScheme(p), defaults, pwsh: PWSH }))
  console.log(`added hidden profile "rice-preview" (backup: ${bk})`)
}

function cmdPreviewRemove() {
  writeWt(removePreviewProfile(readWt()))
  console.log('removed profile "rice-preview"')
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const table = { audit: cmdAudit, build: cmdBuild, apply: cmdApply, revert: cmdRevert, status: cmdStatus, "preview-install": cmdPreviewInstall, "preview-remove": cmdPreviewRemove }
  if (!table[cmd]) { console.log("usage: node tools/rice.mjs <audit|build|apply|revert|status|preview-install|preview-remove> [palette] [flags]"); process.exit(cmd ? 1 : 0) }
  table[cmd](positional[0])
}
