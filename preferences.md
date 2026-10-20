# Preferences

What I liked in each version, noted as I try them. Each version is tried **on its own, completely**: nothing liked in one version is carried into the next. This list is only for the end, when I pick what to combine.

## v1 (minimal setup)
- The **flightdeck** pane: the live dashboard on the right.

## v2 (Claude Ember)
- The **colour theme**: orange to yellow on near-black. Still the best of all the themes so far (said after trying v3's Gruvbox).
- The **status line**.
- Not liked: the soft blur round the text (the glow shader).
- Not liked: the custom spinner words ("Pondering", "Noodling" and so on): too silly.

## v3 (prismantis, on its own in Gruvbox Dark)
- **Crisp text**: no blur on the letters (v3 has no glow shader).
- **Tool calls collapsed into one line** ("Ran 1 command", "Read 2 files"): clean, and kept apart from the chat.
- Not liked: the diff colours (plain red and green tints).

## v4 (Firstmate Calm, on Claude Code's own look)
- Nothing to keep. The sailboat spinner is not liked, and nothing else in it was useful.

## v5 (context and usage meters, on Claude Code's own look)
- The **meter bar itself is clean** (one row above the input: the stacked context bar, 5h and 7d bars, cost). Maybe for later.
- Not liked: its colour palette (the mods' own blues and purples).

## v6 (Mindful breathing band, on Claude Code's own look)
- Nothing to keep. Not liked at all.

## v7 (six right-hand panes as tabs, on v2 Ember; built to order, not a complete swap)
- **The master version**, with all my preferences (2026-10-17). Not final yet: tweaks to come.
- Asked for: six tabs (cctop, cockpit, paneline, filetree, flightdeck and v2's Bridge, "the waves one").
- Not liked: cockpit's band and status line repeating the context reading under and above the prompt (and showing `ctx —`). The v2 status line is the one that is right.
- Liked: the **black of the right panel** (`#121110`, not pure black). The terminal now uses it too.
- **prismantis was good**: it draws the chat again (with the tool rows below).
- Tab verdicts: still to come.

## v7 on macOS (v7-mac, 2026-10-20: Ghostty and fish on an M1 MacBook Pro)
- Asked for: **the fastest, most optimised** terminal and shell on Apple Silicon: Ghostty (no transparency, blur or shaders) with fish.
- **Trackpad scrolling** overshot: Claude Code's wheel acceleration is off now.
- **Your messages**: a **white bubble with white text**, not the orange bar.
- **"Chat about this"** on a question must not look like a failure (it showed "failed" in red with Claude Code's whole message).
- **Status line gap**: a full blank row between the two rows was too much, none was too little; **half a row** is right ("I like it now").

## Across versions
- **Code diffs:** a retro green for added lines and a retro orange-red for removed ones, not plain red and green.
- **Spinner words:** not silly, but not stiff and serious just for the sake of it either. Plain words for what is happening.
- **Tool calls (Bash, Read and the rest):** collapsed by default, one row on the right side, so they are never mixed up with the reply or its output.
- **Headings** in the orange accent (the `▍` bar).
- **Copying:** just a plain "copied" confirmation. Never a mod's name (prismantis, skins) in it.
- **No repeated numbers:** each reading shows once (the v2 status line), not again in another mod's line.
- **Your own messages:** a rounded bubble, white border and white text.
- **Things you chose** (declining a call, Chat about this): said calmly, never as a failure.

## How versions are kept
Before switching away from a version it is saved whole (`node v3-win/tools/snapshot.mjs save <name>`) and can be put back exactly (`restore <name>`). Saved: `v2.2-ember` (v2 as it was), `v3-gruvbox` (v3 on its own).
