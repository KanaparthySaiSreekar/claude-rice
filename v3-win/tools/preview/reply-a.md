## Done

The bar now takes the palette's **ramp** and is *two cells shorter*. Edited `statusline/deck.mjs` in v3.0.0, 19 tests pass in 210ms. Notes: https://github.com/KanaparthySaiSreekar/claude-code-mods-research.

### What changed

| Part | Before | After |
|---|---|---|
| width | 16 cells | 14 cells |
| colour | fixed | palette ramp |
| refresh | 40 ms | 38 ms |

> [!WARNING]
> The `sunset` palette does not exist yet, so that apply failed.
