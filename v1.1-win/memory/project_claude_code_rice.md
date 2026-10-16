---
name: project_claude_code_rice
description: "Claude Code mods + terminal rice (2026-10-15): what's live, pinned-marketplace location, install switch to native 2.1.300, rejected/disabled mods and why, gotchas, pending user steps, rollback"
metadata:
  node_type: memory
  type: project
  originSessionId: a45701a8-1a29-45e0-9fa3-993d028d4590
  modified: 2026-10-16T15:29:47.770Z
---

Claude Code ricing done 2026-10-15 from two research docs (`Downloads\claude-code-mod-research.md` + private repo
`KanaparthySaiSreekar/claude-code-mods-research`, read via `gh`). Daily driver stays **Windows Terminal** (see [[project_terminal_setup]]);
Rio is the optional "pixel" terminal. Docs: `C:\Users\Kasasree\Projects\claude-rice\README.md` and
`C:\Users\Kasasree\Projects\claude-mods-local\README.md` (pinned SHAs, local patches, rollback). Backups: `claude-rice\backup\`
(Claude settings, WT settings, user PATH).

**What's live:**
- Claude Code **2.1.300 via the native installer** (`~\.local\bin\claude.exe`, prepended to User PATH, self-updates on `latest`). The old winget copy (2.1.292) is still installed as fallback. Reason: winget only follows the `stable` npm tag; Claude Code compares against `latest`, so the "Update available" banner never cleared and `claude update` refuses winget installs.
- Theme `custom:claude` (`~/.claude/themes/claude.json`, colors from the WT "Claude" scheme); brand spinner verbs/tips; `maxProseWidth` 100.
- **Status line = claude-hud, ONE line: folder + git + prompt-cache clock** (`claude-code-mods-research git:(main) │ Cache ⏱ until 08:56 pm`; `main*` = uncommitted, `↑1` = unpushed). Since 2026-10-16 model, effort, context %, 5h and 7d are deliberately NOT in it because the flightdeck pane already shows them (user: "there is some overlap of the same content so remove it from the status line"); the cache clock was chosen from a menu of real HUD renders as the one useful extra flightdeck lacks. Config `~/.claude/plugins/claude-hud/config.json`: `lineLayout: "expanded"`, `elementOrder: ["project","promptCache"]`, `display.mergeGroups: [["project","promptCache"]]` (puts both on one row; wraps to 2 rows only below ~65 cols), `showPromptCache: true`, `showModel: false`, `showEffortLevel: false`. Whether Claude Code's live payload carries `prompt_cache` was not observed from inside the session; if the clock never appears, check that first. The compact layout can't do this (it always prints the model + context cluster); expanded builds one row per `elementOrder` entry. Before that it was the compact one-liner `[Sonnet 5.5] 29% | folder git:(main) | 5h: 15% (3h 57m) | 7d: 89% ▲`; backup `claude-rice/backup/claude-hud-config.before-dedupe-with-flightdeck.2026-10-16.json`. Trade-off: with the flightdeck pane closed there is no context/usage readout. The `⏵⏵ bypass permissions` footer is Claude Code's own and also repeats flightdeck's `mode` row; it can't be removed from the HUD. The user explicitly does NOT want bars or multi-row status. claude-powerline 1.32.3 (pinned tarball in `claude-mods-local\tools\`, tui panel was 5 rows) was tried and replaced; it stays installed but unused; its text symbols are minified so `ctx/5h/wk` labels can't be patched without a rebuild.
- skins **`rail` is OFF on purpose** (user wants minimum vertical space): with the rail on, `stack()` in `skins/hooks/rows.tsx` adds a `┃` connector row above every tool node, so each tool call costs 2 rows; off = 1 row (`● Run 1`). Don't re-enable it. Set via the skins `design` tool or `/skin rail off`; stored in the mod's `$.store`, not settings.json.
- Skin **`claude-warm`** (skins mod; default `noir` painted every tool type the same gray, which was the "boring" look). skins' usage `band` is OFF so usage/context come from one place only.
- Mods from pinned marketplace `kasasree-mods`: skins (patched), image-view, filetree, flightdeck. token-weather is **disabled** (redundant, reads 0% until the first completed turn).
- **Right dock is one pane at a time in practice.** filetree re-opens its own pane whenever cwd/files change unless its `start` option is `off` (source: `noDock`), which kept hiding flightdeck. Current config (stored in `settings.json` under `pluginConfigs`): filetree `start=off` (use `/filetree`), flightdeck `openOnStart=true` and `statusLine=false`. flightdeck's own status-line option adds a third `⚠ flightdeck: ctx NN%` row, so keep it false. User wants as few bottom rows as possible: target is HUD (1 line) + Claude's built-in `⏵⏵ bypass permissions` footer (not removable) = 2 rows.
- Pane keys: Ctrl+X then Tab focuses a pane, Ctrl+X + arrows resizes, Ctrl+X then X closes it.
- Silent tab-title hooks (`~/.claude/hooks/tab-title.mjs`; `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` so Claude doesn't overwrite it). Since 2026-10-16 the title carries the git branch (`◐ folder ⎇ main`), read straight from `.git/HEAD` (walks up, handles worktree `.git` files, detached HEAD = folder only) with NO git process, so nothing in a repo can execute; this is where "git" went because flightdeck has no process/fs access and can't show it. 20-case test suite passed; previous hook saved in `claude-rice/backup/tab-title.before-branch.2026-10-16.mjs`.
- Windows Terminal defaults: grayscale antialiasing, 95% acrylic, padding, orange tab color.

**Why / how to apply (deviations from the research that a future session must not undo):**
- **One source per number.** The user hit three disagreeing context gauges (token-weather, claude-hud, flightdeck) and a stale 0%. Keep a single context/usage display; keep powerline's `autocompactBuffer: 0` so % equals Claude's native `used_percentage`.
- **blast-radius NOT installed**: needs `bash -c`/`sleep`, not on native Windows PATH, so the guard fails open.
- **intermission NOT installed**: downloads an unverified ~40 MB native engine at runtime and spawns it; pinning can't cover it. Only install if the user knowingly accepts that.
- **skins over prismantis** (~630 tokens/prompt). **token-weather needed a patch** (never called `next(e)`), now moot while disabled.
- **"needs-you" is a settings hook, not a mod** (built when the install was 2.1.292). On 2.1.300 the title/notify mod APIs exist; could be rebuilt as a mod, but the hook works and has no mod attack surface.
- **claude-powerline is pinned as an npm tarball**, never `npx @latest` (runs unreviewed code on every repaint). Its pricing fetch is only reachable via cost segments; don't enable `today`/`session` cost segments without re-reading `src/segments/pricing.ts`.
- **Update flow for plugins**: re-clone upstream into an empty dir, `claude plugin validate`, diff `hooks:`/`calls:` against the README table, copy, re-patch, commit.

**Gotchas:**
- **The status line's folder name is the session's working directory, and my own `cd` moves it.** After a task I `cd`'d into `...\claude-hud\src\render` and the user saw `render git:(main)` and called it a glitch. Finish tool work with a `cd` back to the project folder (e.g. `cd /c/Users/Kasasree/Projects/<project>`); avoid leaving the shell in a plugin or temp directory.
- Validator rejects third-party plugin names starting with `claude-` (claude-hud); install still works, it's only a lint.
- claude-hud's launcher imports the highest-versioned `claude-hud` in any marketplace cache, so never add a second marketplace that ships one.
- Directory-marketplace plugins are read **live**, so `git -C ...\claude-mods-local status --short` must be empty (tamper check).
- `claude plugin configure --values-stdin` wants every value as a string (`"false"`, not `false`).
- This Git Bash layer collapses `\\` in `echo`/`printf` args: test JSON with Windows paths via files, never inline strings. PowerShell `Remove-Item` with regex-looking text in the same command can trip the harness pre-check; delete separately.
- Nerd/PUA glyphs may render blank inside Claude Code; powerline is on `charset: unicode` (box-drawing + normal symbols). If blanks appear, switch to `"charset": "text"`.

**Pending user steps (as of 2026-10-15):** open a NEW terminal (so `claude` resolves to native 2.1.300) and restart Claude Code; run `setup-rio.ps1` from an elevated PowerShell if Rio is wanted; then visually check theme, powerline panel, claude-warm skin, tab titles, image-view. Nothing visual could be checked from inside the session; only headless load, hook output, and status-line text renders were verified. Optional cleanup once happy with native: `winget uninstall Anthropic.ClaudeCode`.

**Rollback:** `claude --safe-mode` for one vanilla session; status line back to claude-hud = see claude-mods-local README; full undo list in the claude-rice README.
