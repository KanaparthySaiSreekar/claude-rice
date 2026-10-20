// v7-mac tests: the macOS base (Ghostty, fish, status line, Claude Code settings) is built from the palette, never forks in
// the prompt, merges into settings.json without losing keys, and reverts byte for byte.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { getPalette } from "../../v2-win/tools/lib/palette.mjs"
import { ghosttyConfig, fishRice, ezaColors, LS_GROUPS, deckCommand } from "../tools/build.mjs"
import { PALETTES, apply, revert, plan, mergeClaudeSettings, fromZsh, locations } from "../tools/mac.mjs"

const p = getPalette(PALETTES, "ember")
const quiet = { log: () => {} }
const fish = ["/opt/homebrew/bin/fish", "/usr/local/bin/fish"].find((f) => fs.existsSync(f))

function sandbox(fn) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "rice-mac-"))
  try { return fn(home, locations(home)) } finally { fs.rmSync(home, { recursive: true, force: true }) }
}

test("Ghostty takes every colour from the palette, v7's #121110 behind the text, and nothing that costs GPU per frame", () => {
  const c = ghosttyConfig(p, { shell: "/opt/homebrew/bin/fish" })
  assert.match(c, /^background = #121110$/m)
  assert.match(c, new RegExp(`^cursor-color = ${p.accent.coral}$`, "m"))
  const order = ["black", "red", "green", "yellow", "blue", "purple", "cyan", "white", "brightBlack", "brightRed", "brightGreen", "brightYellow", "brightBlue", "brightPurple", "brightCyan", "brightWhite"]
  order.forEach((k, i) => assert.match(c, new RegExp(`^palette = ${i}=${p.ansi[k]}$`, "m"), k))
  assert.match(c, /^background-opacity = 1$/m)
  for (const costly of ["custom-shader", "background-blur", "background-image"]) assert.doesNotMatch(c, new RegExp(`^${costly}`, "m"), costly)
  assert.match(c, /^font-family = "JetBrainsMono Nerd Font Mono"$/m)
  assert.match(c, /^command = \/opt\/homebrew\/bin\/fish$/m)
})

test("fish colours are palette colours, and the prompt runs only fish builtins (no git, no forks)", () => {
  const f = fishRice(p)
  const colours = new Set([...Object.values(p.base), ...Object.values(p.accent)].map((h) => h.slice(1).toUpperCase()))
  for (const m of f.matchAll(/^set -g fish_(?:pager_)?color_\w+ (.*)$/gm))
    for (const hex of m[1].match(/\b[0-9A-F]{6}\b/g) ?? []) assert.ok(colours.has(hex), `${m[0]} uses ${hex}, not a palette colour`)
  const prompt = f.slice(f.indexOf("function __rice_branch"))
  const BUILTINS = new Set(["string", "path", "math", "__rice_branch", "set_color", "read", "test", "set", "printf", "echo"])
  for (const m of prompt.matchAll(/\(([\w-]+)/g)) assert.ok(BUILTINS.has(m[1]), `command substitution starts ${m[1]}`)
  assert.doesNotMatch(prompt, /\bgit\s+(status|rev-parse|branch|symbolic-ref)/)
})

test("the fish prompt finds the branch from .git/HEAD, a worktree's .git file, and shows a red arrow after a failure", { skip: !fish && "fish is not installed" }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rice-prompt-"))
  try {
    const rc = path.join(dir, "rice.fish")
    fs.writeFileSync(rc, fishRice(p))
    const repo = path.join(dir, "repo", "src", "deep")
    fs.mkdirSync(repo, { recursive: true })
    fs.mkdirSync(path.join(dir, "repo", ".git"))
    fs.writeFileSync(path.join(dir, "repo", ".git", "HEAD"), "ref: refs/heads/feature/ember\n")
    const wt = path.join(dir, "wt")
    fs.mkdirSync(path.join(dir, "gitdirs", "wt"), { recursive: true })
    fs.mkdirSync(wt)
    fs.writeFileSync(path.join(wt, ".git"), "gitdir: ../gitdirs/wt\n")
    fs.writeFileSync(path.join(dir, "gitdirs", "wt", "HEAD"), "ref: refs/heads/wt-branch\n")
    const run = (cwd, script) => execFileSync(fish, ["--no-config", "-i", "-c", `source ${rc}; cd ${cwd}; ${script}`], { encoding: "utf8", env: { ...process.env, HOME: dir } })
    assert.equal(run(repo, "__rice_branch").trim(), "feature/ember")
    assert.equal(run(wt, "__rice_branch").trim(), "wt-branch")
    assert.equal(run(dir, "__rice_branch; echo -n none").trim(), "none")
    const ok = run(repo, "true; fish_prompt"), bad = run(repo, "false; fish_prompt")
    assert.match(ok, /~\/repo\/src\/deep/)
    assert.match(ok, /⌥ .*feature\/ember/)
    assert.match(ok, /\x1b\[38;2;255;122;26m ❯/)   // coral after success
    assert.match(bad, /\x1b\[38;2;255;77;77m ❯/)   // red after a failure
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test("ls colours: every group from the PowerShell profile, as truecolour SGR", () => {
  const c = ezaColors(p)
  assert.match(c, /^di=38;2;255;122;26:/)
  for (const [name, exts] of LS_GROUPS) assert.match(c, new RegExp(`\\*\\.${exts[0]}=38;2;\\d+;\\d+;\\d+`), name)
})

test("settings merge: theme, deck, fullscreen and the tab-title hook in; other keys kept; a second merge adds no duplicate hooks", () => {
  const before = { model: "opus", enabledPlugins: { "x@y": true }, hooks: { Stop: [{ hooks: [{ type: "command", command: "say done" }] }] }, maxProseWidth: 80 }
  const opts = { node: "/opt/homebrew/bin/node", deck: "/h/.rice/current/statusline/aurora-deck.mjs", hook: "/h/.claude/hooks/tab-title.mjs" }
  const once = mergeClaudeSettings(before, p, opts), twice = mergeClaudeSettings(once, p, opts)
  assert.deepEqual(twice, once)
  assert.equal(once.theme, "custom:ember")
  assert.equal(once.tui, "fullscreen")
  assert.equal(once.model, "opus")
  assert.equal(once.maxProseWidth, 80)
  assert.equal(once.wheelScrollAccelerationEnabled, false)   // trackpad swipes do not overshoot
  assert.equal(mergeClaudeSettings({ wheelScrollAccelerationEnabled: true }, p, opts).wheelScrollAccelerationEnabled, true)
  assert.equal(once.enabledPlugins["x@y"], true)
  assert.equal(once.statusLine.command, deckCommand(opts.node, opts.deck))
  assert.equal(once.env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE, "1")
  assert.equal(once.hooks.Stop.length, 2)
  assert.equal(once.hooks.Stop[0].hooks[0].command, "say done")
  for (const e of ["UserPromptSubmit", "PermissionRequest", "Stop"]) assert.match(once.hooks[e].at(-1).hooks[0].command, /tab-title\.mjs'$/)
})

test("fish starts where zsh did: PATH additions in zsh's order, aliases kept", () => {
  const z = `export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"\n\nalias python='python3'\nalias pip='pip3'\nexport PATH="$HOME/.local/bin:$PATH"\n`
  const { paths, aliases } = fromZsh(z, "/Users/me")
  assert.deepEqual(paths, ["/Users/me/.local/bin", "/opt/homebrew/bin", "/opt/homebrew/sbin"])
  assert.deepEqual(aliases, { python: "python3", pip: "pip3" })
})

test("apply in a sandbox: the status line runs and draws in the palette; applying twice changes nothing; revert is byte for byte", () => sandbox((home, L) => {
  fs.mkdirSync(path.join(home, ".claude"), { recursive: true })
  const original = JSON.stringify({ model: "opus", theme: "dark" }, null, 2) + "\n"
  fs.writeFileSync(L.claudeSettings, original)
  fs.writeFileSync(L.zshrc, `export PATH="$HOME/.local/bin:$PATH"\n`)
  apply("ember", { ...quiet, L, fish: "/opt/homebrew/bin/fish" })
  const s = JSON.parse(fs.readFileSync(L.claudeSettings, "utf8"))
  assert.equal(s.theme, "custom:ember")
  for (const f of [L.ghostty, L.fishRice, L.fishConfig, L.hook, path.join(L.claudeThemes, "ember.json")]) assert.ok(fs.existsSync(f), f)
  // the deck itself, run the way Claude Code runs it: rows on stdout, coloured from the palette (the macOS entry-point bug)
  const deck = path.join(L.rice, "current", "statusline", "aurora-deck.mjs")
  const out = execFileSync(process.execPath, [deck], { input: JSON.stringify({ model: { display_name: "Opus 5.5" }, workspace: { current_dir: home } }), encoding: "utf8", env: { ...process.env, HOME: home, COLUMNS: "140" } })
  assert.match(out, /Opus 5\.5/)
  assert.match(out, /\x1b\[48;2;255;122;26m/)
  assert.deepEqual(plan("ember", { L, fish: "/opt/homebrew/bin/fish" }).files.filter((f) => !f.same).map((f) => f.target), [])
  revert(undefined, L)
  assert.equal(fs.readFileSync(L.claudeSettings, "utf8"), original)
  for (const f of [L.ghostty, L.fishRice, L.fishConfig, L.hook, deck]) assert.ok(!fs.existsSync(f), `${f} should be gone`)
}))

test("v7-mac's switch: every option it sets is declared in that mod's manifest; your prompts are a palette-white bubble and declines are quiet", async () => {
  const { loadSpec, resolve } = await import("../../v3-win/tools/kit.mjs")
  const v = resolve(loadSpec(path.resolve(import.meta.dirname, "..")), "ember")
  const p7 = v.options["prismantis@kasasree-mods"]
  assert.deepEqual([p7.promptStyle, p7.promptColor, p7.declined], ["bubble", p.base.fg, "quiet"])
  assert.equal(v.options["cctop@kasasree-mods"].statusLine, false)
  const market = path.resolve(import.meta.dirname, "..", "..", "..", "claude-mods-local")
  if (!fs.existsSync(market)) return
  const entries = JSON.parse(fs.readFileSync(path.join(market, ".claude-plugin", "marketplace.json"), "utf8")).plugins
  for (const [id, opts] of Object.entries(v.options)) {
    const entry = entries.find((e) => e.name === id.split("@")[0])
    assert.ok(entry, `${id} is not in the marketplace`)
    const manifest = JSON.parse(fs.readFileSync(path.join(market, entry.source, ".claude-plugin", "plugin.json"), "utf8"))
    for (const key of Object.keys(opts)) assert.ok(key in (manifest.userConfig ?? {}), `${id} has no option ${key}`)
  }
})

test("the status line command Claude Code runs draws the two rows with half a row between (no spacer row, bars in the lower half); v2's default keeps its spacer", () => {
  const deck = path.resolve(import.meta.dirname, "..", "..", "v2-win", "statusline", "aurora-deck.mjs")
  const input = JSON.stringify({ model: { display_name: "Opus 5.5" }, workspace: { current_dir: os.tmpdir() }, context_window: { used_percentage: 44, context_window_size: 1000000 } })
  const env = { ...process.env, COLUMNS: "180" }
  delete env.AURORA_DECK_GAP
  const viaCommand = execFileSync("/bin/sh", ["-c", deckCommand(process.execPath, deck)], { input, encoding: "utf8", env }).replace(/\n$/, "").split("\n")
  assert.equal(viaCommand.length, 2, JSON.stringify(viaCommand))
  assert.match(viaCommand[0], /Opus 5\.5/)
  assert.match(viaCommand[1], /ctx/)
  const bars = viaCommand[1].replace(/\x1b\[[0-9;]*m/g, "")
  assert.match(bars, /▄/)
  assert.doesNotMatch(bars, /[█▏▎▍▌▋▊▉]/, "no full-height bar cells")
  assert.doesNotMatch(viaCommand[1], /\x1b\[48;2;27;25;23m/, "no full-height track background")
  const v2 = execFileSync(process.execPath, [deck], { input, encoding: "utf8", env }).replace(/\n$/, "").split("\n")
  assert.deepEqual(v2.map((r) => r === "​"), [false, true, false])
})

test("secret-box loads last, so every other mod sees only placeholders: kept at the end even after a later install, values untouched", async () => {
  const { loadSpec, resolve, merged } = await import("../../v3-win/tools/kit.mjs")
  const v = resolve(loadSpec(path.resolve(import.meta.dirname, "..")), "ember")
  assert.equal(v.plugins["secret-box@kasasree-mods"], true)
  assert.deepEqual(v.last, ["secret-box@kasasree-mods"])
  // installed in the middle, with a mod installed after it and one switched off
  const before = JSON.stringify({ enabledPlugins: { "prismantis@kasasree-mods": true, "secret-box@kasasree-mods": true, "later@other": true, "off@other": false } })
  const order = Object.entries(JSON.parse(merged(before, v)).enabledPlugins)
  assert.deepEqual(order.at(-1), ["secret-box@kasasree-mods", true])
  assert.deepEqual(Object.fromEntries(order)["later@other"], true)
  assert.deepEqual(Object.fromEntries(order)["off@other"], false)
  // merging twice changes nothing
  const once = merged(before, v)
  assert.equal(merged(once, v), once)
})
