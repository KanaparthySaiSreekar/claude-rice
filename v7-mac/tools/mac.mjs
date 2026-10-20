#!/usr/bin/env node
// mac.mjs: the macOS base under v7, the job v2-win/tools/apply.mjs does on Windows. One palette into the Claude Code theme,
// the status line, Ghostty and fish, plus the Claude Code settings the Windows build ran with under v7 (fullscreen layout,
// prose width, spinner tips, the tab-title hook). Which mods run, and how, is v7's version.json (tools/rice.mjs).
//
//   node v7-mac/tools/mac.mjs apply  [palette] [--dry-run]
//   node v7-mac/tools/mac.mjs revert [backup-folder]     put every file back from the newest backup (default)
//   node v7-mac/tools/mac.mjs status
//
// Every file it touches is copied to ~/.rice/backups/<time>-mac/ first, in v2's manifest format, so v2's revert reads it:
// files that existed come back byte for byte, files it created are removed. RICE_HOME points it at a sandbox home.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { getPalette, audit } from "../../v2-win/tools/lib/palette.mjs"
import { claudeTheme, statusPalette } from "../../v2-win/tools/build.mjs"
import { revert as v2Revert } from "../../v2-win/tools/apply.mjs"
import { ghosttyConfig, fishRice, fishConfig, deckCommand } from "./build.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, "..", "..")
export const PALETTES = path.join(REPO, "v2-win", "palette", "palettes.json")
const DECK_SRC = path.join(REPO, "v2-win", "statusline", "aurora-deck.mjs")
const HOOK_SRC = path.join(REPO, "v7-mac", "hooks", "tab-title.mjs")

// Homebrew's stable links, not process.execPath: that resolves into Cellar/node/<version>/ and breaks on the next upgrade.
const firstThere = (list, fallback) => list.find((f) => fs.existsSync(f)) ?? fallback
export const NODE = firstThere(["/opt/homebrew/bin/node", "/usr/local/bin/node"], process.execPath)
export const FISH = firstThere(["/opt/homebrew/bin/fish", "/usr/local/bin/fish"], null)

export function locations(home = process.env.RICE_HOME ?? os.homedir()) {
  return {
    home,
    rice: path.join(home, ".rice"),
    claudeSettings: path.join(home, ".claude", "settings.json"),
    claudeThemes: path.join(home, ".claude", "themes"),
    hook: path.join(home, ".claude", "hooks", "tab-title.mjs"),
    ghostty: path.join(home, ".config", "ghostty", "config.ghostty"),
    fishRice: path.join(home, ".config", "fish", "conf.d", "rice.fish"),
    fishConfig: path.join(home, ".config", "fish", "config.fish"),
    zshrc: path.join(home, ".zshrc"),
  }
}

// The spinner tips the Windows build showed; all three hold on a Mac too.
export const TIPS = [
  "Ctrl+J inserts a newline without sending",
  "Ctrl+O then [ dumps the chat into native scrollback",
  "claude --safe-mode starts a session with every mod switched off",
]
const TITLE_EVENTS = ["UserPromptSubmit", "PermissionRequest", "Stop"]
const sq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`

/** settings.json with the macOS base merged in. Pure; keys it does not own are left alone. */
export function mergeClaudeSettings(s, p, { node, deck, hook }) {
  const out = structuredClone(s)
  out.theme = `custom:${p.key}`
  out.statusLine = { type: "command", command: deckCommand(node, deck), refreshInterval: 60 }
  out.tui = "fullscreen"                         // the panes dock beside the chat only in the fullscreen layout
  out.maxProseWidth ??= 100
  out.spinnerTipsOverride ??= { excludeDefault: true, tips: TIPS }
  // a MacBook trackpad swipe reaches Claude Code as a fast burst of wheel events (more while it coasts), which Claude Code
  // reads as a fast spin and accelerates, so a small swipe overshoots: keep a constant rate per event. /scroll-speed tunes it
  out.wheelScrollAccelerationEnabled ??= false
  // the tab title is the hook's ("◐ folder ⎇ branch", "▲ … · needs you", "✓ … · done"), so Claude Code's own is off
  out.env = { ...(out.env ?? {}), CLAUDE_CODE_DISABLE_TERMINAL_TITLE: "1" }
  const command = `${sq(node)} ${sq(hook)}`
  out.hooks = { ...(out.hooks ?? {}) }
  for (const event of TITLE_EVENTS) {
    const others = (out.hooks[event] ?? [])
      .map((m) => ({ ...m, hooks: (m.hooks ?? []).filter((h) => !String(h.command ?? "").includes("tab-title.mjs")) }))
      .filter((m) => m.hooks.length)
    out.hooks[event] = [...others, { hooks: [{ type: "command", command }] }]
  }
  return out
}

/** PATH additions and aliases from ~/.zshrc (and Homebrew's environment), so fish starts where zsh did. */
export function fromZsh(text, home, brew = "/opt/homebrew") {
  let paths = [`${brew}/bin`, `${brew}/sbin`]
  const aliases = {}
  for (const line of String(text ?? "").split("\n")) {
    const exp = /^\s*export\s+PATH="?([^"]+?)"?\s*$/.exec(line)
    if (exp) {
      const added = exp[1].split(":").filter((x) => x && x !== "$PATH" && x !== "${PATH}").map((x) => x.replace(/^(\$HOME|\$\{HOME\}|~)(?=\/|$)/, home))
      paths = [...added, ...paths.filter((x) => !added.includes(x))]
    }
    const al = /^\s*alias\s+([\w.-]+)=(['"])(.*)\2\s*$/.exec(line)
    if (al) aliases[al[1]] = al[3]
  }
  const env = fs.existsSync(`${brew}/bin/brew`) ? { HOMEBREW_PREFIX: brew, HOMEBREW_CELLAR: `${brew}/Cellar`, HOMEBREW_REPOSITORY: brew } : {}
  return { paths, aliases, env }
}

const readText = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null)
const json = (o) => JSON.stringify(o, null, 2) + "\n"

/** Every file apply would write, with its new content. config.fish is only made when there is none. */
export function plan(paletteName, { L = locations(), node = NODE, fish = FISH } = {}) {
  const p = getPalette(PALETTES, paletteName)
  const problems = audit(p)
  if (problems.length) throw new Error(`palette "${p.key}" has ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`)
  const deck = path.join(L.rice, "current", "statusline", "aurora-deck.mjs")
  const settingsText = readText(L.claudeSettings)
  const files = [
    [path.join(L.claudeThemes, `${p.key}.json`), json(claudeTheme(p))],
    [L.claudeSettings, json(mergeClaudeSettings(settingsText ? JSON.parse(settingsText) : {}, p, { node, deck, hook: L.hook }))],
    [L.hook, fs.readFileSync(HOOK_SRC, "utf8")],
    [L.ghostty, ghosttyConfig(p, { shell: fish })],
    [L.fishRice, fishRice(p)],
  ]
  if (fish && !fs.existsSync(L.fishConfig)) files.push([L.fishConfig, fishConfig(fromZsh(readText(L.zshrc), L.home))])
  return { p, deck, files: files.map(([target, text]) => ({ target, text, existed: fs.existsSync(target), same: readText(target) === text })) }
}

export function apply(paletteName, { dryRun = false, log = console.log, ...opts } = {}) {
  const L = opts.L ?? locations()
  const { p, deck, files } = plan(paletteName, { ...opts, L })
  const runtime = [[deck, fs.readFileSync(DECK_SRC, "utf8")], [path.join(path.dirname(deck), "palette.json"), json(statusPalette(p))]]
  const stale = runtime.filter(([f, t]) => readText(f) !== t)
  const todo = files.filter((f) => !f.same)
  const lines = [...todo.map((f) => `${f.existed ? "update" : "create"} ${f.target}`), ...stale.map(([f]) => `runtime ${f}`)]
  if (dryRun) { log(`dry run for "${p.key}": nothing was changed. It would:\n  ${lines.join("\n  ") || "nothing (already applied)"}`); return { changes: lines, dryRun: true } }
  if (!todo.length && !stale.length) { log(`"${p.key}" is already applied; nothing to do`); return { changes: [] } }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backup = path.join(L.rice, "backups", `${stamp}-mac`)
  const entries = todo.map((f) => {
    if (!f.existed) return { target: f.target, backup: null, existed: false }
    const dest = path.join(backup, "files", path.relative(L.home, f.target))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(f.target, dest)
    return { target: f.target, backup: dest, existed: true }
  })
  fs.mkdirSync(backup, { recursive: true })
  fs.writeFileSync(path.join(backup, "manifest.json"), json({ createdAt: new Date().toISOString(), palette: p.key, entries }))
  for (const [f, t] of [...todo.map((x) => [x.target, x.text]), ...stale]) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t) }
  fs.writeFileSync(path.join(L.rice, "state.json"), json({ applied: p.key, label: p.label, at: new Date().toISOString(), backup }))
  log(`applied "${p.key}" (${p.label}). Backup: ${backup}\n  ${lines.join("\n  ")}\nRestart Claude Code; open a new Ghostty window for the terminal side.`)
  return { changes: lines, backup }
}

export const revert = (folder, L = locations()) => v2Revert(L, folder)

export function status(L = locations()) {
  const f = path.join(L.rice, "state.json")
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [cmd, ...rest] = process.argv.slice(2)
  const arg = rest.find((a) => !a.startsWith("--"))
  if (cmd === "apply") apply(arg, { dryRun: rest.includes("--dry-run") })
  else if (cmd === "revert") { const { dir, log } = revert(arg); console.log(`reverted from ${dir}`); for (const l of log) console.log("  " + l) }
  else if (cmd === "status") { const s = status(); console.log(s ? `applied: ${s.label} (${s.applied}) at ${s.at}\nbackup : ${s.backup}` : "the macOS base is not applied") }
  else { console.log("usage: node v7-mac/tools/mac.mjs <apply [palette] [--dry-run] | revert [backup-folder] | status>"); process.exitCode = cmd ? 1 : 0 }
}
