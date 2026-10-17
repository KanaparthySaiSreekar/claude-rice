# v7-win: Six tabs

**v7 is the master build:** it carries every preference in [`preferences.md`](../preferences.md) (finalised 2026-10-17, tag
`v7.2-win`; tweaks still to come).

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

- **cctop without its binary.** The pane's context, cost and limits come from Claude Code itself. Tool timings, files, agents and
  the Advisor need the `cctop` program (Homebrew or cargo only, not installed here), so those views say "needs the cctop binary".
- **cockpit's guard is on by default.** Before a Bash command it calls risky it asks Run it / Block it. `/cockpit-guard off` turns it
  off. Its panel shows `ctx —` until the first reply of a newly started Claude Code: Claude Code only reports context after a reply.
- **Edits keep their diff card**; everything else is a single row.
- **Tab order** follows the order the mods open their panes at start, which v7 does not control, and it changes between starts.
  The pane opened last is the one in front; cctop restores its pane last, so it is in front at start. A mod cannot open a pane
  behind the others (`$.ui.open` has no such option).
- **Patched mods need a new version to load.** Claude Code runs each mod from a copy in
  `~/.claude/plugins/cache/kasasree-mods/<mod>/<version>/`, and `claude plugin update` copies again only when the manifest's
  version changes. Round 2's patches had not reached those copies until the final pass gave each patched mod a local version
  (`-rice.N`). After a patch: bump the version, `claude plugin marketplace update kasasree-mods`, then
  `claude plugin update <mod>@kasasree-mods`, and restart.

## Is it safe

None of the mods makes network requests or model calls (`claude plugin validate` lists every `$.` call; the table with each mod's
reach is in `claude-mods-local/README.md`). Processes started: read-only `git` (cockpit, paneline, filetree), `grep` (paneline; not on
Windows PATH, so it fails quietly), `du`/`find` (filetree), and `cctop` (absent, detected as missing).

## Verified, and not

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

`version.json` (what v7 switches), `tools/rice.mjs` (CLI over `v3-win/tools/kit.mjs`), `tools/background.mjs`, `tests/`, `patches/`,
`docs/screenshots/`.
