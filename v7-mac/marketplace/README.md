# kasasree-mods — personal pinned Claude Code marketplace (macOS)

Every plugin here was **source-reviewed and copied at a recorded commit**. Nothing auto-updates.
Mods are unsandboxed (they see every prompt, env and tool call), so the rule is: review → pin → install from here.

This is the macOS rebuild of the Windows marketplace that `claude-rice/v7-win` runs on. It holds the eight mods v7-mac
switches on, rebuilt from their upstream commits plus the patches in the claude-rice repo; every patched file's git blob
equals the post-image recorded in those patches. `claude-rice/v7-mac/tools/rebuild-marketplace.sh` rebuilds it from scratch.

Registered with: `claude plugin marketplace add ~/Projects/claude-mods-local --scope user`

## Provenance

| Plugin | Upstream | Pinned commit | Version here | License |
|---|---|---|---|---|
| aurora-bridge | first-party (`claude-rice/v2-win/mods/aurora-bridge`) | snapshot at `923583f` | 0.2.0 | MIT |
| flightdeck | scasella/claude-flightdeck | `626cc0b46d417f81bbff9f5ba3b49abaf8912a85` (v0.6.2, since v7.4) | 0.6.2 | MIT |
| filetree | data-goblin/claude-code-filetree | `44d4a6293d517028abe303b21715b126bf46fbec` | 0.2.26 | MIT |
| cockpit | drkokorev/cockpit-for-claude (`plugins/cockpit`) | `8960ed87ed3b39d7236aaa17a1e1d26c7d154461` | 1.0.2-rice.2 | MIT |
| paneline | markneonin/paneline | `fd20c8cb91f18d2c3cc7c8876232084969ead951` (v0.4.1) | 0.4.1 | MIT |
| cctop | tomstagl/cctop (`plugin/`) | `6ceafc34a972f4e58d5e53b1c69f80e2a9759d41` | 0.10.0-rice.3 | MIT |
| prismantis | NahumLitvin/prismantis | `0d93494caff9c2e31fc9b69261d3e9d329803dab` (v0.25.1) | 0.25.1-rice.4 | MIT |
| secret-box | ray-amjad/claude-code-mods (`plugins/secret-box`) | `5d6bd156c7586c4b030157a1a2e8b7214b238501` (v0.5.14, since v7.4) | 0.5.14-rice.1 | MIT |

The `cctop` program the cctop pane queries is built from the same pinned commit (`cargo build --release --locked`, no
network crates) and installed as `~/.local/bin/cctop`. Never `cargo install cctop`: that crate name is an unrelated program.

### Local patches

From `claude-rice`, in this order: `v3-win/patches/prismantis-rice.patch`; `v7-win/patches/` (prismantis-rows-copy,
prismantis-diff-tint, paneline-chat-option, cockpit-panel-only, cctop-rice, local-versions); `v7-mac/patches/`
(cctop-status-line, prismantis-prompt-color-declined); then v7.3's, made on Windows on 2026-11-02 and 03:
`v7-win/patches/cockpit-guard-off.patch` and `v7-mac/patches/cctop-skills.patch` (the macOS wording of
`v7-win/patches/cctop-skills-windows.patch`); then v7.4's (2026-11-23), `v7-win/patches/secret-box-0.5.14-rice.patch`, on
upstream secret-box 0.5.14. It replaces v7.3's `secret-box-guard-switch.patch`, which was made on 0.5.3 and is kept in
`v7-win/patches/` as the record of v7.3. Then v7.5's (2026-11-24), `v7-win/patches/prismantis-code-panel.patch`: prismantis's
`codeStyle: panel` sets code blocks on a tinted band, their language dim at the top right, instead of under a `── code` line.

Most are options whose default is upstream's behaviour, turned on by the version's `version.json`. Three change behaviour
outright:

- **cockpit:** the guard starts off, for risky commands and secrets files alike. `/cockpit-guard on` or the panel's Guard
  button turns it on until the session ends.
- **secret-box:** upstream's own guard (since 0.5.14, `hooks/commit-guard.js`) reads a command as the shell would, so
  `cd other-repo && git commit` is checked in `other-repo`. The v7.4 patch adds two things to it: the text of a git message
  (a quoted `-m`, what `cat`/`echo`/`printf` print inside `-m "$( )"`, the heredoc of `git commit -F -`) is never read as
  commands, so a message that mentions `cd x && git commit` or `git add .env` is not refused; and `~`/`$HOME` fall back to
  `USERPROFILE` where `HOME` is unset (native Windows). `/secret-box [on|off|status]` is a new switch (and `enabled` a new
  option, default on); only the person at the prompt can turn it off.
- **cctop:** its skills never offer `cctop install`. It rewrites `settings.json` with sorted keys, and the key order of
  `enabledPlugins` is the load order that keeps secret-box last.

### secret-box: reviewed 2026-10-20, loads last; patched 2026-11-02 and 03; updated to 0.5.14 on 2026-11-23

No network and no dynamic code (`claude plugin validate`: `$.fs`, `$.process.run`, `$.tool.register`, `$.ui`, `$.session`,
and since the switch `$.command` for `/secret-box`). It runs only `sleep 0.3` (waiting for the masked box) and read-only `git`
(`rev-parse --git-dir`, `diff --cached --name-only`, `ls-files`, `check-ignore`), reads `OS` and `CDPATH`, and `HOME` (then
`USERPROFILE`) only for a commit that names `~`, `$HOME` or a bare `cd`, and writes only the env file it is asked for (a bare
`.env*` name, at the project root since 0.5.14) and that file's `.gitignore` line, `.gitignore` first. Secrets live in the
mod's memory, never on disk beyond the env file. 0.5.14 also hides private-key bodies printed without their BEGIN line and
UUID session cookies, both of which leaked before.

On a tool call it turns placeholders back into real values and passes the call **down** the chain, then hides secrets in the
result on the way back **up**. Claude Code chains user mods in `enabledPlugins` order, first = outermost (the debug log's
`hooks module A, B, ...` lines), so every mod loaded before secret-box sees placeholders and hidden results, and any mod
after it would see real keys. v7-mac's `version.json` puts it in `last`, so it stays the innermost user mod. Claude Code's
built-in mods (`/diff` and the rest) always chain after user mods.

## Tamper check

`git -C ~/Projects/claude-mods-local status --short` must print nothing. Claude Code runs each mod from its copy in
`~/.claude/plugins/cache/kasasree-mods/<mod>/<version>/`, and copies again only when the manifest's version changes: after a
patch, bump the version, `claude plugin marketplace update kasasree-mods`, `claude plugin update <mod>@kasasree-mods`, restart.

## Rollback

`claude plugin uninstall <name>@kasasree-mods` per plugin, or `claude --safe-mode` for one vanilla session.
