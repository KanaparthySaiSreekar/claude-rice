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

## v6 (Breathing ember)
- *(not tried yet)*

## Across versions
- **Code diffs:** a retro green for added lines and a retro orange-red for removed ones, not plain red and green.
- **Spinner words:** not silly, but not stiff and serious just for the sake of it either. Plain words for what is happening.

## How versions are kept
Before switching away from a version it is saved whole (`node v3-win/tools/snapshot.mjs save <name>`) and can be put back exactly (`restore <name>`). Saved: `v2.2-ember` (v2 as it was), `v3-gruvbox` (v3 on its own).
