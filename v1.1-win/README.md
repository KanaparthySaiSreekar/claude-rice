# v1.1-win: refinements to the Windows setup

Taken **2026-10-16**, on top of [`v1-win`](../v1-win/). The mods themselves did not change, so this folder holds only what changed: the config files, the new tests and tools, the backups, and the reasons. For everything else (all mod source, the full settings, the marketplace history) see `../v1-win/full/`.

## What changed since v1-win

| Area | v1-win | v1.1-win |
|---|---|---|
| Status line | claude-hud `compact`: `[Sonnet 5.5 ◕] 29% \| folder git:(main) \| 5h … \| 7d …` | claude-hud `expanded` with two elements: `folder git:(main) │ Cache ⏱ until 08:56 pm` |
| Model, effort, context %, 5h, 7d | In the status line **and** in flightdeck | **Flightdeck only** |
| Git branch | Status line only | Status line **and** the tab title |
| Tab title | `◐ folder` | `◐ folder ⎇ branch` (`▲ … · needs you`, `✓ … · done`) |
| PowerShell profile | Not in the snapshot | Added: `config/powershell/` (Claude-palette prompt, icon `ls`) |

### 1. The overlap with flightdeck
Flightdeck's main panel already shows the model, effort, context %, 5h and 7d usage, and permission mode, so the status line repeated four of them. They are now only in flightdeck.

- **How it was done:** the compact layout always prints the model and context cluster (`src/render/compact.ts` builds it unconditionally), so it cannot hide them. The expanded layout builds one row per entry in `elementOrder`, so `["project", "promptCache"]` plus `display.mergeGroups: [["project", "promptCache"]]` gives one row with only those two.
- **The cache clock** is the one useful extra that flightdeck does not have. It shows the time the prompt cache expires, `expired` once it has, and nothing before the session has cache data.
- **Width:** the two items share a row down to about 65 columns, then wrap to two rows.

### 2. Why git is not in flightdeck
Flightdeck contains no git code and, by design, no process or file access (`$.state`, `$.command`, `$.ui` and `$.session.usage` only), which is why it was chosen. Adding git would have changed what that reviewed mod is allowed to do. The branch went into the tab title instead.

### 3. The tab title reads `.git/HEAD`, it does not run git
`config/claude/hooks-tab-title.mjs` walks up from the working directory to the nearest `.git` (a folder, or a file for worktrees), reads `HEAD`, and prints `folder ⎇ branch`. No process is started, so nothing inside a repository you merely enter can run, and it costs the same as before (35 ms against 37 ms). A detached HEAD or a folder that is not a repo shows the folder name only.

`tools/test-title.mjs` is a 20-case suite for it: the three titles, a subfolder, a worktree with a slashed branch name, a detached HEAD, garbage `HEAD` and `.git` files, a missing directory, six kinds of bad input, control characters smuggled into folder and branch names, the 80-character cut, and "imports no `child_process`". All 20 pass.

### 4. "render git:(main)" was not a glitch
The status line shows the folder name of the session's working directory. After a task the shell had been left in the HUD plugin's `src\render` folder, which sits inside the marketplace repo on `main`, so the line read `render git:(main)`. It was reproduced exactly with a test payload. **Finish tool work with a `cd` back to the project folder.**

### 5. The "Update available! Run: winget upgrade Anthropic.ClaudeCode" banner
It comes from running the old winget build. Measured on 2026-10-16: the running `claude.exe` was the winget 2.1.292, started the day before from a Windows Terminal process that predates the PATH fix, while the native 2.1.300 sat unused in `~\.local\bin`. New tabs in a running Windows Terminal inherit its old environment.

- **Fix:** close **every** Windows Terminal window, reopen it from the Start menu, then `claude --continue`. Check with `Get-Command claude | % Source`: it must end in `.local\bin\claude.exe`.
- **After that:** `winget uninstall Anthropic.ClaudeCode` removes the old copy so a stale shell can never launch it again.

## What to read first

| Path | What |
|---|---|
| `config/claude/claude-hud-config.json` | The live HUD config |
| `config/claude/hooks-tab-title.mjs` | The live tab-title hook |
| `config/powershell/Microsoft.PowerShell_profile.ps1` | The PowerShell 7 profile (missed in v1) |
| `memory/project_claude_code_rice.md` | The notes kept about this setup, updated |
| `backup/` | The HUD config before each change, and the previous hook |
| `tools/` | Test and render helpers (see below) |

### Tools
- `test-title.mjs`: the tab-title test suite. `node tools/test-title.mjs`.
- `render2.mjs`, `render-hud.mjs`, `mkpayload.mjs`, `variants.mjs`: render the status line through the real launcher with a synthetic payload, in several situations (cache warm, cold, expired, narrow window), and a set of candidate layouts using a throwaway git repo.
- `watch-visible-windows.ps1`, `watch-console-spawns.ps1`: log every new visible window or console process with its parent chain. They were used to trace a flashing console window to a scheduled task.
- `tab-title-branch.proto.mjs`: the first prototype of the branch title, which started `git`. Superseded by the version that reads `HEAD`.

Some scripts take a scratch folder as an argument or assume the paths of the machine they were written on.

## Not verified
- Whether Claude Code's live status-line payload carries `prompt_cache`. The HUD's source says it does and the renders with sample data are correct, but it was not observed from inside the session.
- How the `⎇` glyph looks in the tab bar.
- Everything above was checked headlessly (the real launcher with synthetic input, and the hook as a subprocess), not by looking at the screen.

## Roll back to v1-win
Copy `backup/claude-hud-config.before-dedupe-with-flightdeck.2026-10-16.json` over `~/.claude/plugins/claude-hud/config.json` and `backup/tab-title.before-branch.2026-10-16.mjs` over `~/.claude/hooks/tab-title.mjs`.
