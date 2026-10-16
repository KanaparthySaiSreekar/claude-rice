# v1-win: Claude Code mods and ricing on Windows 11

A checkpoint of the setup that was built from the two research reports in this repo and is running on one Windows 11 laptop. Taken **2026-10-16**.

- **Machine:** Windows 11, Windows Terminal 1.24, PowerShell 7.6, JetBrainsMono Nerd Font.
- **Claude Code:** the native 2.1.300 build (`~\.local\bin\claude.exe`), on the `latest` update channel.
- **Not a tested installer.** These files are copied from the live setup, and the two patches are verified to reproduce the patched files from the pinned upstream commits. The rebuild steps below are written from what was done by hand, not run end to end as a script.
- **No third-party mod source is stored here.** The mods are pinned by commit, and the only local changes to them are two small patches.

## What is running

| Layer | Choice | File here |
|---|---|---|
| Terminal | Windows Terminal, scheme "Claude", 95% acrylic, grayscale text, orange tab | `config/windows-terminal/claude-scheme-and-defaults.json` |
| Second terminal | Rio, same palette, for real images only (optional) | `config/rio/config.toml`, `scripts/setup-rio.ps1` |
| Claude Code theme | `custom:claude`, 62 overrides on the dark base | `config/claude/themes-claude.json` |
| Settings | spinner verbs and tips, `maxProseWidth` 100, fullscreen TUI, `latest` channel | `config/claude/settings.rice-excerpt.json` |
| Status line | claude-hud, `compact` layout, **one line, no bars** | `config/claude/claude-hud-config.json`, `config/claude/claude-hud-statusline.cmd` |
| Tab title | a silent hook: `◐ project` working, `▲ project · needs you`, `✓ project · done` | `config/claude/hooks-tab-title.mjs` |
| Transcript skin | skins mod, custom skin `claude-warm`, rail off | `config/skins/claude-warm.json` |
| Panes | flightdeck (opens on start), filetree (off until `/filetree`), image-view | `marketplace/README.md` |
| Mod source | a personal pinned marketplace, `kasasree-mods` | `marketplace/` |

The status line reads like this: `[Sonnet 5.5] 29% | folder git:(main) | 5h: 15% (3h 57m) | 7d: 89% ▲ (20h 27m)`.

## Pinned mods

All six were source-reviewed, then copied at the commit below. Full provenance, licences and what `claude plugin validate` reports for each are in `marketplace/README.md`.

| Plugin | Upstream | Pinned commit | Local change |
|---|---|---|---|
| claude-hud | jarrodwatts/claude-hud | `02d73c4` | none |
| flightdeck | scasella/claude-flightdeck | `6150b9f` | none |
| skins | hellosverre/claude-skins | `e6ca8ea` | `patches/skins-e6ca8ea-no-network.patch` |
| image-view | jarrodwatts/claude-image-view | `370b8e7` | none |
| filetree | data-goblin/claude-code-filetree | `44d4a62` | none |
| token-weather | anthropics/claude-code-playground (`claude-code/mods/token-weather`) | `569c528` | `patches/token-weather-569c528-stack-above-prompt.patch` (installed but **disabled**) |

- **skins patch:** the daily update check and the star-request toast now return immediately, so the mod makes no network call.
- **token-weather patch:** the upstream handler never called `next(e)`, which replaces whatever else draws in the band above the prompt. The patched version stacks its line above the rest.
- Apply a patch from the plugin's root folder with `git apply -p1 <patch>`. The patches use LF line endings, like upstream's git blobs, and a `.gitattributes` rule stops git rewriting them. If your copy of the plugin has CRLF endings (a Windows checkout with `core.autocrlf=true`), add `--ignore-whitespace`.
- Both patches were regenerated and tested on 2026-10-16: pinned upstream file + patch gives your patched file, with LF endings (strict apply) and with CRLF endings (`--ignore-whitespace`).
- Compared with the upstream clones at those commits, these two files were the **only** differences in the copied plugin folders.

## Where this deviates from the research reports, and why

These are the decisions to keep if you rebuild or extend it.

- **One source for every number.** Three gauges (token-weather, claude-hud, flightdeck) disagreed on context and one sat at a stale 0%. Now only claude-hud shows context and usage. The skins usage band is off and the flightdeck status line is off.
- **Minimum vertical space.** The target is a one-line status line plus Claude Code's own footer. claude-hud's `expanded` layout (context and usage bars, tools, agents and todos rows) and a bordered claude-powerline panel (5 rows) were both tried and replaced by the `compact` one-liner.
- **Skins `rail` is off.** With it on, every tool call costs two rows because a connector row is drawn above each one. Off, a tool call is one row.
- **token-weather is disabled.** It duplicated the gauge and showed 0% until a turn had completed.
- **skins instead of prismantis.** prismantis injects about 630 tokens into every prompt (the report estimated about 190).
- **Native installer instead of winget.** Winget only follows the `stable` tag, while Claude Code compares against `latest`, so the "Update available" banner never cleared and `claude update` refuses winget installs.
- **blast-radius is not installed.** It shells out to `bash -c` and `sleep`, which are not on the native Windows PATH, so the guard would fail open and give false confidence.
- **intermission is held back.** On first run it downloads a native engine of about 40 MB with no hash or signature check and runs it. Pinning the JavaScript cannot cover that.
- **The "needs you" signal is a settings hook, not a mod.** It has no mod attack surface and works the same.
- **claude-powerline is pinned as an npm tarball, never `npx @latest`**, in case you use it. It is not used here.

## Rebuild, roughly

1. **Claude Code.** Install the native build and put `%USERPROFILE%\.local\bin` first in the User PATH. Then **close every Windows Terminal window and reopen it**: new tabs in a running Windows Terminal inherit its old environment, so the old `claude` keeps launching.
2. **Terminal.** Merge `config/windows-terminal/claude-scheme-and-defaults.json` into Windows Terminal's `settings.json`.
3. **Marketplace.** Create an empty git repo, clone each upstream at the pinned commit into `plugins/<name>`, drop the `.git` folders, apply the two patches, add `marketplace/marketplace.json` as `.claude-plugin/marketplace.json`, and commit. Register it with `claude plugin marketplace add <path> --scope user`, then install the six plugins.
4. **Files.** Copy the theme to `~/.claude/themes/claude.json`, the hook to `~/.claude/hooks/tab-title.mjs`, and the HUD config and `.cmd` shim to `~/.claude/plugins/claude-hud/`. Run `/claude-hud:setup` so it places `statusline.mjs` next to them.
5. **Settings.** Merge `config/claude/settings.rice-excerpt.json` into `~/.claude/settings.json`, changing the marketplace path and your username to match. The plugin options in `pluginConfigs` must be set as strings (`claude plugin configure --values-stdin` rejects booleans).
6. **Skin.** Replay `config/skins/claude-warm.json` through the skins `design` tool (`save`, then `settings`). Skin settings live in the mod's own store, not in `settings.json`.
7. **Optional.** Rio: `winget install raphamorim.rio`, copy `config/rio/config.toml` to `%LOCALAPPDATA%\rio\`, and run `scripts/setup-rio.ps1` from an elevated PowerShell. It checks the SHA-256 and the Microsoft signature of the ConPTY files before copying them.
8. **Check.** `git -C <marketplace> status --short` must print nothing (plugins are read live, so this is the tamper check), and `claude --version` should report the native build.

## Gotchas found on Windows

- **Git Bash collapses `\\`** in `echo` and `printf` arguments. Test JSON that contains Windows paths from files, never inline strings.
- **`claude plugin validate` rejects third-party names that start with `claude-`** (it flags claude-hud as reserved). The install still works, so treat it as a lint.
- **The claude-hud launcher imports the highest-versioned `claude-hud` in any marketplace cache**, so never add a second marketplace that ships one.
- **filetree reopens its own pane** whenever the working directory or files change, which hid flightdeck. Its `start` option is `off`, so use `/filetree` when you want it.
- **Pane keys:** `Ctrl+X` then `Tab` focuses a pane, `Ctrl+X` with the arrows resizes it, `Ctrl+X` then `X` closes it.
- **Nerd Font glyphs can render blank** inside Claude Code. Stick to box-drawing and normal symbols in status lines.
- **Mods are unsandboxed**, so the loop is review, pin, install from your own copy. `claude --safe-mode` gives a vanilla session whenever something looks wrong.

## State at the checkpoint

- Headless loads, hook output and status-line text were checked from inside the session. How it looks on screen was confirmed only through screenshots pasted back by the user.
- Rio was installed and configured, but its elevated ConPTY step was not confirmed as run.
- The `intermission` and `show-your-work` extras are not installed.

## Rollback

`claude --safe-mode` gives one vanilla session. To undo it fully: restore your old `~/.claude/settings.json`, delete `~/.claude/themes/claude.json`, `~/.claude/hooks/` and `~/.claude/plugins/claude-hud/`, and run `claude plugin uninstall <name>@kasasree-mods` for each plugin.
