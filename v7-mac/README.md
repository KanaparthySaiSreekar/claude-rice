# v7-mac: Six tabs, on macOS

v7 ([`v7-win/`](../v7-win/)) rebuilt for a Mac (Apple Silicon, macOS 26, Claude Code 2.1.304), plus the tweaks asked for once
it ran there (2026-10-20). Claude Code's side is the same build: the six right-hand panes as tabs (Bridge, Flightdeck, Session,
cctop, Files, Cockpit), prismantis drawing the chat with tool calls as dim rows on the right, retro diff tints, the plain
spinner words, and the v2 Ember theme and status line on `#121110`.

**v7.3 (2026-11-15)** brings the changes made on Windows since (2026-11-02 and 03): Cockpit's guard starts off, Secret Box's
commit guard reads a command as the shell would and gains an on/off switch, and cctop's skills never offer `cctop install`.
[Updating a Mac that already runs v7-mac](#updating-a-mac-that-already-runs-v7-mac) says how to bring them over.

## What is different on a Mac

| Windows (v7-win) | macOS (v7-mac) | Why |
|---|---|---|
| Windows Terminal | **Ghostty** 1.3 | Native on Apple Silicon (Metal). The terminal Claude Code supports best: desktop notifications, the progress bar, Shift+Enter, and mod `Image` elements drawn as real pictures. Flat colour only: no opacity, blur, picture or shader, each of which costs GPU work per frame. The title bar and tabs take the terminal colours; the dock icon is drawn in the palette |
| PowerShell 7 + PSReadLine | **fish** 4 (Ghostty's shell) | Highlighting, history suggestions and the completion pager are built in, as PSReadLine's were; no plugins, no prompt framework. Starts in about 10 ms. The prompt reads `.git/HEAD` with builtins only (no `git`, no forks). The login shell stays zsh, so Claude Code's Bash tool, hooks and the status line keep a POSIX shell |
| the profile's icon `ls` | **eza** with `EZA_COLORS` from the palette | the same groups and colours as the PowerShell function |
| `aurora-deck.cmd` shim | `AURORA_DECK_GAP=0 AURORA_DECK_BARS=half exec '/opt/homebrew/bin/node' '…/aurora-deck.mjs'` | no shim and no PATH lookup; Homebrew's stable `node` link, so a `brew upgrade` does not break it. The two variables are the half-row gap below |
| JetBrainsMono NFM | the same face (`font-jetbrains-mono-nerd-font`) | the status line's glyph list was checked against it (and `▄ ▖` against this font file's cmap) |
| cctop without its program | **cctop 0.9.1 built from the pinned commit** (`~/.local/bin/cctop`) | so its pane has every view (Coach, Tools, Agents, Files, Events, Advisor) |

## What v7-mac adds to v7

Every addition is an option whose default is the old behaviour; [`version.json`](version.json) (v7-win's plus these) turns
them on. Patches in [`patches/`](patches/), applied in the pinned marketplace after v3's and v7's.

| | v7 | v7-mac | How |
|---|---|---|---|
| Your messages in the chat | prismantis `promptStyle: bar`: an orange `▌` and orange text | a **rounded bubble with white text**, both in the palette's text colour (`#F8F4EE`) | prismantis `promptColor` (new) set to `{palette:fg}` (a new kit builder), `promptStyle: bubble`. [`prismantis-prompt-color-declined.patch`](patches/prismantis-prompt-color-declined.patch) |
| A call you turn down | "AskUserQuestion **failed**" in red, with Claude Code's whole message to the model under it (that is how a question's **Chat about this** looks too) | dim **"· chose to chat"** with nothing under it; a No with a reason keeps only your words, as **declined**; a real failure still says failed | prismantis `declined: quiet` (new), same patch |
| The status line's two rows | a blank spacer row between them | **half a row**: no spacer row, and the gauge bars fill only the lower half of their row (`▄`, the end cell `▖`) | `AURORA_DECK_GAP=0` and `AURORA_DECK_BARS=half` (new in `v2-win/statusline/aurora-deck.mjs`; unset, nothing changes) |
| cctop under the prompt | (no program, so no coach line) a "pane hidden behind the /diff panel" notice whenever its tab is not in front | **nothing pinned**: the coach's lights repeat the status line's context and limits ("each reading shows once"), and with panes as tabs "hidden" only means another tab is in front | cctop `statusLine: false` (new). [`cctop-status-line.patch`](patches/cctop-status-line.patch), tests for cctop's own harness in [`cctop-status-line-tests.patch`](patches/cctop-status-line-tests.patch) |
| Trackpad scrolling | (a mouse) | **no wheel acceleration**: a swipe arrives as a fast burst of wheel events, which Claude Code otherwise speeds up into an overshoot; `/scroll-speed` fine-tunes | `wheelScrollAccelerationEnabled: false`, set by `tools/mac.mjs` |
| Secrets | pasted into the chat, where they stay in the transcript for good | **Secret Box**: Claude asks with `request_secret`, you paste into a masked box, the key goes to `.env` and Claude only ever sees a placeholder; `/secret-box off` for a session (v7.3) | [ray-amjad's secret-box](https://github.com/ray-amjad/claude-code-mods/tree/main/plugins/secret-box) 0.5.3, loaded **last** (below); patched in v7.3: [`secret-box-guard-switch.patch`](../v7-win/patches/secret-box-guard-switch.patch) |
| Risky commands | Cockpit's guard, on | **Cockpit's guard, kept, but off at start** since v7.3: `/cockpit-guard on` when you want it (Blast Radius considered and not installed) | [`cockpit-guard-off.patch`](../v7-win/patches/cockpit-guard-off.patch), below |
| cctop's `/cctop` | offers `cctop install` once, and suggests `cargo install cctop` | **never offers either** (v7.3): `cctop install` rewrites `settings.json` with sorted keys, and the order of `enabledPlugins` is what keeps Secret Box last; the `cctop` crate on crates.io is an unrelated program | [`cctop-skills.patch`](patches/cctop-skills.patch) |

## Secret Box

A key that reaches the conversation stays in the transcript for good: it is sent to the model every turn after and kept in
the session file. Secret Box keeps keys out:

- **Asking:** Claude calls `request_secret` (name and reason); a masked box opens beside the chat (above the prompt when
  the window is under 144 columns: Ctrl+X then Tab to type). You paste, Enter saves to `.env` (and adds it to `.gitignore`
  first), Esc cancels. You can also say "use the secret box to ask me for STRIPE_SECRET_KEY".
- **Using:** Claude writes the placeholder (`[REDACTED-SECRET-1a2b3c4d]`) into a command or a file, and the real value goes in
  only as a local tool runs (Bash, Write, Edit, MultiEdit, NotebookEdit; never a tool that sends data off the machine).
- **Hiding:** every tool result, prompt, `@` file and CLAUDE.md is scanned: about 70 vendor key shapes, high-entropy tokens,
  passwords in flags and connection strings, and every secret-named `.env` value come back as placeholders. `cat .env`
  still shows `PORT=3000`. A tool row says `secret-box: hid N value(s)`.
- **Never committed:** `git add .env` and a commit that would carry a `.env` are refused. Since v7.3 the commit guard reads
  the command as the shell would (quotes, heredocs, subshells, `cd`, `-C`, `NAME=value`, `~`): `cd other-repo && git commit`
  is checked in `other-repo` (upstream checked the session's folder, so a `.env` staged there got through), and
  `R=/x; git -C $R commit` is no longer refused. A folder only the running command knows (`git -C "$(pick-repo)"`) is still
  refused, saying how to retry.
- **Off for a while** (v7.3): `/secret-box off` stops hiding and the `.env` guards together, `/secret-box on` brings both
  back, `/secret-box` alone flips it, `/secret-box status` says which. Only you, at the prompt, can turn it off: a scheduled
  prompt, another session or another mod can't, since a key in the transcript is there for good. A restart goes back to
  the `enabled` option (default on). While off, placeholders already in the chat still become real values.
- **Options** (`/plugin configure secret-box@kasasree-mods`): `enabled` (v7.3) sets whether it starts on; `pii` hides emails
  and IPs too; the `allow*` lists keep ids it hides by mistake; `restoreTools` sets which tools may receive real values.
- **Known false alarm:** upstream refuses any command that has `git add` and the text `.env` anywhere in it, so a commit
  message that mentions `.env` in the same command as a `git add` is refused. Give the message with `git commit -F <file>`.

**It loads last.** On a tool call it hands the real value to the mods beneath it and hides it again on the way back up.
Claude Code chains user mods in `enabledPlugins` order, the first outermost, so `version.json` lists it in `last` (a new
kit field) and every other mod (the panes, prismantis, the guard) sees only placeholders and hidden output.

## Risky commands: Cockpit's guard, not Blast Radius

Cockpit's guard asks **Run it / Block it** before `rm -rf`, force pushes, `reset --hard`, `sudo`, and `.env` and key files,
and counts the blocks in its panel. Since v7.3 it **starts off** (a local patch, as on Windows): `/cockpit-guard on` or the
panel's Guard button turns it on until the session ends. Blast Radius, Anthropic's sample, would show more (the files and
commits at stake), but it is unsupported, a script that runs `rm` itself gets past it, and two guards would ask twice.

With `skipDangerousModePermissionPrompt` on, this guard is the one question before a destructive command, so while it is
off **nothing asks**: turn it on for a session that touches anything you can't get back. The evaluation of all seventeen candidates is in
[`research_notes/.../mod_shortlist_2026-10-20.md`](../research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/mod_shortlist_2026-10-20.md).

## Set up a Mac from scratch

```sh
brew install --cask ghostty font-jetbrains-mono-nerd-font
brew install fish eza node gh rust          # rust only to build cctop; `brew uninstall rust && brew autoremove` after
gh auth login && gh repo clone KanaparthySaiSreekar/claude-rice ~/Projects/claude-rice
cd ~/Projects/claude-rice

sh v7-mac/tools/rebuild-marketplace.sh      # ~/Projects/claude-mods-local: the eight mods at their pins, then every patch

git clone https://github.com/tomstagl/cctop /tmp/cctop && git -C /tmp/cctop checkout 6ceafc3 \
  && (cd /tmp/cctop && cargo build --release --locked) && install -m 755 /tmp/cctop/target/release/cctop ~/.local/bin/

cd v7-mac && npm run setup                  # mac.mjs apply ember, then mods.mjs install, then rice.mjs apply ember
```

Then open Ghostty and run `claude`. The panes dock beside the chat in the fullscreen layout from 110 columns (the Bridge
from 144); Ghostty at 13 pt fills a 13" screen with about 167.

## Updating a Mac that already runs v7-mac

The repo was renamed from `claude-code-mods-research` to `claude-rice` (GitHub forwards the old name). Pull, then add the
three v7.3 patches to the marketplace and let `mods.mjs` update the three mods whose versions changed:

```sh
cd ~/Projects/claude-code-mods-research            # your clone (the folder name does not matter, see below)
git remote set-url origin https://github.com/KanaparthySaiSreekar/claude-rice.git && git pull
R=$PWD

cd ~/Projects/claude-mods-local
git apply "$R/v7-win/patches/cockpit-guard-off.patch" "$R/v7-win/patches/secret-box-guard-switch.patch" "$R/v7-mac/patches/cctop-skills.patch"
cp "$R/v7-mac/marketplace/marketplace.json" .claude-plugin/ && cp "$R/v7-mac/marketplace/README.md" .
git add -A && git commit -m "v7.3: cockpit guard off at start; secret-box commit guard and switch; cctop skills"

cd "$R/v7-mac" && node tools/mods.mjs install && npm test     # then restart Claude Code
```

Or rebuild the marketplace whole: move `~/Projects/claude-mods-local` aside, `sh v7-mac/tools/rebuild-marketplace.sh`, then
`node v7-mac/tools/mods.mjs install`. `version.json` is unchanged, so `rice.mjs apply` has nothing new to switch. The clone
can be renamed to `~/Projects/claude-rice`: nothing live runs from it (`mac.mjs` copies the status line into `~/.rice/current/`
and the hook into `~/.claude/hooks/`), and the tools find the marketplace next to the clone under either name.

## Use it

```
cd v7-mac
npm test               # 11 tests (below)
npm run status
npm run revert         # the v7 switch, then the macOS base, each back to its backup
```

- `tools/mac.mjs apply [palette] [--dry-run]`: the macOS base (v2's job on Windows): `~/.claude/themes/<palette>.json`, the
  status line in `~/.rice/current/statusline/`, `~/.config/ghostty/config.ghostty`, `~/.config/fish/conf.d/rice.fish`, and in
  `settings.json` the theme, the status line, `tui: fullscreen`, `maxProseWidth`, the spinner tips, the tab-title hook and
  `wheelScrollAccelerationEnabled: false`. `~/.config/fish/config.fish` (PATH and aliases from `~/.zshrc`) is made once and
  never overwritten. Every file is backed up to `~/.rice/backups/<time>-mac/` first; `revert` puts each back byte for byte
  and removes the ones it created.
- `tools/mods.mjs install`: registers `~/Projects/claude-mods-local` as `kasasree-mods` (refusing if its tamper check is not
  clean) and installs, or updates, the eight mods.
- `tools/rice.mjs apply|revert|status`: the v7 switch through the shared kit (`v3-win/tools/kit.mjs`), from `version.json`.
- `tools/rebuild-marketplace.sh [target]`: the marketplace from scratch, checked against every patch's post-image.

Restart Claude Code after any of them. A new Ghostty window picks up config changes (or Cmd+Shift+, reloads them).

## Shared code fixed for macOS

These are fixes for both platforms, not forks; Windows behaves as before.

- Six scripts decided whether they were the program being run with ``import.meta.url === `file:///${argv[1]}` ``, which only
  matches a Windows path: on a Mac the status line printed nothing at all. They, and three that built module URLs the same
  way, now use `pathToFileURL` (right on both, and on paths with spaces), and skip the check when there is no script path
  (`node -e`).
- `v3-win/tools/kit.mjs`: `preview` writes a `.sh` status-line shim off Windows; a `{palette:fg}` builder (the palette's text
  colour) for prismantis's `promptColor`.
- `v2-win/statusline/aurora-deck.mjs`: `AURORA_DECK_GAP` and `AURORA_DECK_BARS` (above).

## Verified, and not

v7.3, 2026-11-15, **on the Windows machine** (no Mac in this session), Claude Code 2.1.325:

- `rebuild-marketplace.sh` (run under Git Bash with `core.autocrlf=false`, as a Mac checks out) into an empty folder: 8
  commits, every patched file equals its patch's post-image. Before the v7.3 patches its eight mods equal the Windows
  marketplace's file for file (Windows also keeps a few files the Mac's `git archive` does not, such as `LICENSE`); after
  them, the only difference is cctop's two skill files, the macOS wording.
- On that rebuilt tree: `claude plugin test` cockpit 19/19 and secret-box 83/83 (including its "on Mac and Linux a real
  `/c/` folder is used as it is" case); `claude plugin validate` passes for cctop, cockpit and secret-box.
- `npm test` here 9/11: the new patch/README test passes; the fish prompt test skips (no fish) and the status line command
  test needs `/bin/sh`, so both wait for a Mac. v7-win 8/8, v2 52/52, v3 7/7, v4 5/5, v5 5/5, v6 3/3.
- **Not run on a Mac yet:** the update steps above, `mods.mjs install` picking up the three new versions, and `npm test` 11/11.

2026-10-20, Claude Code 2.1.304, an M1 MacBook Pro:

- `npm test` here 10/10: Ghostty and fish from the palette, the fish prompt in a real fish (branch from `.git/HEAD` and a
  worktree's `.git` file, red arrow after a failure), settings merge and fish's PATH from zsh, apply/revert byte for byte in a
  sandbox with the status line run the way Claude Code runs it, every option `version.json` sets declared in its mod's
  manifest, the status line command drawing half-height bars with no spacer row, and secret-box kept last in the load order
  (also after a later install). v7-win 8/8, v2 52/52 (with `▄ ▖` in the
  font-safe list). v3 6/7: its marketplace test wants `skins`, which v7 switches off and the macOS marketplace leaves out.
- `rebuild-marketplace.sh` into an empty folder gives a tree identical to the live marketplace; every patched file's git blob
  equals its patch's post-image; every cached mod copy equals the marketplace; `claude plugin validate`: all eight pass, none
  with `$.http`.
- Secret Box: `claude plugin test` 46/46; its detector contract hides and keeps every listed string, and three 8 MB
  adversarial inputs miss its 5 s budget on the M1 (7.9 to 10.4 s; real tool output is truncated far below that, and an
  overrun withholds the result). Live: loaded 8th of 8 user mods and admitted, `request_secret` registered; one Haiku turn
  (`claude -p`, about $0.003) ran `cat config.json` on a fake `sk_live_` key and answered `[REDACTED-SECRET-…]`, and the
  saved transcript held the key zero times.
- `claude plugin test`: prismantis 567/567 (5 new), flightdeck 28/28, filetree 64/64, cockpit 15/15, aurora-bridge 8/8,
  paneline 875/876 (one 5 s timeout under load, A19, which passes on its own); cctop's own harness 132/132 (two new; the two
  CRLF failures v7 had on Windows are gone).
- Live, the real Claude Code in a 210×50 pseudo-terminal with the live settings (no prompt sent): all six tabs open, each
  pane drawn when its tab is clicked (cctop with real data from its program), only the v2 status line under the prompt, no
  refused or skipped hook in the debug log. A resumed synthetic session drew both prompts as bubbles whose border and text
  cells are `#F8F4EE`, and the declined question as a dim "AskUserQuestion · chose to chat" with nothing under it.
- In Ghostty itself, by eye: the setup running, and the half-row status line gap ("I like it now").
- Not confirmed yet: the trackpad scrolling after the acceleration change, the white bubble in Ghostty, and the `✓ copied`
  flip under a real click.

## Layout

```
version.json            what v7-mac switches (v7-win's, plus promptStyle bubble, promptColor, declined, cctop statusLine, secret-box last)
tools/mac.mjs           the macOS base: theme, status line, Ghostty, fish, settings; apply / revert / status
tools/build.mjs         palette -> Ghostty config, fish config, eza colours, the status line command
tools/mods.mjs          register the marketplace, install or update the eight mods
tools/rice.mjs          the v7 switch (the shared kit)
tools/rebuild-marketplace.sh
hooks/tab-title.mjs     v1.1's tab-title hook (folder ⎇ branch, ◐ working, ▲ needs you, ✓ done)
marketplace/            the marketplace's manifest and README
patches/                cctop-status-line(-tests), prismantis-prompt-color-declined, cctop-skills (v7.3; the other two
                        v7.3 patches, cockpit-guard-off and secret-box-guard-switch, are shared and live in v7-win/patches)
tests/mac.test.mjs
```
