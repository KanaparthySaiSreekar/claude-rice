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
- **Powerline glyphs (`U+E0B6`, `U+E0B4`) and `⎇` render correctly in Windows Terminal with JetBrainsMono NFM, and survive Claude Code's own renderer** in a status line.

## The screenshot harness

- **A DPI-unaware process gets a window that is 80% of its real size** (a 125%-scaled window is reported 1221 pixels wide when it is 1526), so captures were cropped on the right and bottom until the harness called `SetProcessDPIAware`.
- **`PrintWindow` captures only that window; a screen-region copy also records whatever is behind the window's rounded corners.** One such capture showed a few words of another window, so that mode was deleted, not just avoided. The harness now throws if `PrintWindow` ever returns black.
- **Colour disappears in a preview** because the child inherits `NO_COLOR=1` and PowerShell then strips every escape code. The harness clears it.

## Windows and Git Bash

- Backslashes in `echo`, `printf` and heredoc bodies are collapsed by this Git Bash layer; test JSON containing Windows paths from files, and write code containing backslashes with an editor tool, not a heredoc. (It broke a `\n` in a generated script twice.)
- Git Bash and Node disagree about what `/tmp` is.
- A pinned directory marketplace is read live, so `git status` in it is the tamper check.

## Erratum for v1-win

`v1-win/config/skins/claude-warm.json` recorded the skin's base as `noir`; the live store has `gruvbox`. All 15 slots are set so nothing renders differently, but the file now says what the store says.
