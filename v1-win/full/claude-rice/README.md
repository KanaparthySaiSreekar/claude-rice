# claude-rice

Working folder for the Claude Code mods/ricing setup (2026-10-15). The pinned, reviewed plugins live in the sibling repo
`..\claude-mods-local` (see its README for provenance, local patches, and rollback).

| Path | What |
|---|---|
| `backup\` | `settings.json` (Claude Code) and Windows Terminal `settings.json` from *before* the rice. Restore by copying back. |
| `setup-rio.ps1` | **Run once, elevated.** Copies a hash- and signature-verified Microsoft ConPTY (conpty.dll + OpenConsole.exe) next to `rio.exe` so Rio can show real images. |
| `staging\` | Fresh clones of every upstream repo that was reviewed (untrusted third-party code: read, never run from here). Safe to delete. |

## Not done yet (needs the user)

1. Restart Claude Code once: `~/.claude/themes/` did not exist when the session started, so `custom:claude` only loads on restart.
2. Open an **elevated** PowerShell and run `& "$HOME\Projects\claude-rice\setup-rio.ps1"`, then open Rio and run `claude`.

## Changes made after first feedback (2026-10-15, later)

- token-weather disabled (stale 0%, duplicate gauge); flightdeck no longer opens on start (`/flightdeck` on demand).
- Claude Code moved to the native 2.1.300 build (`~\.local\bin`, prepended to User PATH; old PATH saved in `backup\`). Winget copy left installed.
- Status line: tried claude-powerline's bordered TUI panel (5 rows), then went back to claude-hud in `compact` layout, one line,
  no bars, no tools/agents/todos rows (`[Sonnet 5.5] 29% | folder git:(main) | 5h: 15% (3h 57m) | 7d: 89% ▲ (20h 27m)`).
  claude-powerline stays pinned in `claude-mods-local\tools\` but is unused. HUD config backup: `backup\claude-hud-config.before-compact.*.json`.
- Skin `claude-warm` applied via the skins mod (stored by the mod, not in settings.json); Windows Terminal got padding, grayscale text, 95% acrylic, orange tab.

## Config touched

- `~/.claude/settings.json`: theme, spinnerVerbs, spinnerTipsOverride, maxProseWidth, statusLine, plugins, `env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE`, 3 hooks.
- `~/.claude/themes/claude.json`, `~/.claude/plugins/claude-hud/config.json`, `~/.claude/hooks/tab-title.mjs`.
- `%LOCALAPPDATA%\rio\config.toml` (Rio only; sets `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`).

## Rollback

`claude --safe-mode` = vanilla session. Full undo: copy `backup\claude-settings.*.json` over `~/.claude/settings.json`, delete
`~/.claude/themes/claude.json`, `~/.claude/hooks/`, `~/.claude/plugins/claude-hud/`, `winget uninstall raphamorim.rio`.
