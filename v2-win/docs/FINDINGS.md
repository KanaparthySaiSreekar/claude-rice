# Findings: the non-obvious things v2 turned up

Each of these cost time to find. They are written down so the next person (or the next session) does not repeat them.

## Claude Code

- **Side panes are painted with a theme token the docs do not list.** `composerSidebarBackground` is `rgb(38,38,38)` in the stock dark theme, which is exactly the `#262626` grey flightdeck's pane showed. In a `dark-ansi` base it becomes `ansi:blackBright`, so the pane followed the terminal palette's bright black (found with a probe scheme: every ANSI slot a vivid, distinct hue; the pane took the grey of slot 8). The full token table is plain text inside the executable; a theme built on `dark` with that token set gives a pane that matches. A custom theme ignores unknown tokens, so a typo is silent: `tests/build.test.mjs` keeps a list of the real names.
- **Flightdeck draws its faint text with the `subtle` token.** Its default palette names theme tokens (`faint: 'subtle'`), so a dark `subtle` (a border colour) makes "nothing yet" nearly invisible. v2 gives the palette a separate `dim` tone for it.
- **Workspace trust is keyed on the git repository root.** A repository nested under a folder you trusted still shows the trust dialog; a plain subfolder of a trusted folder does not. That is why the demo project is deliberately not a repo. (The documented manual route, `projects["<path>"].hasTrustDialogAccepted` in `~/.claude.json`, was not used: that file is rewritten constantly by running sessions.)
- **Claude Code puts a messaging socket and token in the environment of its child shells**, along with `NO_COLOR=1` and a `CLAUDE_CODE_CHILD_SESSION` marker. A preview launched from inside a session inherits all of it, turns transcript saving off and shows a warning. `tools/preview/scene-claude.ps1` scrubs `CLAUDECODE`, `CLAUDE_CODE_*`, `CLAUDE_PID` and `CLAUDE_EFFORT` first.
- **`prompt_cache` is a documented status-line field** (Claude Code 2.1.251 and later), as are `pr`, `workspace.git_worktree`, `cost.total_lines_added`, `fast_mode`, `effort.level` and `vim.mode`. The status line runs through Git Bash when it is installed, so the command path needs forward slashes; the output is shown only after a zero exit.
- **`--no-chrome`** skips the one-time "Claude in Chrome extension detected" prompt that otherwise blocks a first run in a new folder.

## Windows Terminal

- **Pixel shaders work in 1.24 stable** (`experimental.pixelShaderPath`, plus a texture in `t1`), and so does a background image. Compile a shader with `d3dcompiler_47.dll` before pointing Windows Terminal at it.
- **The tab row is drawn opaque** whether or not Mica is on, whether or not `tabRow.background` is transparent, and whether or not `experimental.useBackgroundImageForWindow` is set. `terminalBackground` is the reliable choice. The coral `frame` colour does work.
- **A new tab inherits the environment of the process that ran `wt.exe`**, and an already-running Windows Terminal never refreshes its own PATH. Both bit this project.
- **Powerline glyphs (`U+E0B6`, `U+E0B4`) render correctly in Windows Terminal with JetBrainsMono NFM, and survive Claude Code's own renderer** in a status line. (`⎇` also *displayed*, but it is not in that font: it came from a fallback font and could overlap its neighbour. v2.2 uses `⌥`, which the font has; see "Detail colour and the status line".)

## The screenshot harness

- **A DPI-unaware process gets a window that is 80% of its real size** (a 125%-scaled window is reported 1221 pixels wide when it is 1526), so captures were cropped on the right and bottom until the harness called `SetProcessDPIAware`.
- **`PrintWindow` captures only that window; a screen-region copy also records whatever is behind the window's rounded corners.** One such capture showed a few words of another window, so that mode was deleted, not just avoided. The harness now throws if `PrintWindow` ever returns black.
- **Colour disappears in a preview** because the child inherits `NO_COLOR=1` and PowerShell then strips every escape code. The harness clears it.

## Windows and Git Bash

- Backslashes in `echo`, `printf` and heredoc bodies are collapsed by this Git Bash layer; test JSON containing Windows paths from files, and write code containing backslashes with an editor tool, not a heredoc. (It broke a `\n` in a generated script twice.)
- Git Bash and Node disagree about what `/tmp` is.
- A pinned directory marketplace is read live, so `git status` in it is the tamper check.

## Writing a mod (the Bridge pane)

- **`h` is the JSX factory.** JSX compiles to calls of a global `h`, so a local `const h = ...` (a "height", say) shadows it and the pane fails with `h is not a function`. The engine reports it as a skipped `ui.render` hook; found with `claude plugin test`, not by reading the code.
- **`claude plugin validate` follows `$` only into top-level function declarations.** Passing `$` to a helper defined inside `register` is refused ("not a function declared at the top of this file"); pass it to a top-level `function` (or an imported one) and the validator then lists the calls it makes "via" that function. A state contract (`types/index.d.ts`) must be self-contained: no `import`, and any top-level `type` must be exported.
- **`claude plugin test` hands the test body `($, on)`.** `$` has the engine's nouns (`turn`, `tool`, `agent`, `session`, `command`, `ui`, `classic`, ...) to *raise* events through the plugin; `on` registers what the engine itself would answer beneath it (`on('turn.start', ...)`, `on('ui.render', ...)`). A hook that calls `$.clock.now()` needs a stand-in too, and the stand-in's answer must be a "result object", not a bare number, so the Bridge uses `Date.now()` and keeps the tests free of a fake clock. `$.ui.mount({ plugin, surface, component, requestId, viewport, props })` returns a handle with `drawn()`, `find`, `unmount`; one instance per request id, so unmount between looks.
- **Observers should still be written to fail open.** A hook that throws is skipped by the engine, which is safe, but wrapping the state write in a `try` means a bookkeeping error cannot even cost the call its timing. Every hook hands its event on unchanged and a test checks that denies, error results and gate verdicts come back exactly as the engine gave them.
- **`$.ui.blit` repaints a Raster in place** (the heartbeat) and costs nothing in layout; `$.ui.invalidate('ui.render')` is for the text. A `$.clock.every` timer outlives its hook, so the Bridge starts one in `session.start` and lets it skip most ticks when idle.
- **Eighth-block glyphs (`▁▂▃▄▅▆▇█`) are the finest vertical step a terminal cell offers**, enough for an equaliser. The first heartbeat was a smooth aurora painted with `▀` half-blocks (two pixels per cell); it looked good in numbers and poor on screen, for two reasons that are worth remembering: curtains that were screen-averaged drifted to a washed mauve (blend with screen, not by tone-mapping toward white), and a profile that is sharper on one side of a curve's centre than the other leaves a visible seam that jumps between rows as the curve moves (fade the asymmetry in over a distance instead of switching at zero). Low-contrast gradients also band badly in 8 bits: a handful of adjacent cells end up with identical values.
- **A background picture is not "visual ricing".** The aurora background was the first thing rejected. v2 now defaults to a flat near-black with one hot accent; a palette with `"art": null` produces no picture, and `apply` removes a previous palette's picture from the Windows Terminal defaults.
- **A bloom shader must not lift flat areas.** A plain bright-pass blur adds light everywhere it is already bright, which washes out a pane fill and a gradient bar. A difference of blurs (add only where the blur is brighter than the pixel) leaves fills alone and glows only the edges of small bright shapes.

## Detail colour and the status line (v2.2)

- **A reply is only as colourful as the skin's tool slots.** The skin takes inline code from `search`, paths and types from `read`, links and keywords from `web`, version numbers and function names from `mcp`, strings from `run` (its own comment says "the tool kinds' colours carry the syntax"). The first Ember made `read` and `search` near-white creams, so paths, types, inline code and numbers all read as white. Headings stayed orange, which hid the problem in a quick look. A palette needs a distinct, tinted colour per slot, and `tests/build.test.mjs` now checks chroma (not near white), distance (no two alike) and hue (no cool synth colours).
- **Claude Code's theme cannot recolour syntax in diffs.** There are no syntax tokens in the 72, only the `syntaxHighlightingDisabled` setting; the diff inside an Edit row keeps a fixed Monokai-style set (pink, cyan, green, purple). Searched the binary for the colours and the theme table to be sure.
- **Status line glyphs must exist in the terminal font.** Read the font's glyph table (WPF `GlyphTypeface.CharacterToGlyphMap` on the `.ttf`): JetBrainsMono NFM lacks `✦ ⎇ ✱ ✖ ↻ ◷`. Windows Terminal draws a missing glyph from a fallback font at another width, and it spills into the next cell. That, not the line's own spacing, was the overlapping reset arrow. Replacements that the font has: `◆ ⌥ ● ✕ ◔ ◕`.
- **Claude Code drops empty status-line rows.** An empty line and an escape-only line (`ESC[0m`) both gave no gap; a line holding one zero-width space (`U+200B`, in the font, not trimmed by JavaScript) gave one clear row.
- **Preview tooling traps.** `preview-install` reuses an existing build, so run `build` first when a palette changed. `preview-claude seed` rewrites the skins store from the *first* backup it ever took, so after previews re-run `apply` rather than trusting `restore`. The status line reads its palette from the applied copy unless `AURORA_DECK_PALETTE` points elsewhere (the preview shim sets it). `pwsh -File` mangles array arguments: call a script with arrays in-process instead.
- **`String.replace` treats `$` specially in the replacement.** A `$` followed by a backtick inserts everything before the match, `$&` inserts the match, `$1` a group. Editing markdown or code that contains `` `$` `` with `replace` pasted the first 4,319 characters of this file into the middle of a sentence three times, and that damaged version was committed and pushed in v2.1. Found 2026-10-17 by reading the file; the repair reverses it exactly. Use `split(a).join(b)` or a function replacer, or the editor tool, and read the result.
- **The shell layer rewrites `\u` sequences.** Typing the six characters backslash, `u`, `2`, `0`, `0`, `b` in a command turned into the character itself in the file. Build the escape from pieces (`String.fromCharCode(92) + "u200b"`) when the source must contain the escape text.

## Erratum for v1-win

`v1-win/config/skins/claude-warm.json` recorded the skin's base as `noir`; the live store has `gruvbox`. All 15 slots are set so nothing renders differently, but the file now says what the store says.
