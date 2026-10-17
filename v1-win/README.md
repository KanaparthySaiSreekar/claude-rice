# v1-win: Claude Code mods and ricing on Windows 11

A checkpoint of the setup that was built from the two research reports in this repo and is running on one Windows 11 laptop. Taken **2026-10-16**.

- **Machine:** Windows 11, Windows Terminal 1.24, PowerShell 7.6, JetBrainsMono Nerd Font.
- **Claude Code:** the native 2.1.300 build (`~\.local\bin\claude.exe`), on the `latest` update channel.
- **Not a tested installer.** These files are copied from the live setup, and the two patches are verified to reproduce the patched files from the pinned upstream commits. The rebuild steps below are written from what was done by hand, not run end to end as a script.
- **Two layers.** `config/`, `patches/`, `marketplace/` and `scripts/` are the readable summary. [`full/`](full/) is a complete, unredacted mirror: the full settings, the install state, all six plugins' source, the marketplace's git history and the `claude-rice` working folder. Its README lists what is in it and the few things that are deliberately not (credentials and private history).
- **The mods are pinned by commit,** and the only local changes to them are two small patches (`patches/`).

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
- Apply a patch **from the marketplace repo's root** with `git apply --directory=plugins/<name> -p1 <patch>`. Do not run `git apply` from inside `plugins/<name>`: in a subfolder of a git repo it skips every path outside that subfolder and still exits 0, so nothing is patched and nothing says so (this README said to do exactly that until the 2026-10-17 review; measured: exit 0, no file changed). Outside any git repo, `git apply -p1 <patch>` from the plugin's folder works. The patches use LF line endings, like upstream's git blobs, and a `.gitattributes` rule stops git rewriting them. If your copy of the plugin has CRLF endings (a Windows checkout with `core.autocrlf=true`), add `--ignore-whitespace`.
- Both patches were regenerated and tested on 2026-10-16: pinned upstream file + patch gives your patched file, with LF endings (strict apply) and with CRLF endings (`--ignore-whitespace`). Re-checked on 2026-10-17 against fresh clones at the pinned commits: both reproduce the files the marketplace ran at the checkpoint (commit `8d35cbe`), byte for byte.
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
3. **Marketplace.** Create an empty git repo, clone each upstream at the pinned commit into `plugins/<name>`, drop the `.git` folders, apply the two patches from the repo root (`git apply --directory=plugins/skins -p1 ../path/to/patches/skins-e6ca8ea-no-network.patch`, and the same for `token-weather`; check with `git status` that each one changed a file), add `marketplace/marketplace.json` as `.claude-plugin/marketplace.json`, and commit. Register it with `claude plugin marketplace add <path> --scope user`, then install the six plugins.
4. **Files.** Copy the theme to `~/.claude/themes/claude.json`, the hook to `~/.claude/hooks/tab-title.mjs`, and the HUD config and `.cmd` shim to `~/.claude/plugins/claude-hud/`. Run `/claude-hud:setup` so it places `statusline.mjs` next to them.
5. **Settings.** Merge `config/claude/settings.rice-excerpt.json` into `~/.claude/settings.json`, changing the marketplace path and your username to match. In `settings.json` the plugin options in `pluginConfigs` are plain JSON values, booleans included (as in the excerpt); only `claude plugin configure --values-stdin` insists on strings (`"false"`, not `false`).
6. **Skin.** Replay `config/skins/claude-warm.json` through the skins `design` tool (`save`, then `settings`). Skin settings live in the mod's own store, not in `settings.json`.
7. **Optional.** Rio: `winget install raphamorim.rio`, copy `config/rio/config.toml` to `%LOCALAPPDATA%\rio\`, and run `scripts/setup-rio.ps1` from an elevated PowerShell. If the ConPTY files are not in the staging folder (`-Source` to point elsewhere), it downloads the pinned NuGet package from nuget.org; either way both files must match their SHA-256 pins and carry a valid Microsoft signature, or nothing is copied. Verification runs un-elevated, so you can try it first; only the copy needs administrator rights.
8. **Check.** `git -C <marketplace> status --short` must print nothing (plugins are read live, so this is the tamper check), and `claude --version` should report the native build.

## Gotchas found on Windows

- **Git Bash collapses `\\`** in `echo` and `printf` arguments. Test JSON that contains Windows paths from files, never inline strings.
- **`claude plugin validate` rejects third-party names that start with `claude-`** (it flags claude-hud as reserved). The install still works, so treat it as a lint.
- **The claude-hud launcher imports the highest-versioned `claude-hud` in any marketplace cache**, so never add a second marketplace that ships one.
- **filetree reopens its own pane** whenever the working directory or files change, which hid flightdeck. Its `start` option is `off`, so use `/filetree` when you want it.
- **Pane keys:** `Ctrl+X` then `Tab` focuses a pane, `Ctrl+X` with the arrows resizes it, `Ctrl+X` then `X` closes it.
- **Nerd Font glyphs can render blank** inside Claude Code. Stick to box-drawing and normal symbols in status lines. *(Revised by v2.2: the Powerline glyphs render fine, in the status line and in mod rasters. The real problem is a glyph the font does not have at all, such as `⎇`, `✦`, `⏱`, `◿` or `↻`: Windows Terminal borrows it from another font at another width and it spills into the next cell. Check a glyph against the font's own table before using it; `v2-win/tests/statusline.test.mjs` shows how.)*
- **Mods are unsandboxed**, so the loop is review, pin, install from your own copy. `claude --safe-mode` gives a vanilla session whenever something looks wrong.

## State at the checkpoint

- Headless loads, hook output and status-line text were checked from inside the session. How it looks on screen was confirmed only through screenshots pasted back by the user.
- Rio was installed and configured, but its elevated ConPTY step was not confirmed as run.
- The `intermission` and `show-your-work` extras are not installed.

## Review, 2026-10-17

Everything checkable in this folder was re-checked a day later, after v2 to v6 had been built on top of it.

- **Fixed: the patch instructions did nothing.** Run as written (from inside `plugins/<name>` of the marketplace repo), `git apply` exits 0 and patches nothing. Rebuilding from this README would have produced an unpatched skins (with its daily network call) and an unpatched token-weather, silently. The instructions above now use `--directory` from the repo root, and both patches were re-verified against fresh upstream clones.
- **Fixed: `setup-rio.ps1` could not run on a rebuild.** It read the ConPTY files from a local staging folder that the repo deliberately does not carry, so it stopped at "Missing …" (and `full/README.md` said it downloads them; it did not). It now downloads the pinned package when the files are missing, keeps the same hash and signature checks, and verifies before asking for elevation. Tested un-elevated: with the local files, with a download in PowerShell 7 and in Windows PowerShell 5.1 (all verified and stopped at the elevation gate), and with a tampered file (refused with a hash mismatch).
- **Fixed: two statements.** `pluginConfigs` values do not have to be strings in `settings.json`, and the blank-glyph gotcha now says what v2.2 found.
- **Checked and fine:** the theme has the 62 overrides stated; the settings excerpt is the full settings in `full/` with only the unrelated getlayers plugin left out; the pinned commits agree in this README, `marketplace/marketplace.json` and `marketplace/README.md`; the HUD shim's Node path (`C:\Program Files\nodejs\node.exe`) exists; `full/` holds no credentials or tokens (searched for Anthropic, GitHub, Slack and AWS key shapes, OAuth tokens and private keys); the repository is private, as `full/README.md` requires.
- **Left as it was:** `full/` is a dated mirror and is not edited; this is a checkpoint, so the versions in it (Claude Code 2.1.300, claude-hud as the status line) describe 2026-10-16, not today. What runs now is v2.2 (`../v2-win/`).

## Rollback

`claude --safe-mode` gives one vanilla session. To undo it fully: restore your old `~/.claude/settings.json`, delete `~/.claude/themes/claude.json`, `~/.claude/hooks/` and `~/.claude/plugins/claude-hud/`, and run `claude plugin uninstall <name>@kasasree-mods` for each plugin.
