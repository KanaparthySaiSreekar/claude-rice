#!/usr/bin/env node
// mods.mjs: register the pinned marketplace (claude-mods-local, next to this repo) as kasasree-mods and install the eight
// mods v7 switches on. Idempotent: a mod already installed is updated from the marketplace instead (Claude Code copies a
// mod into its cache again only when its version changed).
//
//   node v7-mac/tools/mods.mjs install [--dry-run]
//   node v7-mac/tools/mods.mjs status
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const MARKET = path.resolve(HERE, "..", "..", "..", "claude-mods-local")
export const NAME = "kasasree-mods"
const spec = JSON.parse(fs.readFileSync(path.resolve(HERE, "..", "version.json"), "utf8"))
// every mod v7 turns on (skins, which it turns off, is not in the macOS marketplace)
export const MODS = Object.entries(spec.plugins).filter(([, on]) => on).map(([id]) => id.split("@")[0])

const claude = (args, { quiet = false } = {}) => execFileSync("claude", args, { encoding: "utf8", stdio: ["ignore", "pipe", quiet ? "ignore" : "pipe"] })
const installed = () => { try { return claude(["plugin", "list"], { quiet: true }) } catch { return "" } }

export function install({ dryRun = false, log = console.log } = {}) {
  if (!fs.existsSync(path.join(MARKET, ".claude-plugin", "marketplace.json"))) throw new Error(`no marketplace at ${MARKET}`)
  const dirty = execFileSync("git", ["-C", MARKET, "status", "--short"], { encoding: "utf8" }).trim()
  if (dirty) throw new Error(`${MARKET} has changes since review (tamper check):\n${dirty}`)
  const steps = [["plugin", "marketplace", "add", MARKET, "--scope", "user"]]
  const have = installed()
  for (const m of MODS) steps.push(have.includes(`${m}@${NAME}`) ? ["plugin", "update", `${m}@${NAME}`] : ["plugin", "install", `${m}@${NAME}`, "--scope", "user"])
  for (const s of steps) {
    log(`claude ${s.join(" ")}`)
    if (dryRun) continue
    if (s[1] === "marketplace") { try { claude(s) } catch { claude(["plugin", "marketplace", "update", NAME]) } }
    else claude(s)
  }
  return steps
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === "install") install({ dryRun: rest.includes("--dry-run") })
  else if (cmd === "status") { const have = installed(); for (const m of MODS) console.log(`${have.includes(`${m}@${NAME}`) ? "installed" : "missing  "}  ${m}@${NAME}`) }
  else { console.log("usage: node v7-mac/tools/mods.mjs <install [--dry-run] | status>"); process.exitCode = cmd ? 1 : 0 }
}
