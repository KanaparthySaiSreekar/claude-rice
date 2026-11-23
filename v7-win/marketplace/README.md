# kasasree-mods — personal pinned Claude Code marketplace

Every plugin here was **source-reviewed and copied at a recorded commit**. Nothing auto-updates.
Mods are unsandboxed (they see every prompt, env and tool call), so the rule is: review → pin → install from here.

Registered with: `claude plugin marketplace add C:\Users\Kasasree\Projects\claude-mods-local --scope user`

## Provenance (reviewed 2026-10-15, Claude Code 2.1.292)

| Plugin | Upstream | Pinned commit | License | Reach seen by `claude plugin validate` |
|---|---|---|---|---|
| claude-hud | jarrodwatts/claude-hud | `02d73c416b52b4e510a9be004fca469f961cd5bc` | MIT | statusline command, no network; spawns `git`, `jj`, `taskkill`; `--extra-cmd` gated off |
| token-weather | anthropics/claude-code-playground (`claude-code/mods/token-weather`) | `569c5283d9a0a7ee7938df85bb32e4f48cbb8c86` | Apache-2.0 | `$.session.usage`, `$.ui.*` only |
| flightdeck | scasella/claude-flightdeck 0.6.2 (updated 2026-11-23, Claude Code 2.1.330; was 0.4.0 at `6150b9f`) | `626cc0b46d417f81bbff9f5ba3b49abaf8912a85` | MIT | `$.state`, `$.command`, `$.ui` (incl. `$.ui.log`, `ui.fault`), `$.session.usage`, `$.session.version`; no fs/process/network/env. Unpatched |
| skins | hellosverre/claude-skins | `e6ca8ea0a531cdab0cfc2260d7a5e97a45f17190` | MIT | broad: `$.env.get` (terminal-capability vars only), `$.fs.read`, `$.process.run` (OS dark-mode probe), `$.http.fetch` (patched out), `$.tool.register` (schema-constrained `design` tool), `prompt.compose` (static ~130-token chart hint) |
| image-view | jarrodwatts/claude-image-view | `370b8e7bc0708bebe9762e63534f7ca18bc3e802` | MIT | `$.fs.*`, `$.env.get` (terminal vars), `$.process.run` (`id -u`, Unix only) |
| filetree | data-goblin/claude-code-filetree | `44d4a6293d517028abe303b21715b126bf46fbec` | MIT | `$.fs.*`, `$.process.run` (git, du, find, rm of its own marker files), `$.env.get` (HOME/EDITOR/SSH_*); no network |
| prismantis | NahumLitvin/prismantis (v0.25.1, reviewed 2026-10-17, Claude Code 2.1.301) | `0d93494caff9c2e31fc9b69261d3e9d329803dab` | MIT | `$.env.get` (terminal detection), `$.fs.read`/`stat` (linked images and LaTeX output, kitty/Ghostty only), `$.process.run` (`powershell.exe` for the HTML table copy, `ratex-render` only with `latex` on), `$.config.set` (its own options), `$.session.*`; no network; `prompt.submit` adds ~630 tokens of hints unless `diagramHints` is off (v3 turns it off) |
| firstmate-calm | kunchenguid/firstmate `.claude/mods/firstmate-calm` (plugin `fm`, reviewed 2026-10-17) | `d20196ae49fa96829d470cebc8fa1ac957162f41` | MIT | **fork** (see local patches): `$.store`, `$.clock.every`, `$.command`, `$.session.messages`, `$.ui` only; no fs, env, process or network. Upstream also read `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`/`FM_*`, wrote `config/calm` and polled a Firstmate state folder |
| context-bar, usage-meter | hamzafer/claude-code-mods `mods/context-bar` 0.1.3, `mods/usage-meter` 0.1.1 (reviewed 2026-10-17) | `77f1ebcd5d228db98ceecdc7ca9ec063287b9f07` | MIT | `$.session.usage`, `session.measure`, `$.state`, `$.store`, `$.command` (context-bar), `$.clock` and `$.ui.toast` (usage-meter); reads one optional file, `~/.claude/claude-code-mods/bands.json` (`$.env.get` HOME/CLAUDE_CONFIG_DIR to find it); no network, processes or writes |
| aurora-bridge | **first-party** (written here, 2026-10-16; not upstream code) | this repo's own history | MIT | `$.state` (one atom), `$.command` (`/bridge`), `$.ui` (open, resolve, blit, invalidate), `$.clock.every` (animation tick); observes `turn.*`, `tool.call`, `tool.check`, `agent.spawn` and hands every event on unchanged; no fs/process/network/env |
| cctop | tomstagl/cctop `plugin/` 0.10.0 (reviewed 2026-10-17, Claude Code 2.1.302) | `6ceafc34a972f4e58d5e53b1c69f80e2a9759d41` | MIT | `$.session.*`, `$.store`, `$.clock`, `$.ui`, `$.prompt.fill` (a button fills the prompt, never sends); `$.process.run` only of the `cctop` companion binary (a local Windows build since 2026-11-02, see Tools below); `$.fs.write` of its marker files under `~/.cctop/pane/`; ships two skills (`cctop`, `cctop-insights`); no network or model calls |
| cockpit | drkokorev/cockpit-for-claude `plugins/cockpit` 1.0.2 (reviewed 2026-10-17) | `8960ed87ed3b39d7236aaa17a1e1d26c7d154461` | MIT | `$.state`, `$.store`, `$.session.*`, `$.agent.list`, `$.clock`, `$.ui` (incl. `$.ui.ask`: its risky-command guard, off by default here (local patch), asks Run/Block before a matching Bash call); `$.process.run` of read-only `git` (diff, ls-files, rev-parse); `$.fs.read` for the file view, `$.fs.write` only on `/cockpit-export` (`.cockpit/`); `$.command.run` only for its Compact button; no network or model calls |
| paneline | markneonin/paneline 0.4.1 (reviewed 2026-10-17) | `fd20c8cb91f18d2c3cc7c8876232084969ead951` | MIT | `$.state`, `$.store`, `$.session.*`, `$.agent.list`, `$.config.list`, `$.command.list`/`run` (MCP buttons, on press), `$.prompt.read`/`fill`, `$.fs.read`/`exists`, `$.env.get` HOME; `$.process.run` of read-only `git` and `grep` on the transcript (no `grep` on Windows PATH: caught, the agent colour falls back); restyles the chat unless `chat` is off (local patch); no network or model calls |
| secret-box | ray-amjad/claude-code-mods `plugins/secret-box` 0.5.14 (updated 2026-11-23, Claude Code 2.1.330; was 0.5.3 at `6db48a3`) | `5d6bd156c7586c4b030157a1a2e8b7214b238501` | MIT | `$.tool.register` (`request_secret`, also on `session.attach` for the desktop app), `$.command` (`/secret-box`, local patch), `$.ui`, `$.session.*` (incl. `root`: the box writes `.env` at the project root), `$.fs.*` (`.env` files and their `.gitignore`), `$.env.get` (`OS`, `CDPATH`; `HOME`, then `USERPROFILE` (local patch), only for a commit naming `~`, `$HOME` or a bare `cd`); `$.process.run` of read-only `git` (`rev-parse`, `diff --cached`, `ls-files`, `check-ignore`) and the box's wait command |

### Companion binary (not a plugin): `cctop`

Installed as `~\.local\bin\cctop.exe`. Upstream publishes no Windows build (v0.9.1: macOS and Linux only), so it is built from the
same pin as the plugin, `6ceafc3`, on the `windows` branch of `C:\Users\Kasasree\Projects\claude-rice\cctop-windows` (outside this
repo). The Windows code is `src/win.rs` plus `cfg` switches at each call site. `cargo test`: 450/450, with one intermittent failure
in `otel` (a socket read under full-suite load; 0/45 alone; the pane does not use it). Rebuild:

```
cd C:\Users\Kasasree\Projects\claude-rice\cctop-windows
cargo build --release
copy target\release\cctop.exe %USERPROFILE%\.local\bin\
```

- **Never `cargo install cctop`.** That crate name belongs to an unrelated program (flolep2607/cctop), and `~\.cargo\bin` comes
  before `~\.local\bin` on PATH, so it would shadow this build.
- **Never run `cctop install` here.** Tested on a copy of `settings.json`: the shim cannot run the `exec` the status line command
  starts with, so the status line goes blank with exit 0; serde_json re-sorts `enabledPlugins`, whose key order is the mods' load
  order; and 22 hook events start running `cctop.exe`. Without it, `cctop query` has no status-line rate limits, hook tool timings
  or permission waits.
- **Toolchain:** the `stable-x86_64-pc-windows-gnullvm` Rust host with `rust-lld`, set in `~\.cargo\config.toml`, so no Visual Studio
  or MinGW. (The plain `gnu` host fails: its `dlltool` needs an `as.exe` it does not ship.) `~\.cargo\windows-import-libs` holds seven
  import libraries `winapi` asks for, copied from the `winapi-x86_64-pc-windows-gnu` crate.
- **Review, 2026-11-02, Claude Code 2.1.316: reach only, not line by line** (54k lines of Rust; the parts patched were read). No HTTP
  client in its dependencies; the only socket code is an opt-in OTLP listener that refuses non-loopback addresses. Spawns `git`,
  `claude --version`, `clip`, `notify-send` (alerts, absent here), `tmux`/`ps` (inside tmux or `cctop pane status` only, absent here)
  and itself. Writes `settings.json` only through `cctop install`.
- **Not working on Windows:** the TUI's "send to session" key (`S`) returns an error, because sessions here listen on a named pipe and
  injecting into a live session was left untested; `cctop split` finds no terminal to split in (it prints the manual command).
  **Not tested:** the interactive TUI (`cctop run`), and the docked pane as drawn at a real terminal.

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

- **skins** `hooks/rows.tsx` and `hooks/skin.ts` (v2, 2026-10-16): with `rail` on, the rail glyph and its branch (`┣━`) are
  drawn at the start of the node's own row instead of in a separate `┃` connector row above it, so a tool call costs one row
  (`┣━● Run 1`) instead of two, and consecutive rows stack their `┣` into one unbroken vertical line. Adds `icons.stub`
  (`┣━`, or `|-` in ASCII). The old `railLine` helper stays in the file but is no longer drawn. Exported as
  `skins-rail-on-the-node-row.patch` in the research repo's `v2-win/patches/`.

- **skins** `hooks/prose.tsx` and `hooks/rows.tsx` (v2.2, 2026-10-17): detail colour. Bold text takes the `run` slot (was plain `fg`
  in bold weight), a bullet's mark takes `user` (was `muted`), and a table's header row takes `user` (was `fg`). Exported as
  `skins-bold-bullets-table-headers.patch` in the research repo's `v2-win/patches/`.
- **skins tests** (`tests/rows.test.tsx`, 2026-10-17): `claude plugin test skins` runs 220 tests and all pass. Four upstream
  tests described behaviour the local patches change on purpose, and were updated to test the patched behaviour instead (each is
  marked `LOCAL PATCH`): three looked for the separate `┃` rail row or the `●─` node shape (a Bash node, the error and running
  marks, `/skin calm off` restoring the rail) and now look for `┣━● Bash`, `┣━✕ Read`, `┣━○ Bash` and `┣━`; one expected the daily
  update check's fetch and toast and now checks that a session start makes no fetch and shows no toast.

- **prismantis** (v3, 2026-10-17; commits `47e688c`, `ca14801` on top of the unmodified pin `c31aea9`): `hooks/presets.ts` gains `ember`, `amber` and
  `crimson` presets generated from the rice palettes (research repo `v3-win/tools/presets.mjs`); `headingStyle: "bar"` draws a `▍` before H1/H2
  (`hooks/render.tsx`, `hooks/theme.ts`, `plugin.json`); a preset may carry optional `alertNote`...`alertCaution` colours, which the rice presets do
  (upstream draws alerts in named blue/green/magenta). Tests: `tests/rice.test.tsx` added, contrast test covers the new presets, and
  "every preset defines every token" allows the alert keys (marked `LOCAL PATCH`). `claude plugin test`: 551/551. Exported as
  `v3-win/patches/prismantis-rice.patch` in the research repo.

- **firstmate-calm** (v4, 2026-10-17; `2101a3e`, `4507469` on the unmodified pin `0a81e92`): `hooks/register.ts` rewritten (active without the
  pre-launch env opt-in; `/calm` choice in `$.store`; no fleet polling or doorbell reads; spinner word beside the boat), sail glyphs
  `U+E0BA`/`U+E0B8` (upstream's `U+25FF`/`U+25E3` are not in JetBrainsMono NFM), a `palette` option, plugin renamed `fm` -> `firstmate-calm`.
  Must load **before** skins (`enabledPlugins` key order is the load order; v4's apply does it). 26/26 tests. Upstream's own suite
  fails 39/51 on Windows unmodified (POSIX-keyed fixture paths). Patch: `v4-win/patches/firstmate-calm-rice.patch`.
- **skins** `hooks/prose.tsx` (v4, 2026-10-17, `8fedaa6`): alert bodies go through the skin's own blocks instead of the engine's
  Markdown, whose inline code was a fixed lavender. New `LOCAL PATCH` test; 221/221. Patch: `v4-win/patches/skins-alert-body.patch`.

- **context-bar, usage-meter** (v5, 2026-10-17; `5220f94`, `7c997a8` on the unmodified pin `0464dcd`): `palette` options (upstream: Tokyo Night
  category colours and named green/yellow/red), context-bar `style: line` + `maxWidth`, usage-meter ramp-graded bars, `◔` for `⏱`
  (not in the font), and `join: on` (usage-meter fits its row beside context-bar's line; it must load first). Test fixtures normalise
  `C:...` paths (upstream failed 2 and 1 tests on Windows). 26/26 and 20/20. Patches: `v5-win/patches/`.

- **mindful-breath** (v6, 2026-10-17; `0ba52b3` on the unmodified pin `b3b1777` of halluton/Mindful-Claude `411c9c4`, MIT): renamed from
  mindful-claude, palette glow (`hooks/breath/glow.ts`), `rows` 3-9, `◆` for `✦`, tests moved from `bun:test` to `claude-code/testing` (none ran
  before). Reach: `$.store`, `$.command`, `$.clock`, `$.ui` only. 38/38. Patch: `v6-win/patches/mindful-breath-rice.patch`.

- **paneline, cctop** (v7, 2026-10-17; on the unmodified pin `cd510b1`): paneline gets a `chat` option (default on, as upstream); off, it
  registers only its pane and tracking, so the Ember skin keeps the transcript and the band. New `tests/chat-option.test.tsx` (3/3);
  the suite fails the same 28 tests on Windows as unmodified upstream (POSIX path fixtures in the Skills, MCP and Files tabs; one
  5 s timeout), so 848/876; clear-isolation X1 runs close to its 5 s limit and timed out once under full-suite load (passes alone). cctop gets an `openOnStart` option (default off, as upstream): its pane otherwise opens only on `/cctop` or when it was open
  at the last reload; and `HOME` falls back to `USERPROFILE` (native Windows has no HOME: the self-check logged a failure into the
  transcript on every start). Upstream's harness lives outside `plugin/`; with two new tests it is 127/129, the same 2 failures as upstream
  (snapshot files checked out with CRLF). Patches: `v7-win/patches/`.

- **prismantis, cockpit, aurora-bridge** (v7 round 2, 2026-10-17): prismantis gets `toolOutput: rows` (quiet, with nothing under a
  call that worked, shell commands included; failures keep their last line, edits their diff, an expanded group shows all) and
  `copyFeedback: button` (the copy button reads `✓ copied` for 1.5 s instead of a toast, which Claude Code labels with the mod's
  name; failures still toast). Both default to upstream's behaviour. New `tests/kasasree.test.tsx` 6/6; suite 557/557. cockpit
  gets `band` and `statusLine` options (default on); off, it draws only its panel (upstream shows its band whenever the panel is
  not the tab in front). New `tests/kasasree.test.tsx` 3/3; suite 15/15. aurora-bridge's built-in Ember `bg` follows the palette
  to `#121110`. Then: `rows` also leaves output out of a collapsed group (prismantis 559/559), and cctop gets `announce` (default
  on; off, a passing self-check goes to the debug log instead of the transcript; upstream harness 128/130, same 2 failures).
  Patches: `v7-win/patches/`.

- **Versions, and prismantis `diffTint`** (v7 final, 2026-10-17): Claude Code loads each mod from a copy in
  `~/.claude/plugins/cache/kasasree-mods/<mod>/<version>/`, and `claude plugin update` re-copies only when the manifest's version
  changes, so the round 2 patches never reached it. Each patched mod now carries a local version (cockpit `1.0.2-rice.1`, cctop
  `0.10.0-rice.1`, prismantis `0.25.1-rice.2`, aurora-bridge `0.2.0`). After any patch: bump the version, then
  `claude plugin marketplace update kasasree-mods` and `claude plugin update <mod>@kasasree-mods`. prismantis gets `diffTint`
  (default `hue`, as upstream, which tints changed lines with the diff colour's full hue, so a retro green came out as plain
  green); `color` mixes the colour as given, still keeping code text at 4.5:1. 3 new tests; suite 562/562. Patches:
  `v7-win/patches/`.

- **secret-box** `hooks/register.jsx` (`0.5.3-rice.1`, 2026-11-02): the commit guard read the repository off the command with a regex
  and asked git about that text as written, so `R=/x; git -C $R commit`, `git -C /c/x commit` (Git Bash's name for `C:\x`, which native
  `git.exe` rejects) and `cd /x && git commit` from elsewhere were refused, costing agents retries (5 real refusals in the transcripts).
  Worse, `cd other-repo && git commit` was checked against the session's repository, so a `.env` staged in `other-repo` passed. It now
  reads the command as the shell would (quotes, heredocs, subshells, `cd`, `-C`, `NAME=value`, `~`), tries the drive form of a `/c/` path,
  and lets through a commit in a folder with no repository, since git refuses it anyway. A folder only the running command knows
  (`git -C "$(pick-repo)"`, a `for` loop) is still refused, now saying how to retry. Tests: 21 new, 1 upstream test changed (marked
  `LOCAL PATCH`), suite 67/67; also run against native `git.exe` and real repositories (25/25). Still guards the `Bash` tool only: a
  commit through the `PowerShell` tool is not checked (as upstream).
- **cockpit** (`1.0.2-rice.2`, 2026-11-03): the guard starts off (`isGuardOn`), which also covers its asking before edits to secrets
  files. `/cockpit-guard on` or the panel's button turns it on until the session ends. 2 upstream tests turn it on first and 1 expects
  the first press to read `Guard: on` (marked `LOCAL PATCH`); 4 new tests; suite 19/19.
- **secret-box** switch (`0.5.3-rice.2`, 2026-11-03): upstream can only be changed option by option, so `/secret-box [on|off|status]`
  turns hiding and the `.env` guards on or off together, with no argument flipping it, and a new `enabled` option (default on) sets how
  it starts. `hooks/redact.ts` gains one `power` flag, read at each scan. Off keeps restoring placeholders, since the conversation may
  still hold some, and still hides a value a tool was handed. Turning it off is refused unless `e.origin.kind` is `composer` or
  `bridge`: a key in the transcript is permanent, so a scheduled prompt, another session's message or another mod's `$.command.run`
  can't do it. New `tests/switch.test.ts`, 16 tests; suite 83/83.
- **cctop** skills (`0.10.0-rice.3`, 2026-11-02): `/cctop` no longer offers `cctop install`, and neither skill suggests it or
  `cargo install cctop`; see the companion binary section above for why.

### Updates, 2026-11-23 (Claude Code 2.1.330)

- **flightdeck** 0.4.0 -> 0.6.2 at `626cc0b`, unpatched: more credential shapes masked (AWS key ids, Google keys, JWTs, PEM keys,
  JSON-quoted keys) and in prompts, agent tasks and answers too; control bytes stripped from drawn text; a quadratic masking
  pattern fixed; the context gauge measures against the compaction window. 65/65.
- **secret-box** 0.5.3-rice.2 -> `0.5.14-rice.1` on upstream `5d6bd15`. Upstream since the pin: private-key bodies printed without
  their BEGIN line, and UUID session cookies, are hidden (both leaked before); the memory guard covers MultiEdit and NotebookEdit;
  the box saves `.env` at the project root (after a `cd` into a bundled source folder the key could ship inside the product) and
  registers on the desktop app; and the commit guard moved to `hooks/commit-guard.js`, rewritten to read wrappers (`env`, `sudo`,
  `xargs`, `time`), `if`/`while` bodies, `git.exe`, `--git-dir`, `CDPATH`, `set -P`, and Git Bash `/c/` paths on Windows. That
  rewrite fixes the real-session refusals 0.5.3-rice.1 was made for, so rice.1's own guard is retired. Run against upstream's
  guard as a Windows session, rice.1's cases still found: `~`/`$HOME` refused on native Windows (no `HOME`), and a commit message
  that mentions `cd x && git commit` or `git add .env` read as commands and refused. Local patch, `hooks/commit-guard.js`: `HOME`
  falls back to `USERPROFILE`; the text of a git message (a quoted `-m`/`--message`, what `cat`/`echo`/`printf` print inside
  `-m "$( )"`, the heredoc of `git commit -F -`) is never read as code, while anything in it that runs still is. Upstream's
  stricter calls are kept: a commit in a folder that is no repository yet is refused (the command may `git init` first), and so
  is `R=$(git rev-parse --show-toplevel); git -C "$R"` (a `cd` in between would make "the same repository" the wrong one). The
  switch (`/secret-box on|off`, `enabled`) is ported unchanged. Tests: upstream 380 + `tests/rice-guard.test.ts` 26 +
  `tests/switch.test.ts` 16 = 422/422; against native `git.exe` and real repositories with `HOME` unset, 11/11.

### Reviewed and rejected

- **blast-radius** (Anthropic sample): shells out to `bash -c` and `sleep`, with no Windows branch. On native Windows `bash`,
  `sleep` (PowerShell alias only) and `sh` are not on PATH, so the guard would fail open and give false confidence. Not installed.
- **intermission** (jarrodwatts, MIT; reviewed at `8978f61efc890c13dcbed2d78ced224a6715feb8`): held back, not installed. On first
  run it downloads a ~40 MB native engine tarball from the author's GitHub release with **no hash or signature check**,
  extracts it and spawns it (an Odamex client that connects to a third-party multiplayer server). The JavaScript can be pinned
  here but the executable cannot, which is the "code fetched after review" pattern. To accept that risk knowingly: install it
  only in Rio, and pre-place a binary whose hash you recorded so the in-mod download is skipped.
- **show-your-work**: not evaluated or installed (needs ffmpeg + Playwright + a kitty-graphics terminal; Rio support unconfirmed).
- **prismantis**: rejected for v1/v2 (it injects ~630 tokens of hints per prompt, and only one transcript renderer can run). **Pinned since 2026-10-17 for v3** with `diagramHints` off; see the local patches below.
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
