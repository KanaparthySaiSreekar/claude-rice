# kasasree-mods — personal pinned Claude Code marketplace

Every plugin here was **source-reviewed and copied at a recorded commit**. Nothing auto-updates.
Mods are unsandboxed (they see every prompt, env and tool call), so the rule is: review → pin → install from here.

Registered with: `claude plugin marketplace add C:\Users\Kasasree\Projects\claude-mods-local --scope user`

## Provenance (reviewed 2026-10-15, Claude Code 2.1.292)

| Plugin | Upstream | Pinned commit | License | Reach seen by `claude plugin validate` |
|---|---|---|---|---|
| claude-hud | jarrodwatts/claude-hud | `02d73c416b52b4e510a9be004fca469f961cd5bc` | MIT | statusline command, no network; spawns `git`, `jj`, `taskkill`; `--extra-cmd` gated off |
| token-weather | anthropics/claude-code-playground (`claude-code/mods/token-weather`) | `569c5283d9a0a7ee7938df85bb32e4f48cbb8c86` | Apache-2.0 | `$.session.usage`, `$.ui.*` only |
| flightdeck | scasella/claude-flightdeck | `6150b9f40b0a36e42c22d39f03ddb81aaefe1844` | MIT | `$.state`, `$.command`, `$.ui`, `$.session.usage`; no fs/process/network/env |
| skins | hellosverre/claude-skins | `e6ca8ea0a531cdab0cfc2260d7a5e97a45f17190` | MIT | broad: `$.env.get` (terminal-capability vars only), `$.fs.read`, `$.process.run` (OS dark-mode probe), `$.http.fetch` (patched out), `$.tool.register` (schema-constrained `design` tool), `prompt.compose` (static ~130-token chart hint) |
| image-view | jarrodwatts/claude-image-view | `370b8e7bc0708bebe9762e63534f7ca18bc3e802` | MIT | `$.fs.*`, `$.env.get` (terminal vars), `$.process.run` (`id -u`, Unix only) |
| filetree | data-goblin/claude-code-filetree | `44d4a6293d517028abe303b21715b126bf46fbec` | MIT | `$.fs.*`, `$.process.run` (git, du, find, rm of its own marker files), `$.env.get` (HOME/EDITOR/SSH_*); no network |

### Tools (not Claude plugins): `tools/`

| Tool | Upstream | Pinned artifact | License | Review |
|---|---|---|---|---|
| claude-powerline | Owloops/claude-powerline | **npm tarball** `@owloops/claude-powerline@1.32.3` (sha1 `3d395b6e08fa9970795520b6ebb4879c62c6c0f9`, integrity `sha512-Ez7ox9hwZBThEmJNVuMaEp0nEaLLq5dFX5aQ0kLJJ4y/F5KkhOZER45qU8mEKF2ABUVUnvPV59LIV32ckopYKA==`); git ref reviewed `aea5a5cff8cdb34b45788b495e12c409f5429e8c` | MIT | zero runtime deps; no credential/OAuth access; local `git`/terminal-width probes only; one network call (fetches `pricing.json` data from raw.githubusercontent.com) is reachable only through cost segments, which are **not enabled** |

The git repo has no built code (it compiles at publish time), so the runnable artifact is the npm tarball; `dist/`, `src/`,
`bin/`, `package.json`, `LICENSE` are copied verbatim into `tools/claude-powerline/`. It runs from this path, never via `npx`.
Wired in by `~/.claude/plugins/claude-powerline/statusline.cmd` (cmd.exe shim, same reason as claude-hud) and configured by
`~/.claude/claude-powerline.json`. Keep `autocompactBuffer: 0` so the context % equals Claude Code's own `used_percentage`.

**Status: installed but NOT the active status line.** It was used briefly (5-row bordered TUI panel), then replaced by claude-hud's
compact one-liner because the user wanted a single line with percentages only. claude-powerline's text symbols are mangled in the
minified bundle (so `ctx`/`5h`/`wk` labels can't be patched without a rebuild), while claude-hud has real labels and is faster
(~155 ms vs ~230 ms). To switch back: set `statusLine.command` in `~/.claude/settings.json` to
`exec "$HOME/.claude/plugins/claude-powerline/statusline.cmd"`. Safe to delete `tools/claude-powerline` if it stays unused.

### Local patches (diff against upstream)

- **token-weather** `hooks/token-weather.mjs`: the `AbovePrompt` handler now `await next(e)` first and stacks its line above the
  result. Upstream returned its own band without calling `next`, which replaces everything other mods (image-view, skins) or
  Claude Code itself draw above the prompt (the "band crowding" pitfall both research reports warn about).
- **skins** `hooks/register.tsx`: `checkForUpdate()` returns `false` immediately (removes the daily GET to
  `raw.githubusercontent.com/hellosverre/claude-skins/main/.claude-plugin/plugin.json`); `askForStar()` returns immediately
  (removes the star-request toast). The validator still lists `$.http.fetch` because it is static analysis; the call is unreachable.

### Reviewed and rejected

- **blast-radius** (Anthropic sample): shells out to `bash -c` and `sleep`, with no Windows branch. On native Windows `bash`,
  `sleep` (PowerShell alias only) and `sh` are not on PATH, so the guard would fail open and give false confidence. Not installed.
- **intermission** (jarrodwatts, MIT; reviewed at `8978f61efc890c13dcbed2d78ced224a6715feb8`): held back, not installed. On first
  run it downloads a ~40 MB native engine tarball from the author's GitHub release with **no hash or signature check**,
  extracts it and spawns it (an Odamex client that connects to a third-party multiplayer server). The JavaScript can be pinned
  here but the executable cannot, which is the "code fetched after review" pattern. To accept that risk knowingly: install it
  only in Rio, and pre-place a binary whose hash you recorded so the in-mod download is skipped.
- **show-your-work**: not evaluated or installed (needs ffmpeg + Playwright + a kitty-graphics terminal; Rio support unconfirmed).
- **prismantis**: injects ~630 tokens of hints per prompt (the research report said ~190); only one transcript skin can run anyway.
- **claude-pokemon-mod**: no license.
- **terminal-browser**: Windows only via WSL (not installed here).

### Known note on claude-hud

Claude Code 2.1.292's validator rejects third-party plugin names starting with `claude-` ("reserved"), so `claude plugin validate`
reports an error for claude-hud even though install works. The source review above is what matters; the lint is a naming policy.
The HUD launcher (`~/.claude/plugins/claude-hud/statusline.mjs`) imports the **highest-versioned** `claude-hud` found under
`~/.claude/plugins/cache/*/`, so do not add another marketplace that ships a `claude-hud` plugin.

## Tamper check

Plugins install in **directory mode**: Claude Code reads them live from `plugins/` here, not from a copy in its cache. So the git
history is the pin. Run `git -C C:\Users\Kasasree\Projects\claude-mods-local status --short` — it must print nothing, otherwise
something changed a reviewed file after review.

## Updating a plugin

1. Re-clone upstream into a fresh empty dir (never inside this repo), check out the new commit.
2. `claude plugin validate <dir>` and compare the `hooks:` / `calls:` lines against the table above. Any new `$.http`, `$.process`,
   `$.env`, `$.fs.read` is a reason to read the diff before copying.
3. Copy into `plugins/<name>` (without `.git`), re-apply local patches, update the pinned SHA here, commit, then
   `claude plugin update <name>@kasasree-mods`.

## Rollback

`claude plugin uninstall <name>@kasasree-mods` per plugin, or `claude --safe-mode` for one vanilla session (does not touch built-in mods).
Backups of settings from before this setup: `C:\Users\Kasasree\Projects\claude-rice\backup\`.
