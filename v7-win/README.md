# v7-win: Six tabs

**v7 is the master build:** it carries every preference in [`preferences.md`](../preferences.md) (finalised 2026-10-17, tag
`v7.2-win`). Since then: v7-mac's tweaks brought here (2026-10-21), and **v7.3** (2026-11-02 and 03, tag `v7.3-win`): the
cctop program built for Windows, Secret Box's commit guard fixed and given an on/off switch, Cockpit's guard off at start.
See [v7.3](#v73-after-the-master-2026-10-21-to-11-03).

v7 puts six right-hand panes side by side as tabs, on the v2 Ember rice (palette, theme, status line). Claude Code draws every
open pane as a tab of one sidebar ("With several panes open, each gets a tab that shows its title",
[mods interface docs](https://code.claude.com/docs/en/plugins/mods/interface)), so v7 switches on six pane mods and makes each one
open its pane on start. Since round 2, [prismantis](https://github.com/NahumLitvin/prismantis) draws the chat (instead of skins),
with every tool call as one dim row on the right and nothing under it.

![Claude Code 2.1.302 at 210 columns. Left: the prompt with an orange bar, tool calls as dim rows on the right ("Read statusline\deck.mjs · Searched . for gradientBar", "Edited statusline\deck.mjs", "Run the status line tests · node · Apply a palette…" with only the failure's last line under it), the edit's diff card tinted brown-red and olive, an orange "Done" heading, a table and a warning. Right: the tab row Flightdeck, Bridge, Session, Files, Cockpit, cctop. One near-black (#121110) behind both](docs/screenshots/six-tabs-prismantis.png)

*The real Claude Code resuming a synthetic demo session (no model turn), started exactly as a restart starts it: the live
`settings.json` and the mods' cached copies, each checked equal to the repo. Round 1 looked like [this](docs/screenshots/six-tabs.png).*

| Tab | Mod | What it shows | Where from |
|---|---|---|---|
| **Flightdeck** | [scasella/claude-flightdeck](https://github.com/scasella/claude-flightdeck) | main model vitals, on-call architect, permission gate, subagent cards and swimlanes, turn receipt, session log | v1 (all seven panels, as v1 had them) |
| **Session** | [markneonin/paneline](https://github.com/markneonin/paneline) | its own tabs: Activity, Files, Agents, Context, MCP, Skills, Spend | new |
| **Files: ...** | [data-goblin/claude-code-filetree](https://github.com/data-goblin/claude-code-filetree) | the project tree with git status and `+N -N` per file; files shimmer as Claude reads and edits them | v1 (now opens on start) |
| **Bridge** | first-party `aurora-bridge` | the heartbeat wave, one dot per tool call, the gate, subagents, hottest files, last turn's receipt | v2 |
| **Cockpit** | [drkokorev/cockpit-for-claude](https://github.com/drkokorev/cockpit-for-claude) | context, 5h/7d limits, cost, turn, agents, tools, files, tests, guard, alerts, history, all-time | new |
| **cctop** | [tomstagl/cctop](https://github.com/tomstagl/cctop) | btop-style: Coach, Overview, Tools, Agents, Files, Events, Advisor | new |

Switch tabs by clicking a title. `Ctrl+X` then `Tab` gives the pane the keyboard, `Ctrl+X` with the arrows resizes it, `Ctrl+X` then `X`
closes the tab in front.

## What I changed

Mods are pinned unmodified in `claude-mods-local` (`cd510b1` for the three new ones), then patched. Every patch is an option whose
default is upstream's behaviour; v7 turns it on. Diffs in [`patches/`](patches/).

| | Upstream | v7 |
|---|---|---|
| The chat | skins (v2's renderer) | prismantis in the Ember preset (as v3 had it): `▍` orange headings, an accent bar on your prompts, tool rows dim on the right (`toolStyle: chat`) |
| prismantis tool output | `full`: what Claude Code shows; `quiet`: plain-words rows, but a shell command still shows its first lines | `toolOutput: rows` (new): nothing under a call that worked, in a group too; a failure keeps its last line, an edit keeps its diff, Ctrl+O on a group shows everything |
| prismantis copy | a toast, which Claude Code always labels with the mod's name ("prismantis: Copied") | `copyFeedback: button` (new): the button itself reads `✓ copied` for 1.5 s; a failed copy still toasts its reason |
| prismantis diffs | the Ember preset's mint and red, and the tint behind a changed line mixed from the colour's full hue (any green tints as pure green) | retro green `#98C25B` and the Ember orange-red `#E8553C`, and `diffTint: color` (new): the tint is mixed from those colours themselves, olive `#2E3A1B` and brown-red `#461A12`, code text still at 4.5:1 |
| paneline | restyles every message, tool row and the band above the prompt | `chat` option (new), off: only the pane |
| cockpit | a band above the prompt whenever its panel is not the tab in front, and a `◆ ctx · 5h · tools` status line (both showing `ctx —` until the first reply of a new process) | `band` and `statusLine` options (new), off: only the panel |
| cctop | opens only on `/cctop`; reads `HOME` (absent on Windows, so a "self-check failed" line every start); a "loaded" line in the transcript every start | `openOnStart` and `announce` options (new), a `USERPROFILE` fallback; the "loaded" line goes to the debug log |
| Background | the terminal on `#0A0908`, the panel on `#121110` | both on `#121110`: v2's palette `base.bg` moved there, and [`tools/background.mjs`](tools/background.mjs) rebuilt the theme, the Windows Terminal scheme and the status line palette from it |
| Spinner words | v2's list ("Pondering", "Noodling", "Spelunking the codebase", ...) | plain ones: Thinking, Reading, Working on it, Checking, Looking into it, Writing, Putting it together, Testing, Tidying up |

The kit (`v3-win/tools/kit.mjs`) gained a `settings` field for top-level `settings.json` keys like `spinnerVerbs`, with the same revert
(byte for byte if untouched, otherwise only its keys).

## Use it

```
node v7-win/tools/rice.mjs apply ember     # switch it all on (settings.json backed up first)
node v7-win/tools/rice.mjs revert          # put settings.json back as it was
node v7-win/tools/background.mjs ember     # after a palette change: rebuild theme, terminal scheme and deck palette (only what differs, backed up)
```

Restart Claude Code after apply or revert. The panes dock beside the chat in the fullscreen layout from 110 columns (Bridge from
144); narrower, they open above the prompt. The background change shows at once (Windows Terminal reloads its settings); to undo
it, put back `"bg": "#0A0908"` in `v2-win/palette/palettes.json` and run `background.mjs` again, or restore the snapshot
`before-v7-six-tabs`.

## Worth knowing

- **cctop's program.** The pane's context, cost and limits come from Claude Code itself; tool timings, files, agents and the
  Advisor need the `cctop` program. Upstream ships none for Windows, so until v7.3 those views said "needs the cctop binary".
  Since 2026-11-02 a local Windows build is installed (see [v7.3](#v73-after-the-master-2026-10-21-to-11-03)).
- **cockpit's guard starts off** (v7.3; upstream, and v7 until then, started it on). `/cockpit-guard on` or the panel's Guard
  button turns it on until the session ends; then, before a Bash command it calls risky, it asks Run it / Block it. With
  `skipDangerousModePermissionPrompt` on (it is here), nothing else asks. Its panel shows `ctx —` until the first reply of a
  newly started Claude Code: Claude Code only reports context after a reply.
- **Edits keep their diff card**; everything else is a single row.
- **Tab order** follows the order the mods open their panes at start, which v7 does not control, and it changes between starts.
  The pane opened last is the one in front; cctop restores its pane last, so it is in front at start. A mod cannot open a pane
  behind the others (`$.ui.open` has no such option).
- **Patched mods need a new version to load.** Claude Code runs each mod from a copy in
  `~/.claude/plugins/cache/kasasree-mods/<mod>/<version>/`, and `claude plugin update` copies again only when the manifest's
  version changes. Round 2's patches had not reached those copies until the final pass gave each patched mod a local version
  (`-rice.N`). After a patch: bump the version, `claude plugin marketplace update kasasree-mods`, then
  `claude plugin update <mod>@kasasree-mods`, and restart.

## On macOS, and bringing v7-mac's tweaks back here

v7 runs on a Mac as [`v7-mac/`](../v7-mac/): Ghostty and fish in place of Windows Terminal and PowerShell, the cctop program
installed, and the tweaks asked for once it ran there. The fixes it made to the shared tools work on both platforms, so
Windows behaves as before. The "am I the script being run" checks use `pathToFileURL`, `rice.mjs preview` still writes a
`.cmd` shim here, and the new status line variables do nothing unless set.

The tweaks are options, off by default. These steps brought them here on **2026-10-21** (`claude-mods-local` commits `4578153`,
`be02d20`, `a555158`; `v7-mac/tools/rice.mjs apply ember`, and the two `set` lines in the status line shim):

1. In `C:\Users\Kasasree\Projects\claude-mods-local`, `git apply` the two patches in `v7-mac\patches\`
   (`cctop-status-line.patch`, `prismantis-prompt-color-declined.patch`; they bump the versions). Copy `plugins/secret-box`
   from [ray-amjad/claude-code-mods](https://github.com/ray-amjad/claude-code-mods) at `6db48a3` into `plugins\secret-box`
   and add its entry from `v7-mac\marketplace\marketplace.json`; its mods run on native Windows (they wait with `node` or
   `ping`). Commit. Then `claude plugin marketplace update kasasree-mods`, `claude plugin update` for `cctop@kasasree-mods`
   and `prismantis@kasasree-mods`, and `claude plugin install secret-box@kasasree-mods`.
2. `node v7-win/tools/rice.mjs revert`, then `node v7-mac/tools/rice.mjs apply ember`. v7-mac's `version.json` is this
   one plus your messages in a white bubble (`promptStyle: bubble`, `promptColor` = the palette's text colour), calm
   declines (`declined: quiet`), nothing of cctop's under the prompt (`statusLine: false`), and Secret Box on and loaded
   last (`last`), so no other mod sees a real key.
3. For the half-row status line gap, add `set "AURORA_DECK_GAP=0"` and `set "AURORA_DECK_BARS=half"` above the `node` line in
   `~\.rice\current\statusline\aurora-deck.cmd`. v2's `apply` rewrites that shim, so add them again after one.

Trackpad scrolling (`wheelScrollAccelerationEnabled: false`) is macOS-only and not needed with a mouse.

## v7.3: after the master (2026-10-21 to 11-03)

What changed on this machine after v7.2, each one live (its version is in the plugin cache) and committed in
`claude-mods-local` (now `85eab70`). Its README, the full provenance and patch record for all sixteen pinned mods, is copied
in [`marketplace/`](marketplace/). v7-mac has all of it too (its README says how), except the Windows build of cctop.

| | Before | v7.3 | Patch |
|---|---|---|---|
| v7-mac's tweaks (2026-10-21) | the Mac only | here too: your messages in a white bubble, calm declines, nothing of cctop's under the prompt, the half-row status line gap, Secret Box loaded last | [`v7-mac/patches/`](../v7-mac/patches/), steps above |
| cctop's program | none for Windows (upstream: macOS and Linux) | **`~\.local\bin\cctop.exe`**, built from the same pin (`6ceafc3`); every pane view has data | [`cctop-windows-build.patch`](patches/cctop-windows-build.patch), below |
| cctop's `/cctop` skill | offers `cctop install` once; suggests `cargo install cctop` | **never offers either**, and says how the program is built here | [`cctop-skills-windows.patch`](patches/cctop-skills-windows.patch) (`0.10.0-rice.3`) |
| Secret Box's commit guard | read the repository off the command with one regex: `R=/x; git -C $R commit`, `git -C /c/x commit` and `cd /x && git commit` were refused (5 real refusals in the transcripts), and `cd other-repo && git commit` was checked against the session's folder, so a `.env` staged in `other-repo` got through | reads the command **as the shell would** (quotes, heredocs, subshells, `cd`, `-C`, `NAME=value`, `~`), tries the drive form of a `/c/` path, lets through a commit where there is no repository (git refuses it anyway); a folder only the running command knows is still refused, saying how to retry | [`secret-box-guard-switch.patch`](patches/secret-box-guard-switch.patch) (`0.5.3-rice.1`) |
| Turning Secret Box off | one option at a time, through `/plugin configure` | **`/secret-box [on\|off\|status]`** turns hiding and the `.env` guards off or on together; only from the prompt (composer or bridge), never a scheduled prompt, another session or another mod; `enabled` option (default on) for how it starts | same patch (`0.5.3-rice.2`) |
| Cockpit's guard | on at start | **off at start**; `/cockpit-guard on` or the panel's button for the session | [`cockpit-guard-off.patch`](patches/cockpit-guard-off.patch) (`1.0.2-rice.2`) |

Every patch applies to the marketplace as `claude-mods-local` held it at `a555158` (2026-10-21); the cctop build patch applies
to the cctop repository at `6ceafc3`.

**The cctop program on Windows.** Built on the `windows` branch of `claude-rice\cctop-windows`, a clone of tomstagl/cctop (gitignored
here; never pushed there). The Windows code is `src/win.rs` (process liveness, CPU time, the UTC offset and the process table
through `windows-sys`, in place of libc and `ps`) plus `cfg` switches at each call site. To rebuild it anywhere:

```
git clone https://github.com/tomstagl/cctop cctop-windows && cd cctop-windows && git checkout -b windows 6ceafc3
git apply ..\v7-win\patches\cctop-windows-build.patch
cargo build --release && copy target\release\cctop.exe %USERPROFILE%\.local\bin\
```

- The toolchain is the `stable-x86_64-pc-windows-gnullvm` Rust host with `rust-lld`, so no Visual Studio or MinGW (the plain
  `gnu` host fails: its `dlltool` wants an `as.exe` it does not ship). `~\.cargo\windows-import-libs` holds seven import
  libraries `winapi` asks for, copied from the `winapi-x86_64-pc-windows-gnu` crate.
- **Never `cargo install cctop`** (an unrelated crate, and `~\.cargo\bin` comes first on PATH) and **never `cctop install`**: tried
  on a copy of `settings.json`, its shim cannot run the `exec` the status line command starts with (blank status line, exit 0),
  serde_json re-sorts `enabledPlugins` (the mods' load order), and 22 hook events start running `cctop.exe`. Without it,
  `cctop query` has no status-line rate limits, hook tool timings or permission waits.
- Not working on Windows: the TUI's send-to-session key (`S`; sessions listen on a named pipe here) and `cctop split`. Not
  tested: the interactive TUI (`cctop run`) and the docked pane at a real terminal.
- Reviewed for reach, not line by line (54k lines of Rust; the patched parts were read): no HTTP client, the only socket code is
  an opt-in OTLP listener that refuses non-loopback addresses. It spawns `git`, `claude --version`, `clip` and itself.

**Load order.** `frontend-design@claude-plugins-official`, installed after the v7 apply, now comes after Secret Box in
`enabledPlugins`. It is skills only (no hooks module), so it is not in the mods' chain and Secret Box is still the innermost mod.
`v7-mac/tools/rice.mjs apply ember` would move Secret Box back to the end.

## v7.4: mods brought up to date (2026-11-23, Claude Code 2.1.330)

Every pin was compared with its upstream's newest commit. cockpit, cctop, image-view (and the unused token-weather and
mindful-breath) have no new commits. Two updates are live (in the plugin cache, `claude-mods-local` `62e35a3`), and three are
reviewed but held back, because each would change how the rice looks or behaves and needs your eye on it first.

| | Before | v7.4 | Patch |
|---|---|---|---|
| flightdeck | 0.4.0 (`6150b9f`) | **0.6.2** (`626cc0b`), unpatched: more key shapes masked (AWS ids, Google keys, JWTs, PEM keys, JSON-quoted keys) and in prompts, agent tasks and answers as well as tool inputs; control bytes stripped from what the pane draws; a quadratic masking pattern fixed; the context gauge measures against the compaction window; `paneColumns`; time to first token in the main box | none |
| Secret Box | 0.5.3 + v7.3's guard and switch | **0.5.14** (`5d6bd15`) + `0.5.14-rice.1`. Upstream since: private-key bodies printed without their BEGIN line and UUID session cookies are hidden (both leaked); the memory guard covers MultiEdit and NotebookEdit; `.env` is saved at the project root (after a `cd` into a bundled folder the key could ship inside the product); the commit guard rewritten (`hooks/commit-guard.js`), which fixes the refusals v7.3's guard was for, so that guard is retired | [`secret-box-0.5.14-rice.patch`](patches/secret-box-0.5.14-rice.patch) |
| Secret Box: a commit message that mentions git | read as commands: `-m "fix: cd x && git commit"` sent the guard to folders that don't exist, and a message naming `git add .env` (the v7.3 note below) was refused | **text**: a quoted `-m`/`--message`, what `cat`, `echo` or `printf` print inside `-m "$( )"`, and the heredoc of `git commit -F -`; anything in a message that runs (`$( )`, backticks, a `bash -c` there) is still read | same |
| Secret Box: `~` and `$HOME` | refused: Claude Code on native Windows has no `HOME` | **`USERPROFILE`** stands in where `HOME` is unset | same |
| Secret Box: `/secret-box on\|off` | v7.3 | the same switch and `enabled` option, ported | same |

Kept from upstream on purpose: a commit in a folder that is no repository yet is refused (the same command may `git init` first,
then commit a `.env`), and so is `R=$(git rev-parse --show-toplevel); git -C "$R" commit` (a `cd` in between would make "the
same repository" the wrong one; the refusal says to name the folder).

**Reviewed, not updated (needs you to look):**

- **prismantis** 0.25.1 -> 0.49.4 (330 commits). Upstream now has our `toolOutput: rows`, bubble prompts (its new default),
  alert colours and prompt and diff colours as options, so the port shrinks to the ember/amber/crimson presets, the `▍` heading
  bar, `copyFeedback: button` and `declined: quiet`. New defaults to override: `issueHint: true` adds a note to your prompt every
  tenth turn (set it off), `replyStyle: auto` draws Claude's replies in bubbles too, `folds: closed` folds long code blocks. It
  is the renderer for the whole chat, so this one should be tried on screen.
- **filetree** 0.2.26 -> 0.8.5 (403 commits; Windows in its CI; no local patches here). New: search, split preview, diffs,
  sort headers, protected files (`x`), a treemap, much more. Two things to decide: `work` (on by default) moves the session
  with `/cd` at the end of a turn into another repo Claude has been working in (the rice should set it off), and it adds a
  dim "in the file tree:" row of file links under any reply that names files, with no option to turn that off.
- **paneline** 0.4.1 -> 1.0.1 (89k lines changed, 109 hook files). It now runs `sh -c`, `sqlite3`, `ps`, `lsof` and `rm -f`
  (none on a native Windows PATH, so most new tabs would come up empty here), writes `.claude/settings.local.json` for its
  skill toggles, and restyles the chat with no option to leave it to prismantis (our `chat` patch would have to be rewritten).
  Its new guard is off by default. Held at 0.4.1.
- Not in v7 (switched off), so not updated: claude-hud (52 commits), skins (34), context-bar and usage-meter (79), firstmate-calm
  (1 commit to its folder).

## v7.5: code blocks on a tinted band (2026-11-24)

prismantis put a dim `── language` line over every code block, and `── code` over one that names no language, which read like
a stray heading. A new option, `codeStyle: panel` (prismantis `0.25.1-rice.4`, `claude-mods-local` `e673505`, patch
`patches/prismantis-code-panel.patch`), sets the code on a full-width band a step lighter than the terminal (ember `#1B1917`,
the Bridge's raised colour, on Rio's `#0A0908`), with two cells of padding, the language dim at the top right (nothing for an
untagged block) and the hover copy button in the band's corner. Highlighting, line numbers and folding are as before, and the
desktop app keeps its own code view. `codePanelColor` changes the band; `codeStyle: rule` is upstream's look. 4 new tests,
571/571; the Mac rebuild applies the patch and gives a prismantis identical to the live one.

## Is it safe

None of the mods makes network requests or model calls (`claude plugin validate` lists every `$.` call; the table with each mod's
reach is in [`marketplace/README.md`](marketplace/README.md)). Processes started: read-only `git` (cockpit, paneline, filetree,
secret-box), `grep` (paneline; not on Windows PATH, so it fails quietly), `du`/`find` (filetree), Secret Box's wait (`node` or `ping`),
and `cctop` (the local build since v7.3). v7.4's updates add no process, file or network reach: flightdeck still has none, and
Secret Box's is upstream's (`git check-ignore`, `.env` at the project root) plus reading `USERPROFILE`.

## Verified, and not

v7.4, 2026-11-23, Claude Code 2.1.330:

- `claude plugin test`: flightdeck 65/65; secret-box 422/422 (upstream's 380, `rice-guard.test.ts` 26: v7.3's real-session
  cases run as a Windows session plus the message and `USERPROFILE` cases, `switch.test.ts` 16). `claude plugin validate`: both
  pass; secret-box's reach is upstream's plus `$.command` (the switch) and `USERPROFILE`.
- secret-box's `commitBlockReason` against native `git.exe` and throwaway repositories, with `HOME` unset: 11/11 (a staged
  `.env` refused through `C:/`, `/c/` and `cd /c/...`; clean repos with messages that name other folders, `git add .env`, a
  heredoc and `-F -` all pass; `git add -A && git commit` with an untracked `.env` refused).
- `secret-box-0.5.14-rice.patch` applied to a fresh export of upstream `5d6bd15` gives the live mod. `sh
  v7-mac/tools/rebuild-marketplace.sh` (run here in Git Bash) clones every pin, applies every patch, passes its post-image check,
  and gives flightdeck and secret-box identical to the live ones. v7-mac's update steps, run on a copy of the marketplace at
  v7.3 (`85eab70`), do too.
- The cached copies (`~/.claude/plugins/cache/kasasree-mods/flightdeck/0.6.2`, `secret-box/0.5.14-rice.1`) equal the repo; Secret
  Box is still the last mod in `enabledPlugins`. Both take effect on the next start. Not seen yet: either one in a real session.

v7.3, 2026-11-15, Claude Code 2.1.325:

- `claude plugin test`: cockpit 19/19 (4 new), secret-box 83/83 (37 new: 21 for the commit guard, 16 for the switch).
  `claude plugin validate`: cctop, cockpit and secret-box pass. The cached copies of all three are the committed versions.
- cctop program: `cargo test --release` 447 of 449 pass (2 more ignored); the 2 failures are both in `otel`, a socket read
  under full-suite load, and `cargo test otel` alone passes 3 runs of 3. The pane does not use that listener.
- `cctop-windows-build.patch` applies with `git apply` to a fresh checkout of `6ceafc3`, and gives the `windows` branch's tree.
- The rice tests from the repo's new root: v7-win 8/8, v2 52/52, v3 7/7, v4 5/5, v5 5/5, v6 3/3 (their marketplace checks
  now find `claude-mods-local` inside the repo, as well as next to it as on the Mac).
- Secret Box, live in this session: a `git add … && git commit -F - <<EOF` whose message mentioned `.env` was refused before it
  ran. That is upstream's first check (any `git add` plus the text `.env` anywhere in the command), which v7.3 did not change;
  `git commit -F <file>` gets round it.

Final pass, 2026-10-17:

- `node --test v7-win/tests/*.test.mjs`: 8/8 (every mod on and told to open, prismantis replacing skins with rows, button copy
  and retro diff tints, cockpit panel-only, plain spinner words, every option declared in its mod's manifest, apply and revert
  byte-exact and key-wise). v2 52/52, v3 7/7, v4 5/5, v5 5/5, v6 3/3.
- `claude plugin validate`: all seven mods pass. `claude plugin test`: prismantis 562/562 (11 new), cockpit 15/15 (3 new),
  aurora-bridge 8/8, flightdeck 28/28, filetree 64/64.
- paneline 848/876: the new `chat-option.test.tsx` 3/3; the 28 failures are the ones unmodified upstream has on Windows.
- cctop: upstream's harness (outside `plugin/`) with three new tests, 128/130; the same 2 failures as upstream (CRLF snapshots).
- Live: `rice.mjs apply ember --dry-run` and `background.mjs ember --dry-run` both report nothing to change; every enabled mod's
  cached copy equals the repo; the screenshot above, at 210 columns. Not seen yet: a real turn with this setup, and the
  `✓ copied` flip under a real click.

## Layout

`version.json` (what v7 switches), `tools/rice.mjs` (CLI over `v3-win/tools/kit.mjs`), `tools/background.mjs`, `tests/`, `patches/`
(v7's, v7.3's `cockpit-guard-off`, `secret-box-guard-switch`, `cctop-skills-windows`, `cctop-windows-build`, and v7.4's
`secret-box-0.5.14-rice`, v7.5's `prismantis-code-panel`), `marketplace/` (the live marketplace's README and manifest at
`claude-mods-local` `e673505`),
`docs/screenshots/`.
