# Rice Claude Code (mods + terminal) — Plan

## Context

Two research docs (`Downloads\claude-code-mod-research.md` and the private repo `KanaparthySaiSreekar/claude-code-mods-research`, read via `gh`) describe **Claude Mods** (launched 2026-10-01, v2.1.287): in-process JS/TS plugins that can draw panes, a band above the prompt, toasts, restyled spinner/rows. Both agree on the stack: one palette everywhere → built-in settings → one status line → a few vetted mods (one per surface) → hooks → analytics. Both warn mods are **unsandboxed** (see every prompt, env, secrets) and guards **fail open**.

User decisions: **go bigger** on mods, **claude-hud** status line, **also try a 2nd terminal** (Rio), **Claude-brand spinner verbs**. No sound/notification hooks requested.

### This machine (verified)
- Claude Code **2.1.292** (mods supported; 2.1.299 is current → `claude update` gives `$.ui.notify`/native notifs 2.1.295+).
- **Windows Terminal 1.24** + pwsh 7.6.6, JetBrainsMono NFM 11pt medium, custom WT scheme **"Claude"** (bg `#2B2A27`, fg `#F5E6D3`, orange `#D97757`, coral `#F28482`, gold `#FFD166`, …). User rejects slow prompt frameworks (starship/omp) — keep everything fast/native.
- `~/.claude/settings.json` today: `tui: fullscreen`, `theme: dark`, `agentPushNotifEnabled`, getlayers plugin. **No** statusLine, spinner config, custom theme, hooks, or mods.
- Node present; **no** bun/ffmpeg/Ghostty/kitty/Rio/tmux. VC++ runtime present.

### Corrections found while verifying the research (all 16 repos exist, active, none archived)
- **prismantis** hint cost is **~630 tokens/prompt** (report says ~190) → pick **skins** instead (hand-tested on Windows, ~130-token hint, `/skin hints off`). Only one transcript skin can run anyway.
- **image-view** in Windows Terminal = **half-block thumbnails**, real pictures only in kitty/Ghostty — or Rio with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`.
- **claude-pokemon-mod has no license** → skipped. naruto/galactic-battle are 2★ each → demo-only, optional.
- **claude-hud** on Windows needs only Node 18+ (already installed).
- **show-your-work** needs a kitty-graphics terminal + ffmpeg + Playwright → Rio demo profile only.
- Star counts for mods are host-repo stars; judged by code/activity instead.

## Approach (phased; each phase reversible and verified before the next)

### Phase 0 — Safety net
1. Back up to `C:\Users\Kasasree\Projects\claude-rice\backup\`: `~/.claude/settings.json`, WT `settings.json`.
2. `claude update` (→ ≥2.1.299). Re-read `.claude-plugin/types/` that Claude Code generates locally — trust it over any doc page.
3. Confirm built-ins: `/plugin` shows built-in mods (diff, etc.). Note `claude --safe-mode` = vanilla escape hatch.

### Phase 1 — Palette & Claude Code theme (zero third-party code)
- Create `~/.claude/themes/claude.json`: `base: "dark"`, overrides mapped from the WT "Claude" scheme (accent `claude` → `#D97757`, error → coral `#F28482`, success → sage `#A3B18A`, warning → gold `#FFD166`, shimmer/subagent colors from the scheme's brights). Get the exact token list from `/theme → New custom theme…` (60+ tokens; hot-reloads). Select it via `/theme` and persist in `settings.json`.

### Phase 2 — First-party `settings.json` (merge, don't overwrite existing keys)
- `spinnerVerbs` (replace mode, dry Claude-brand verbs), `spinnerTipsOverride` (`label: "Rice"`, `excludeDefault: true`, a few tips), `maxProseWidth: 100`, `timeFormat`, `showTurnDuration`. Keep `tui: fullscreen`.
- Skip `preferredNotifChannel: "ghostty"` (n/a on Windows) and sound hooks (not requested).

### Phase 3 — Status line: claude-hud (`jarrodwatts/claude-hud`, MIT, 28.5k★, pushed 2026-10-13)
- Vet first: read source for network/exec use (README says `--extra-cmd` is gated behind `CLAUDE_HUD_ALLOW_EXTRA_CMD=1`; leave unset).
- `/plugin marketplace add jarrodwatts/claude-hud` → `/plugin install claude-hud` → `/claude-hud:setup` (writes `statusLine` into settings.json) → `/claude-hud:configure`: two rows (identity: model/effort/project+branch; health: context bar, 5h/7d usage with `usagePace`, tools/agents/todos), colors from the Claude palette, `refreshInterval` ~10 s.
- Verify speed: `Measure-Command` the status command with sample stdin JSON (target well under ~150 ms; user dislikes slow). Keep ASCII fallback for Nerd glyphs (they can render blank inside Claude Code, #49270).

### Phase 4 — Mods (go bigger, one occupant per surface)
**Vetting loop for every mod** (non-negotiable): clone to its **own empty dir** (not under the scripts dir) → `claude plugin validate <dir>` → read `hooks:`/`calls:` lines (cosmetic mod should not need `$.http`, `$.process`, `$.env`, `$.fs.read`) → read the source → copy the reviewed commit into a **personal local marketplace** `C:\Users\Kasasree\Projects\claude-mods-local\` (git repo, `.claude-plugin/marketplace.json`, README listing pinned SHAs) → install from there with `--scope user`; leave third-party marketplace auto-update off.

| Surface | Mod | Why / note |
|---|---|---|
| Band above prompt | **token-weather** (`anthropics/claude-code-playground`, Apache-2.0) | Context "forecast" ☀→↯ + sparkline; smallest, official sample; reads `$.session.usage()` only |
| Right pane | **flightdeck** (`scasella/claude-flightdeck`, MIT) | Read-only dashboard; README: no network/process/file calls; ≥110 cols docked, auto-opens ≥144 |
| Transcript skin | **skins** (`hellosverre/claude-skins`, MIT) | 15 themes via `/skin`, pick the Claude-matching one; its one network call is a daily version check (check/disable); `/skin hints off` |
| File sidebar | **filetree** (`data-goblin/claude-code-filetree`, MIT) | Windows CI-tested; may fight flightdeck for the right sidebar → test; if it clashes keep it toggle-only |
| Paste thumbnails | **image-view** (`jarrodwatts/claude-image-view`, MIT) | Half-blocks in WT, real in Rio; Windows PNG pastes only |
| Safety demo | **blast-radius** (playground) | Freezes `rm -rf`/force-push with Proceed/Cancel; it's a net, not a guard (fails open) |
| Discovery | **mod-store** (`hellosverre/mod-store`) | `/mods` shows each mod's access before install — use for later browsing |
| Personal | **needs-you** (authored via built-in `plugin-authoring` skill) | Project-aware terminal title + native notification: *which* session needs you and *why* (permission vs done) — fills the gap both reports name. Copy out of `~/.claude/dev-mods/` into the local marketplace. User can redirect to another idea. |

Install order: token-weather → flightdeck → skins → image-view → filetree → blast-radius → personal. **Add one at a time and re-check `/plugin`, band/pane layout, and a normal turn** before the next. Cap daily-driver band mods at 1–2; drop anything that overdraws Claude Code's task list.
Skipped: prismantis (hint cost), pokemon (no license), terminal-browser (Windows only via WSL), companions naruto/galactic-battle (demo-only).

### Phase 5 — Rio demo profile (pixels: real images, Doom)
Windows Terminal stays the daily driver. Rio (`raphamorim.rio` v0.5.28 on winget) is the demo terminal.
1. `winget install -e --id raphamorim.rio`.
2. **Elevated step (user runs it; I'll write `setup-rio.ps1` into `Projects\claude-rice\`)**: download Microsoft ConPTY nuget package; copy `conpty.dll` **and** `OpenConsole.exe` next to `rio.exe` in `C:\Program Files\Rio` (both required or pictures are stripped).
3. `%LOCALAPPDATA%\rio\config.toml`: Claude palette (from WT scheme), JetBrainsMono NFM, and `env-vars = ["CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1"]` — **in Rio only** (set elsewhere it prints stray characters).
4. In Rio: install **intermission** (`jarrodwatts/intermission`, MIT) and optionally **show-your-work** (needs `winget install Gyan.FFmpeg` + Playwright; Rio support unverified by its README — treat as experiment). Test real pictures with an image-view paste.

### Phase 6 — Hygiene & docs
- Record pinned SHAs + install/rollback commands in `claude-mods-local\README.md`.
- Update memory `project_terminal_setup.md` (Claude Code rice section: theme file, statusline, mods list, Rio profile, rollback). **Not** the Omen CLOCKING/PRE-CLEAN docs (those are hardware tuning only).
- Note for future: both reports say mods change per release; re-validate after each `claude update`.

## Critical files
- `C:\Users\Kasasree\.claude\settings.json` (merge: theme, spinner*, statusLine, enabled plugins)
- `C:\Users\Kasasree\.claude\themes\claude.json` (new)
- `C:\Users\Kasasree\Projects\claude-mods-local\` (new git repo: marketplace + pinned mods + README)
- `C:\Users\Kasasree\Projects\claude-rice\` (backups, `setup-rio.ps1`)
- `%LOCALAPPDATA%\rio\config.toml` (new, Rio only)
- Reuse: WT scheme "Claude" in `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json` as the single palette source; `plugin-authoring` skill for the personal mod.

## Verification
1. `claude --version` ≥ 2.1.299; `/plugin` lists "N mods active"; each mod passed `claude plugin validate` with `calls:` reviewed.
2. Theme: colors visibly match WT scheme; edit `claude.json` and see hot-reload.
3. Status line: pipe sample payload JSON into the status command; `Measure-Command` latency; send a real prompt and confirm both rows + usage bars render; confirm it survives `refreshInterval`.
4. Layout: in a ≥144-col maximized WT window, flightdeck auto-opens; band shows token-weather without hiding the task list; run a subagent turn to see flightdeck cards.
5. Blast-radius: ask Claude to `rm -rf` a throwaway temp dir → Proceed/Cancel appears.
6. image-view: paste a PNG → half-block thumbnail in WT, real picture in Rio.
7. `claude --safe-mode` launches clean (rollback proof); `disableAllHooks` NOT used (it also kills the status line).
8. Rio: intermission pane opens and hands control back when Claude finishes.

## Rollback
Restore `settings.json` from backup; `claude plugin uninstall <name>` per mod; delete `~/.claude/themes/claude.json`; `winget uninstall raphamorim.rio`; remove local marketplace dir. `claude --safe-mode` disables all non-built-in mods for any single session.

## Open risks (accepted)
- Mods API is ~2 weeks old and moving (v2.1.290 docs vs 2.1.299 shipping); breakage after updates is likely → pinned local marketplace + re-validate.
- Everything in Phase 4 runs unsandboxed with the user's permissions; `skipDangerousModePermissionPrompt` is already on, so a bad mod has an easy path — the vetting loop is what protects it.
- Windows has no Ghostty/kitty; pixel features exist only in Rio and are less polished than on macOS/Linux.
