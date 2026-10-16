# v1-win / full: the complete, unredacted mirror

Everything that makes up the v1-win setup, copied as-is on **2026-10-16**. The curated files one level up (`config/`, `patches/`, `marketplace/`, `scripts/`) are the readable summary; this folder is the whole thing.

> **Keep this repo private.** These are unredacted copies of your real config. A scan for tokens, keys and credential files found nothing, but `settings.json` and the install state contain your username and local paths.

## What is here

| Path | What it is |
|---|---|
| `claude-home/settings.json` | The full `~/.claude/settings.json`, including keys left out of the excerpt (`model`, `modelSettings`, `skipDangerousModePermissionPrompt`, `agentPushNotifEnabled`, the getlayers plugin) |
| `claude-home/settings.json.bak.20261015T150854` | Claude Code's own automatic backup, taken mid-setup on 2026-10-15 |
| `claude-home/themes/claude.json` | The `custom:claude` theme |
| `claude-home/hooks/tab-title.mjs` | The tab-title hook |
| `claude-home/claude-powerline.json`, `claude-home/plugins/claude-powerline/statusline.cmd` | claude-powerline config and shim (installed, **not** the active status line) |
| `claude-home/plugins/claude-hud/` | claude-hud `config.json`, the `statusline.cmd` shim and the `statusline.mjs` launcher |
| `claude-home/plugins/installed_plugins.json`, `known_marketplaces.json` | What Claude Code recorded as installed, with versions and install commits |
| `claude-home/plans/` | The approved plan the setup was built from |
| `memory/` | The two memory notes about this work (`project_claude_code_rice.md`, `feedback_reply_format.md`) |
| `windows-terminal/settings.json` | The full live Windows Terminal settings |
| `claude-mods-local/` | The whole pinned marketplace: all six plugins' source and `tools/claude-powerline` |
| `claude-mods-local.history.bundle` | The marketplace's git history (5 commits). Restore with `git clone claude-mods-local.history.bundle claude-mods-local` |
| `claude-mods-local.GIT-LOG.txt` | The same history as readable text |
| `claude-rice/` | The working folder: README, `backup/` (settings, Windows Terminal, PATH, HUD config, and the Task Scheduler export from before the pipeline fix), `setup-rio.ps1`, and `staging/` (the fresh upstream clones that were reviewed) |

### Installed versions, from `installed_plugins.json`

| Plugin | Version |
|---|---|
| claude-hud | 0.11.2 |
| flightdeck | 0.4.0 |
| skins | 0.5.7 |
| image-view | 0.2.0 |
| filetree | 0.2.26 |
| token-weather | 0.1.0 (disabled) |

The install records point at marketplace commit `c1e8a83`. Plugins from a directory marketplace are read live from the working tree, so what actually runs is whatever the marketplace's `HEAD` is (`0994545` at the checkpoint).

### About `claude-rice/staging/`

- **Redundant by design.** The six pinned plugins there are byte-identical to the copies in `claude-mods-local/plugins/` except the two files covered by `patches/`, so they hold the unpatched originals.
- **Also kept:** `claude-code-playground` (the full Anthropic sample repo, including blast-radius and replay-theater), `intermission` (reviewed and held back), `claude-powerline-npm` (the pinned tarball) and `conpty` (package metadata, the header and three import `.lib` files; the executables, DLLs and the `.nupkg` are left out, see below).
- **Untrusted code.** Read it, do not run it from here. Several folders carry their own `.gitignore`; the files are committed anyway.

## What is deliberately not here

| Left out | Why |
|---|---|
| `~/.claude/.credentials.json` | Your Claude login credentials |
| `~/.claude.json` and `~/.claude/backups/.claude.json.backup.*` | Account state, project list and MCP configuration |
| `~/.claude/history.jsonl`, `projects/` transcripts (including the session that built this), `sessions/`, `session-env/`, `shell-snapshots/`, `paste-cache/`, `file-history/`, `jobs/`, `state/`, `cache/`, `daemon.*`, `stats-cache.json`, `mcp-needs-auth-cache.json` | Private history and runtime state, not setup |
| `~/.claude/plugins/cache/`, `marketplaces/`, `store/`, `synced/`, `plugin-catalog-cache.json`, `plugin-directory-cache-v2.json` | Regenerable copies and caches |
| `~/.claude/skills/synced/` | Claude's own built-in skills |
| `~/.claude/powerline/` | Runtime state (locks, usage) of the unused powerline |
| The other three files in `~/.claude/plans/` and the other memory notes (`MEMORY.md`, Omen tuning, terminal setup, dev environment, CachyOS) | Other projects |
| `conpty.dll`, `OpenConsole.exe` and the ConPTY NuGet package (`staging/conpty`) | Microsoft binaries. `scripts/setup-rio.ps1` downloads them and checks their SHA-256 and Microsoft signature, so the repo does not need to carry them |
| `.git` folders of the `staging/` clones | They can't nest in this repo. Re-clone at the commits in `marketplace/README.md`. The marketplace's own history is included as a bundle |
| The trading-terminal Task Scheduler change | A different project with its own repo and uncommitted work from other sessions. The pre-change task export is in `claude-rice/backup/` |

If you want any of these added, say which. The credentials file and `.claude.json` are the two that should not go in a repo at all.
