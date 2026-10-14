# Mods Turn Claude Code Into a Canvas

Claude Code mods are plugins whose JavaScript or TypeScript "hooks module" runs inside Claude Code's own process. That makes them the first extension type that can draw interface, restyle Claude Code's own spinner, tool rows and messages, add instant slash commands, and rewrite or answer events such as tool calls and prompts ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)). They launched on by default in v2.1.287 on October 1, 2026 ([CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)). Within two weeks, an independent scanner had catalogued **3,836 mods in 1,987 candidate repos**: **1,566 can run host processes**, 421 reach the network, and 50 fail validation ([catalogue.md](https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/catalogue.md)). Installing a mod takes two commands, but trusting and running one is harder. Mods are unsandboxed, the API reference describes v2.1.290 while v2.1.299 ships, mod UI draws only in the terminal and Desktop app, and the best visuals need Ghostty or kitty, fullscreen, wide, and outside tmux. For ricing, a layered stack beats any single mod. Start with a fast terminal whose palette tmux and Claude's own theme share. Add a two-line status line for model, git, context and 5-hour/7-day quota, and hooks that make "Claude needs you" audible. Finish with exactly one band mod, one pane mod and one transcript skin, plus companion tools for history and multi-session state. The biggest wow comes from pixels, other people and personality: multiplayer Doom while Claude works, inline video of Claude testing your app, a browser in a pane, pixel companions, Warcraft voice lines. The community's verdict is consistent: pure decoration gets mocked, while ambient flourishes that carry information get kept.

## Mods run inside Claude Code, so only they can draw on it

Anthropic defines a mod as "a plugin that changes how Claude Code looks and behaves". A mod is a set of handlers that Claude Code calls "when an event happens, such as a tool call, a submitted prompt, or a part of the interface being drawn", and each handler can "watch the event, change it, or take it over" ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)). The feature began as a public "function hooks" proposal on September 3, 2026 and was renamed Claude Mods on September 9. It launched on October 1, requiring **v2.1.287** in the terminal and v2.1.286 in the Desktop app's Code tab ([Issue #91870](https://github.com/anthropics/claude-code/issues/91870); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)). The launch post is blunt about why: "hooks can't rewrite events, draw new UI, or replace features. Mods can." It also says the built-in `/diff` panel is now itself a mod you can disable or replace, and that more built-ins will follow so users can "pare Claude Code down to a small core" ([Announcement](https://claude.com/resources/articles/claude-code-mods)).

Mechanically, mods are Express- or Koa-style middleware. Each handler receives the mods API object `$`, a deeply frozen event `e`, and a `next` function. It can **observe** by returning `next(e)`, **rewrite** by calling `next` with a modified copy, or **answer** by returning a result without calling `next`. Every side effect goes through `$`, including drawing, files, processes, network and model calls. That rule is why Claude Code can list what a mod does before you install it ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview); [Reference](https://code.claude.com/docs/en/plugins/mods/reference)). The official comparison makes the division of labor explicit.

| | Mod | Settings hook | Skill | MCP server |
|---|---|---|---|---|
| What it is | Functions Claude Code calls in its own process | Shell command, HTTP request or prompt run on a lifecycle event | `SKILL.md` instructions Claude reads | External process giving Claude tools |
| Can draw in the interface | **Yes** | No | No | No |
| Pick it when | You want a pane, a band, a custom command, or to rewrite an event | You want to block, allow or log with an existing script | You keep pasting the same instructions | Claude needs an external system |

Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).

The other look-and-feel layers sit beside mods rather than inside them. Plugins can carry color themes (`themes/<slug>.json`, which appear in `/theme`) and output styles, but these are separate components, not mods ([Add components to a plugin](https://code.claude.com/docs/en/plugins/components)). A plugin cannot ship your main `statusLine`, only a `subagentStatusLine`, so status-line tools install through setup commands that edit your settings ([Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference)). Mods did not replace the status-line contract. They added a parallel set of surfaces that run in-process.

### Six kinds of surface, one shared band, 30 redraws a second

A mod draws in six kinds of place. **Panes** sit as a sidebar beside the transcript in a wide fullscreen terminal, or as a framed region above the prompt otherwise; a mod can open one on its own only at **144 columns**, or 110 once you have opened it manually. **The band above the prompt** is "always there, and every mod shares it", and a mod that returns its own tree replaces later mods' output unless it nests `await next(e)`. Mods can also redraw Claude Code's own render sites: the spinner, tool-use and tool-result rows, user and assistant messages, the question dialog, footer mode labels, the prompt hint line, the turn-duration line and info notices. The permission prompt is explicitly off-limits. Fire-and-forget outputs cover the rest: a persistent `⚠ mod-name:` status line under the prompt, toasts, dim transcript log lines, native notifications (v2.1.295+) and a line under each answer. Finally, mods can draft text or ghost-text suggestions into the prompt box and play sound or speech ([Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface); [Reference](https://code.claude.com/docs/en/plugins/mods/reference)).

The element kit goes well beyond what a status-line script can print. It has bordered `Box` layouts in ten border styles, styled `Text`, hotkeyed `Button`s, `Input` and `Select` fields, `Markdown`, and syntax-colored `Code` with a diff mode. `Raster` draws grids of up to 512×256 colored cells, in the terminal only. `Image` draws real PNGs up to 2 MiB, but only in **kitty 0.28+ and Ghostty**, and never inside tmux or screen. `Svg` renders only in Desktop, and `Client` modules bring their own frame clock and pointer input ([Reference](https://code.claude.com/docs/en/plugins/mods/reference); [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery)). Redraws are driven by events, not a timer, and are capped at **10 per second, or 30 in the terminal for the visible pane, band and hint line**. Pixel blits are accepted up to 120 a second, with "some sixty" shown ([Reference](https://code.claude.com/docs/en/plugins/mods/reference); [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts)).

The data side is just as rich. A free `$.session.usage()` call returns context tokens, window size and percent, plan rate limits with reset times, and cost, the same figures the status line gets. One wrinkle: Anthropic's sample band read 81% when Claude's built-in notice read 90%, because the notice measures toward the auto-compact point ([token-weather README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather)). Turn events add per-request input, output and cache tokens plus the answering model. `tool.call` sees every argument, `$.session.messages()` returns the newest 4,096 transcript entries, and git runs through `$.process.run` ([Events](https://code.claude.com/docs/en/plugins/mods/events); [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)).

### Building a mod takes a sentence; trusting one takes reading

The fastest way to get a mod is to ask Claude for one, for example "make a mod that shows the current git branch above the prompt". A built-in `plugin-authoring` skill writes it to `~/.claude/dev-mods/<session-id>/` and offers hot reload. The mod loads only in that session and is deleted after `cleanupPeriodDays`, so copy it out if you want to keep it ([Create a mod](https://code.claude.com/docs/en/plugins/mods/create)).

Writing one by hand needs three files: a normal `plugin.json`, a `hooks/hooks.json` with a `modules` key, and an ES module that exports `register(on, options)`. TypeScript loads directly with no build step, and `claude --plugin-dir ./my-mod` hot-reloads on every save. `claude plugin validate` statically prints a mod's hooks and `$` calls, and `claude plugin test` runs its tests. Claude Code also writes types for your exact build into `.claude-plugin/types/` and tells you to "trust these files over any page" ([Create a mod](https://code.claude.com/docs/en/plugins/mods/create)). That advice matters: releases after the reference's v2.1.290 snapshot have already added `$.ui.notify`, `Text` sizes and weights, and prompt autocomplete rows ([CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)).

Installing uses the plugin machinery unchanged: `/plugin install name@marketplace` in a session, or `claude plugin install … --scope user|project|local` in a shell. `/plugin` then reports a line such as `1 mod active · first-mod` ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview); [Install plugins](https://code.claude.com/docs/en/plugins/install)). There are two kill switches. `claude --safe-mode` turns mods off for one session. `"disableAllHooks": true` turns them off everywhere, but it also stops your settings hooks and your custom status line, and it leaves built-in mods running ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)). Where Claude Code runs decides whether you see a mod at all.

| Where Claude Code runs | Mod hooks run | Mod UI appears |
|---|---|---|
| `claude` in a terminal (including IDE terminals) | Yes | Yes |
| Desktop app, Code tab | Yes | Yes, except terminal-only elements |
| VS Code extension chat panel | Yes | **No** |
| `claude -p` / Agent SDK | Yes | No |
| Cloud sessions | Yes, for plugins that reach the session | No |
| Desktop WSL session | No | No |

Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).

The trust model is the real constraint. Anthropic says plainly that "Mods aren't sandboxed". A mod can read secrets in environment variables and settings, see every prompt and tool call, approve a tool call before you are asked (even one an `ask` rule would have stopped), call a model on your plan, and start processes that run outside the Bash sandbox ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)). Deny rules do not cover a mod's own file access: "with `Read(.env)` denied, a mod can still read that file with `$.fs.read`" ([Admin](https://code.claude.com/docs/en/plugins/mods/admin)). Hooks fail open by default, so a broken guard is silently skipped ([Events](https://code.claude.com/docs/en/plugins/mods/events)). Each hook gets **10 seconds of CPU per event**, or 50 ms for `prompt.edit`. After three crashes of the shared worker, every non-built-in mod is turned off for the session ([Reference](https://code.claude.com/docs/en/plugins/mods/reference); [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot)). On Team/Enterprise or managed machines, the built-in `sec-default` guard loads first and skips user mods' prompt-shaping and `classic.*` hooks. Purely visual mods are unaffected ([sec-default README](https://github.com/anthropics/claude-code/blob/main/mods/sec-default/README.md)).

The first-party starter kit is small. Claude Code ships six built-in mods: `/diff`, AGENTS.md support, the organization guard, telemetry, the `plugin-authoring` skill, and an opt-in side agent called "You should know". That last one posts notes above the prompt; enable it with `/plugin enable cc-plugin-you-should-know@builtin` (it requires telemetry) ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)).

Anthropic DevRel also published three samples, in a 230-star repo "provided as-is, with no support" ([claude-code-playground](https://github.com/anthropics/claude-code-playground)). **Token Weather** is a context "forecast" band running from ☀ Clear to ↯ Compact soon, with a sparkline of recent turns, built in "about 80 lines". **Blast Radius** freezes `rm -rf`, `git reset --hard` or a force push and shows exactly what would change, with Proceed/Cancel hotkeys; it calls itself "a safety net, not a permission system". **Replay Theater** steps through the last turn's edits as diffs ([claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)).

Thariq Shihipar's **next-steps** rounds out the set from Anthropic's community marketplace. After each turn, it drafts three follow-up prompts using `$.model.fork`, which shares the prompt cache ([next-steps](https://github.com/anthropics/claude-plugins-community/tree/main/next-steps)). No official theme or "rice" pack exists yet; the look of Claude Code has been left to the community.

## The community shipped 3,836 mods in two weeks, few with any track record

The list at [karanb192/awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods) (574 stars, CC0) is not a hand-curated awesome list. It is the front end of a scanner. Every day the scanner code-searches GitHub for `hooks.json` files with a `modules` key, and every three hours it searches repository topics ([contributing.md](https://github.com/karanb192/awesome-claude-code-mods/blob/main/contributing.md)). It runs `claude plugin validate` on each hit and assigns a **reach level**. L0 means the mod only "draws and remembers" (435 mods). L1 means it also reads (897). L2 means it writes files, runs processes or drives Claude (2,019). L3 means it reaches the network (485) ([SCANNING.md](https://github.com/karanb192/awesome-claude-code-mods/blob/main/SCANNING.md); [catalogue.md](https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/catalogue.md)). The maintainer calls the reach level "a footprint, not a verdict", and warns that validation "does not guarantee safe behavior or runtime compatibility" ([README](https://github.com/karanb192/awesome-claude-code-mods#use-mods)).

The six hand-picked **Featured** mods are the closest thing the list has to a best-of, and they lean toward ricing ([README](https://github.com/karanb192/awesome-claude-code-mods#featured)). **cache-tax** keeps the prompt cache warm and blocks one "cold" send to show you its cost. **image-view** turns pasted images into real thumbnails, and **prismantis** renders tables, Mermaid diagrams and charts in the transcript with copy buttons. **flightdeck** is a live dashboard of context, cost, permission checks and subagents that only observes. **filetree** is an IDE-style tree that shimmers as Claude reads and edits files, and **prompt-rail** is a clickable strip of your past prompts. The list's banner is a browser running inside Claude Code ([terminal-browser](https://github.com/zenbu-labs/terminal-browser)). A companion `mod-finder` MCP plugin lets you filter the catalogue by reach, for example `--without network` ([finder README](https://github.com/karanb192/awesome-claude-code-mods/blob/main/finder/README.md)).

The scan's own data is the best guide to quality. **1,203 of the 1,909 hosting repos have zero stars**, and together they hold 2,005 mods. **3,431 mods live in repos created in October 2026.** Of all mods, 3,123 pass validation cleanly, 482 pass with warnings and 50 fail, while 897 carry no license ([mods.json](https://github.com/karanb192/awesome-claude-code-mods/blob/main/data/mods.json)). Stars are counted per hosting repo, so the 74k-star ruflo product, which bundles 45 mod plugins, dominates any "most starred" view ([llms.txt](https://github.com/karanb192/awesome-claude-code-mods/blob/main/docs/llms.txt)). Release history is a better maturity signal. Only a handful of showcase mods have double-digit release tags: [terminal-browser](https://github.com/zenbu-labs/terminal-browser) (53), [prismantis](https://github.com/NahumLitvin/prismantis) (36), [pokemon](https://github.com/dgokcin/claude-pokemon-mod) (20) and [skins](https://github.com/hellosverre/claude-skins) (16).

Most of what people built is about awareness rather than looks. Categories in the table overlap, because they come from keyword matching ([mods.json](https://github.com/karanb192/awesome-claude-code-mods/blob/main/data/mods.json)).

| Category | Share of mods |
|---|---|
| Git, PR and CI | 15.9% |
| Usage, cost and rate limits | 14.3% |
| Safety guards | 14.1% |
| Tasks and plans | 12.9% |
| Context and compaction | 10.6% |
| Themes and skins | 6.7% |
| Pets | 4.4% |
| Games | 2.6% |

The **band above the prompt (1,655 mods) and side panes (1,614)** are the canvases of choice. Far fewer mods rewrite the transcript (459), push pixels (212), restyle the spinner (171) or play audio (155). Some ideas are crowded: there are 407 context gauges, 180 cache timers and 62 mods with "Clawd" in the description. Others don't exist yet. The scan found **zero** accessibility mods, session-to-video exporters, pane-layout managers or per-task cost attributors.

Because the scanner relies on GitHub search, it misses well-known mods, including Anthropic's own playground samples and next-steps. Cross-checking two or three catalogues is worth the effort, and each takes a different approach. Singh-AP's list is curated and tested, and it comes with a pinned marketplace ([Singh-AP](https://github.com/Singh-AP/awesome-claude-mods)). claudemods.ai is voted; its editor's pick, cc-arcade, is "the mod that made people notice function hooks" ([claudemods.ai](https://claudemods.ai/blog/top-10-claude-mods)). Baselane's catalogue is commit-pinned: "every mod here passed automated checks and is pinned to the commit that passed them" ([baselane-sh/mods-catalog](https://github.com/baselane-sh/mods-catalog)). And mod-store browses mods from inside a session, showing each one's access before you install it ([mod-store](https://github.com/hellosverre/mod-store)).

Reception split sharply by venue. "Introducing Claude Mods" drew **1,118 points on r/ClaudeCode** ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvc7vc/)). The official blog link on Hacker News drew **6 points and no comments** ([HN](https://news.ycombinator.com/item?id=49925102)). Reddit figures in this report are archived snapshots, so October posts are probably undercounted. The @ClaudeDevs announcement on X reached about 4.3 million views in three days. YouTube filled with explainers, led by Chase AI's 174k-view "biggest upgrade since Skills"; StationX found about a quarter of 34 reviewed videos already carrying outdated pre-launch setup steps ([StationX](https://app.stationx.net/articles/claude-code-mods)). The strongest skeptical case came from inside the industry. On Latent Space, swyx argued that unlimited customization confuses users and that opinionated defaults are better. Thariq Shihipar's answer was that skills can supply the opinions ([Latent Space](https://www.latent.space/p/thariq)). Builders agree that "creating a usage band is a natural first mod" ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvz855/)). Skeptics answered a pet demo with "you put a pink bunny on your screen? That's what mods do? I'll pass" ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wx88w2/)). Another user asked the question that matters most: "which mods are still in people's workflow after a week or two" ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyi34j/)). One early adopter admitted to becoming "more focused on the workflow and tools than my actual work" ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvc7vc/)).

Breakage is already real. v2.1.287 began skipping `ui.render` rewrites whose text contains ANSI escapes, so several early mods "silently fall back" ([issue #21](https://github.com/karanb192/awesome-claude-code-mods/issues/21)). The 146-star **effortless** model router fails validation on v2.1.296 ([mods.json](https://github.com/karanb192/awesome-claude-code-mods/blob/main/data/mods.json)). Platform gaps are just as limiting: the VS Code extension never draws mod UI ([#99045](https://github.com/anthropics/claude-code/issues/99045)), Intermission needs the Rio terminal on Windows ([intermission](https://github.com/jarrodwatts/intermission)), and galactic-battle's author reports that the mods API's audio plays only on macOS ([galactic-battle](https://github.com/DarkVelours/claude-code-galactic-battle)).

Security researchers testing preview builds found serious problems. A mod silently read Claude's credentials and history and sent them out. `claude plugin details` reported "Hooks (0)" for a mod that hooked everything. A fake credential prompt was drawn above the input, and a mod fetched new code after it had passed review ([Pluto Security](https://pluto.security/blog/claude-code-function-hooks-security/)). Dash Security added EDR blind spots, because every action appears to come from the Claude process ([Dash Security](https://dash.security/blog/claude-mods-the-new-attack-surface-built-in)). Those tests predate launch, but their core premise, in-process and unsandboxed code, is Anthropic's own description.

My verdict: **mods are worth using now for visibility and ambience, but not yet for anything you would trust to guard production.** They pay off when you work in the terminal or the Desktop app, inside a wide fullscreen Ghostty or kitty window. Install one mod per surface, since the band is shared and transcript re-skins compete for the same render sites. Read each mod's `claude plugin validate` output before installing it. A cosmetic mod's `calls:` line should mention little beyond `$.ui.*`, `$.session.usage`, `$.state`/`$.store` and `$.clock`. A "theme" that also asks for `$.http.fetch`, `$.process.*`, `$.env.get` or `$.fs.read` is requesting exactly the capabilities Anthropic's admin guide tells you to scrutinize ([Admin](https://code.claude.com/docs/en/plugins/mods/admin)).

## Ghostty or kitty, one palette and the built-in settings do most of the look

### Two terminals get the deepest support; the rest need workarounds

Ghostty and kitty get the deepest built-in support. Both handle Shift+Enter natively and send desktop notifications by default, even over SSH ([Terminal config](https://code.claude.com/docs/en/terminal-config)). They are also the only terminals where a mod's `Image` element draws as a real picture ([Gallery](https://code.claude.com/docs/en/plugins/mods/gallery)). Ghostty 1.2.0+ additionally shows Claude's tab and dock progress bar ([Settings reference](https://code.claude.com/docs/en/settings-reference)). The Claude Code team points the same way. A Claude Code TUI engineer told Hacker News that Ghostty supports synchronized output and shows zero flicker ([HN](https://news.ycombinator.com/item?id=46701013)), and Boris Cherny says the team likes it for synchronized rendering, 24-bit color and Unicode ([X](https://x.com/bcherny/status/2017742753971769626)).

| Terminal | Shift+Enter | Desktop notification | Progress bar | Mod images | Agent-team split panes |
|---|---|---|---|---|---|
| Ghostty | Native | Default, also over SSH | 1.2.0+ | Yes | No (use tmux) |
| kitty | Native | Default | Not listed in Claude's docs | 0.28+ | No (use tmux) |
| iTerm2 | Native | One-time alert filter setting | 3.6.6+ | No | **Yes**, via `it2` |
| WezTerm | Native per docs; disputed on WSL2 | Bell or hook | No | No | No |
| Warp | Native | Official plugin | No | No | No |
| Windows Terminal | Native | Bell or hook | No | No | No |
| VS Code / JetBrains | `/terminal-setup` / Ctrl+J | Bell or hook | No | No | No |

Synthesized from [Terminal config](https://code.claude.com/docs/en/terminal-config), [Settings reference](https://code.claude.com/docs/en/settings-reference), [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery), [Agent teams](https://code.claude.com/docs/en/agent-teams), [Warp docs](https://docs.warp.dev/agent-platform/third-party-agents/claude-code) and [#52683](https://github.com/anthropics/claude-code/issues/52683).

The other options each carry a catch. WezTerm's last stable release dates from February 2024, so fixes reach users only through nightly builds ([wezterm](https://github.com/wezterm/wezterm)). Windows Terminal needs `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT=1` if stale fragments appear ([Fullscreen](https://code.claude.com/docs/en/fullscreen)). In VS Code, `/terminal-setup` adds Shift+Enter and also turns off the terminal's GPU acceleration ([Terminal config](https://code.claude.com/docs/en/terminal-config)). The agent-native alternative is cmux, a Ghostty-based macOS terminal with about 28k stars that rings any pane whose agent needs you in blue ([cmux](https://github.com/manaflow-ai/cmux)).

Whatever the terminal, the **fullscreen renderer** turns Claude Code into a canvas. Enabled with `/tui fullscreen`, it has been the default for new users since May 6, 2026. It brings flicker-free output, mouse support, and a docked `/diff` panel and mod panes. The price is that the terminal's own search can no longer see the conversation; press Ctrl+O and then `[` to dump it into native scrollback ([Fullscreen](https://code.claude.com/docs/en/fullscreen)). Since v2.1.295, Claude Code also emits OSC 7501 program status (working, waiting on you, done) for terminals that implement Mitchell Hashimoto's new spec ([Terminal config](https://code.claude.com/docs/en/terminal-config#see-session-status-in-your-terminal); [mitchellh.com](https://mitchellh.com/writing/program-status-osc7501)). Which terminals visibly display it today is still unconfirmed.

### One palette everywhere beats a clever theme

Claude Code "does not control the terminal's own color scheme" ([Terminal config](https://code.claude.com/docs/en/terminal-config#match-the-color-theme)), so matching comes down to two routes.

The zero-maintenance route is the `dark-ansi` or `light-ansi` theme. It draws only with your terminal's 16 ANSI colors, so Catppuccin, Tokyo Night or Gruvbox flow straight through, while `auto` follows the terminal's light or dark mode ([Settings reference](https://code.claude.com/docs/en/settings-reference#theme)).

The pixel-perfect route is a custom theme file at `~/.claude/themes/<slug>.json`. The file picks a `base` preset and overrides any of more than 60 color tokens. Those include the spinner shimmer (`claudeShimmer`), eight subagent colors, the seven-color `ultrathink` rainbow, diff backgrounds and your own message background. Theme files hot-reload while you edit, have been supported since v2.1.118, and can ship inside plugins ([Terminal config: custom themes](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)). The official example is a three-line Dracula: `{"name": "Dracula", "base": "dark", "overrides": {"claude": "#bd93f9", "error": "#ff5555", "success": "#50fa7b"}}`.

Two caveats apply to both routes. Inside tmux, **Claude clamps to 256 colors** unless you set `CLAUDE_CODE_TMUX_TRUECOLOR=1` and also enable tmux's `Tc` override ([Env vars](https://code.claude.com/docs/en/env-vars)). And some elements still ignore overrides; inline code in Markdown is one reported case ([GitHub theme issues](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20theme%20sort%3Areactions-%2B1-desc)).

Andrew Baker's widely copied Ghostty setup is a good reference. It pairs JetBrains Mono Nerd Font at 14 points with `font-thicken`, `theme = light:Catppuccin Latte,dark:Catppuccin Mocha`, 0.9 opacity, blur and padding, and Claude's `"theme": "auto"`, so the terminal and Claude switch between day and night together ([Andrew Baker](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)).

Fonts matter less than people assume. Claude Code's own UI needs no Nerd Font; status bars do. Nerd Font private-use glyphs can render as blanks inside Claude Code, and that issue was auto-closed as "not planned" ([#49270](https://github.com/anthropics/claude-code/issues/49270)). Keep an ASCII fallback for those glyphs, and in mods prefer single-width symbols to emoji ([claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)).

### Spinner verbs, tips and output styles are the cheapest personality

The quickest visible change is `spinnerVerbs`, available since v2.1.23, which either appends to or replaces the built-in verbs ([Settings reference](https://code.claude.com/docs/en/settings-reference#spinnerverbs)). Daniel Miessler swapped in 635 of his own, such as "Folding space" and "Making it so" ([danielmiessler.com](https://danielmiessler.com/drafts/customized-spinner-verbs-in-claude-code)). Marco Lancini runs 32 StarCraft lines, including "Nuking from orbit", with matching StarCraft sound hooks ([Lancini](https://blog.marcolancini.it/2026/blog-my-claude-code-setup/)). One collection offers 6,304 verbs across 153 themes ([wynandw87](https://github.com/wynandw87/claude-code-spinner-verbs)). `spinnerTipsOverride` swaps the "Tip" label for your own, and with `excludeDefault` it shows only your tips, given inline or in a `tipsFile` ([Settings reference](https://code.claude.com/docs/en/settings-reference#spinnertipsoverride)).

Output styles change Claude's voice. Concise leads with the result, Explanatory adds `★ Insight` blocks, and Learning leaves `TODO(human)` gaps for you to fill. Custom Markdown styles in `~/.claude/output-styles/` can do anything, but they should set `keep-coding-instructions: true`, or they drop Claude's software-engineering instructions ([Output styles](https://code.claude.com/docs/en/output-styles)). Community styles include personas such as Zen Master and Tabloid Journalist ([output-style collection](https://github.com/hesreallyhim/awesome-claude-code-output-styles-that-i-really-like)) and disler's `genui`, which answers in styled HTML ([hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)).

Several smaller knobs finish the look ([Settings reference](https://code.claude.com/docs/en/settings-reference); [Commands](https://code.claude.com/docs/en/commands)). `viewMode: "focus"` shows only your last prompt, a one-line tool summary and the final answer. `maxProseWidth` keeps prose readable on ultrawide windows. `showTurnDuration` and `timeFormat` produce lines like `✻ Sautéed for 23s · done 6:05 PM`. `/color` tints each session's prompt bar, and `footerLinksRegexes` turns ticket IDs into clickable badges. For screenshots, `IS_DEMO=1` hides your email and organization, and `CLAUDE_CODE_HIDE_CWD=1` hides your path ([Env vars](https://code.claude.com/docs/en/env-vars)).

Treat 2025-era guides with suspicion: `/vim` is gone (use `editorMode`), the transcript viewer moved to Ctrl+O, and output styles are no longer deprecated. Binary patchers such as tweakcc (about 2.5k stars) reach deeper, but they are the most fragile option under near-daily releases ([tweakcc](https://github.com/Piebald-AI/tweakcc)).

### tmux needs five config lines and version 3.7

Anthropic's official tmux block has three lines: `allow-passthrough on`, `extended-keys on` and the `xterm*:extkeys` terminal feature. They let notifications, the progress bar and Shift+Enter reach the outer terminal ([Terminal config: tmux](https://code.claude.com/docs/en/terminal-config#configure-tmux)). Add `mouse on` for wheel scrolling in fullscreen, plus the `Tc` override for true color.

Then upgrade tmux itself. Releases through 3.6 lack synchronized output, so flicker comes back ([Fullscreen](https://code.claude.com/docs/en/fullscreen)). tmux 3.7 added synchronized output and progress-bar forwarding, and 3.8 (September 2026) added floating and modal panes that suit a scratch Claude popup ([tmux CHANGES](https://github.com/tmux/tmux/blob/master/CHANGES)). Mod images and OSC 7501 never pass through a multiplexer, so pixel-heavy mods need a plain terminal tab.

Agent-state signals cost little. Claude's terminal title already prefixes a braille spinner while it works and `✳` when idle ([#68643](https://github.com/anthropics/claude-code/issues/68643)), and `claude agents --json` is the supported way for a status bar to read session state ([Agent view](https://code.claude.com/docs/en/agent-view)). tmux-agent-indicator colors pane borders by state and adds a "Knight Rider" animation while an agent runs ([tmux-agent-indicator](https://github.com/accessd/tmux-agent-indicator)). tmux-claude-monitor pulses a dot through Catppuccin shades ([tmux-claude-monitor](https://github.com/FlavianMF/tmux-claude-monitor)). Don't expect novelty here, though: r/tmux has asked "So is this subreddit just claude code tmux plugins now?" ([Reddit](https://www.reddit.com/r/tmux/comments/1saciat/)).

Shell setup matters too. Claude sets `CLAUDECODE=1` in the processes it spawns, so a `.zshrc` can skip heavy prompt frameworks inside Claude's shells ([CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [NixOS patch](https://gitea.hillion.co.uk/JakeHillion/nixos/pulls/1157.patch)). Baker moved from Powerlevel10k to Starship because P10k's instant prompt could confuse Claude Code ([Andrew Baker](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)).

## Status lines, hooks and companion tools carry the information

### The status line is still a shell script, now with a much richer payload

The status line is a plain shell command. Claude Code pipes a JSON payload to it on stdin and draws whatever it prints, which can be several lines with ANSI colors and OSC 8 links. The command re-runs on events with a **300 ms debounce**, cancels any run still in flight, and accepts a `refreshInterval` (minimum one second) for clocks. It costs no tokens ([Status line docs](https://code.claude.com/docs/en/statusline)). Through 2026 the payload grew into a full health report. It now includes 5-hour and 7-day plan usage with `resets_at` times (v2.1.80; Pro and Max only), effort and thinking mode, and prompt-cache warmth, TTL, hit ratio and named miss causes (v2.1.251+). It also carries PR review state and worktree data. Context `used_percentage` counts input tokens only ([Status line docs](https://code.claude.com/docs/en/statusline); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)).

You don't have to write the script yourself: typing `/statusline show model name and context percentage with a progress bar` has Claude write it. A separate `subagentStatusLine` restyles each subagent row and receives that subagent's last 16 token readings, enough for per-agent sparklines. The Desktop app does not draw custom status lines, but the statusline-anywhere mod runs your existing script and draws its output above the prompt there ([statusline-anywhere](https://github.com/NathanAB/statusline-anywhere)).

| Tool | Stars | Why pick it | Start with |
|---|---|---|---|
| [claude-hud](https://github.com/jarrodwatts/claude-hud) | 28,520 | Live HUD: color-shifting context and usage bars plus rows for running tools, subagents and to-dos | `/plugin marketplace add jarrodwatts/claude-hud`, `/plugin install claude-hud`, then `/claude-hud:setup` |
| [ccstatusline](https://github.com/sirmalloc/ccstatusline) | 13,286 (~202.7k npm downloads a month) | Widest widget set, TUI editor with live preview, powerline with gradients | `npx -y ccstatusline@latest`, then choose "Pinned global install" |
| [claude-powerline](https://github.com/Owloops/claude-powerline) | 1,174 | 6 themes × 4 styles including a bordered `tui` panel; web "Powerline Studio"; zero dependencies | `/plugin marketplace add Owloops/claude-powerline`, `/plugin install claude-powerline@claude-powerline`, then `/powerline` |
| [ccusage statusline](https://ccusage.com/guide/statusline) | (project 19,002) | Session, day and block cost with burn rate | `bun x ccusage statusline` |
| [cship](https://github.com/stephenleo/cship) | 427 | Rust; embeds real Starship modules; "≤10ms render budget" | `cargo install cship` |
| [claude-pace](https://github.com/Astro-Han/claude-pace) | 236 | Pure bash; ⇡/⇣ pace against the reset clock | `npx claude-pace` |
| [Awesome Statusline](https://github.com/awesomezun/claude-statusline) | 197 | Catppuccin gradient bars, no Nerd Font, native PowerShell | one-line installer |

Power users have converged on a common layout. The first line carries identity: model with effort, then repo and branch with a dirty flag. The second carries health: a context bar that turns yellow at 70% and red at 90% (the official example's thresholds), then 5-hour and 7-day usage with reset countdowns. A cache countdown and an activity line that appears only while busy are the 2026 additions ([Status line docs](https://code.claude.com/docs/en/statusline); [claude-hud](https://github.com/jarrodwatts/claude-hud)). Pace matters because a raw "60% used" means nothing without the time left to reset ([claude-pace](https://github.com/Astro-Han/claude-pace)).

On the statuslin.es gallery, the most-copied design is the boxed, multi-line **Dreambase Panel** (220 copies), followed by **Pace Dot Meters** (93) ([statuslin.es](https://statuslin.es/)). The backlash is equally consistent. Overgrown designs get called a "statusparagraph" ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qycvdu/)), and a ticking seconds counter drew "I can't use this until it doesn't show seconds" ([HN](https://news.ycombinator.com/item?id=48745590)).

Treat the script as a hot path. Read stdin once, cache `git status` under a key that includes `session_id`, and never resolve `npx …@latest` on every repaint. As one PSA put it, that "downloads and runs whatever npm currently tags as latest, at every status-line render" ([Reddit](https://www.reddit.com/r/ClaudeAI/comments/1sh0x1r/)). Startup time adds up: one author measured about 143 ms for a JavaScript status line against about 10 ms after rewriting it in Zig ([HN](https://news.ycombinator.com/item?id=46585312)). The line also blanks out silently in an untrusted workspace, under `disableAllHooks` or `--safe-mode`, and whenever the script exits non-zero ([Status line docs](https://code.claude.com/docs/en/statusline)).

### Hooks make "Claude needs you" instant, audible and portable

Claude Code now has **33 hook events and five handler types** ([Hooks reference](https://code.claude.com/docs/en/hooks)). The change that matters most for ricers came in v2.1.141. Hooks run without a TTY, so instead of writing to `/dev/tty` they return `{"terminalSequence": "..."}`, and Claude Code writes the sequence itself. The allowlist covers window titles (OSC 0/1/2), notifications (OSC 9, 99 and 777) and the bell. It works inside tmux and screen and on Windows ([Hooks reference: terminal notifications](https://code.claude.com/docs/en/hooks#emit-terminal-notifications)). Every older recipe that wrote to `/dev/tty` is now broken.

Timing explains most complaints that notifications feel laggy. The `Notification` event fires on `permission_prompt` only after about 6 seconds without typing, and on `idle_prompt` about 60 seconds after Claude finishes. For an instant "done", hook `Stop`; for an instant "asking", hook `PermissionRequest` ([Hooks reference: Notification](https://code.claude.com/docs/en/hooks#notification)). `Stop` carries `last_assistant_message`, which is ready-made for text-to-speech. Marking a hook `async: true` keeps sound, speech and push work off the critical path. A `MessageDisplay` hook rewrites only what you see, while Claude and the transcript keep the original text ([MessageDisplay](https://code.claude.com/docs/en/hooks#messagedisplay)). Without any hooks at all, Remote Control can push to your phone when a long task finishes or a permission prompt is waiting ([Remote Control](https://code.claude.com/docs/en/remote-control#mobile-push-notifications)).

The community tools here are mature by mod standards. **peon-ping** (about 5.1k stars) plays game voice lines from 165 packs (Warcraft, StarCraft, Portal), shows overlay banners and tab titles, and pushes to ntfy, Pushover or Telegram. Its launch was 2026's top Claude Code customization story on Hacker News, at **1,006 points** ([peon-ping](https://github.com/PeonPing/peon-ping); [HN](https://news.ycombinator.com/item?id=46985151)). **Agent Notifications** (about 817 stars) adds cross-platform toasts with click-to-focus, plus Slack, Discord and Telegram webhooks ([claude-notifications-go](https://github.com/777genius/claude-notifications-go)). **claude-remote-approver** turns permission prompts into phone pushes with Approve, Always Approve and Deny buttons ([claude-remote-approver](https://github.com/yuuichieguchi/claude-remote-approver)). **AgentVibes** narrates each agent's work in neural voices, even from a remote SSH box ([AgentVibes](https://github.com/paulpreibisch/AgentVibes)).

Two community lessons matter more than any single tool. Once the novelty wore off, one peon-ping fan found **per-project, event-specific spoken messages** more useful than game quotes ([HN](https://news.ycombinator.com/item?id=46985151)). And cmux's creator built his terminal because Claude's notification body always reads "Claude is waiting for your input", with no context about which session needs you or why ([HN](https://news.ycombinator.com/item?id=47079718)).

### Built-in commands now cover most insight; companion tools add history, forecasts and swarms

Claude Code's own insight layer has absorbed most of what early third-party trackers existed for. `/usage` is now the hub, with `/cost` and `/stats` as aliases. It shows plan-limit bars, attributes usage to skills, subagents, plugins and MCP servers, and explains prompt-cache misses with likely causes. Its activity heatmap copies to the clipboard as an image with Ctrl+S ([Manage costs](https://code.claude.com/docs/en/costs); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)). `/context` draws a colored grid of context use with optimization tips. `/insights` writes an HTML report on how you work, and its tokens count against your plan ([Commands](https://code.claude.com/docs/en/commands); [Manage costs](https://code.claude.com/docs/en/costs)). Agent view (`claude agents`) groups background sessions into "Needs input", "Working" and "Completed", and its `--json` mode is the supported data source for status bars ([Agent view](https://code.claude.com/docs/en/agent-view)).

Third-party tools earn their place where the built-ins stop. For history, ccusage (about 365k npm downloads a week) has a `--compact` mode suited to screenshots; its old `blocks --live` monitor was removed in v18 ([ccusage](https://github.com/ccusage/ccusage); [npm](https://api.npmjs.org/downloads/point/last-week/ccusage)). For forecasts, Claude-Code-Usage-Monitor v4 now reads Claude's official `rate_limits` and can write a state file for status bars ([Usage Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)). For always-visible limits, CodexBar (22.5k stars) lives in the macOS menu bar or in an Omarchy bar widget that follows your theme ([CodexBar](https://github.com/steipete/CodexBar)). For waste, Codeburn (11.4k stars, created in April) attributes spend by project, branch and task ([Codeburn](https://github.com/getagentseal/codeburn)).

For watching swarms live, agents-observe installs as a plugin and adds replay ([agents-observe](https://github.com/simple10/agents-observe)), and disler's dashboard streams every agent's hook events ([multi-agent observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)). Stefan Prodan's cctop is a `top` for every running session ([cctop](https://github.com/stefanprodan/cctop)); don't confuse it with the cctop mod pane of the same name ([tomstagl/cctop](https://github.com/tomstagl/cctop)). Teams can feed official OpenTelemetry export into Grafana Cloud's four prebuilt Claude Code dashboards ([Monitoring](https://code.claude.com/docs/en/monitoring-usage); [Grafana](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-claude-code/)). To keep sessions, claude-code-log renders a searchable archive ([claude-code-log](https://github.com/daaain/claude-code-log)), and Simon Willison's claude-code-transcripts publishes polished HTML ([claude-code-transcripts](https://github.com/simonw/claude-code-transcripts)). claude-squad (8.6k stars) keeps many agents tmux-native ([claude-squad](https://github.com/smtg-ai/claude-squad)).

Three cautions apply to all of these. Transcript parsers depend on a JSONL format that "changes between versions" ([Manage sessions](https://code.claude.com/docs/en/sessions)), and those transcripts sit on disk in plaintext for 30 days ([Data usage](https://code.claude.com/docs/en/data-usage)). Dollar figures are list-price estimates, so subscribers should trust plan percentages instead. And any proxy or multi-account router that handles subscription OAuth runs against Anthropic's credential policy ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)). The community's own design rule for dashboards is blunt: when four agents run overnight, a 50-chart dashboard is useless, and what you need is to glance and know whether anything needs you ([Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ru9yda/)).

## The biggest flexes put pixels, people or a voice in the terminal

The most-shared moments of 2026 share a formula. First, they fill dead time. Jarrod Watts' **intermission** drops you into a multiplayer Doom deathmatch while Claude works, where every other player is a developer waiting on their own Claude. When Claude finishes or needs you, it hands you back with your kill/death score. WeAreDevelopers called it "the one everyone was talking about" within a day of launch ([WeAreDevelopers](https://www.wearedevelopers.com/magazine/780-play-doom-with-developers-while-claude-code-works); [intermission](https://github.com/jarrodwatts/intermission)).

Second, they show the work. The top post of the mods era on r/ClaudeCode (**1,201 points**) was claude-show-your-work, which puts screenshots and videos of Claude clicking through your app inline. That ends the "Done! I fixed the pricing page, now go check the browser" loop ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x34qj4/); [show-your-work](https://github.com/iamumeransari/claude-show-your-work)).

Third, they lean on nostalgia, as Warcraft voice lines did on their way to 1,006 Hacker News points ([HN](https://news.ycombinator.com/item?id=46985151)). Fourth, they tell a "Claude built it" story. Firecrawl's plain-TypeScript Doom port is a mod Claude first judged impossible ([Firecrawl](https://www.firecrawl.dev/blog/claude-mods)).

The ranking below weighs community reception against effort. None of these were run for this report, so visual quality rests on each project's own demos and the reactions they drew.

| # | Showpiece | Layer | Why it lands | What it costs you |
|---|---|---|---|---|
| 1 | [intermission](https://github.com/jarrodwatts/intermission) | Mod pane | Live multiplayer Doom against other waiting developers; zero tokens | macOS 15+ in Ghostty/kitty, or Windows in the Rio terminal |
| 2 | [claude-show-your-work](https://github.com/iamumeransari/claude-show-your-work) | Mod transcript and pane | Claude shows you screenshots and video of its own QA | kitty-graphics terminal, ffmpeg, Playwright |
| 3 | [terminal-browser](https://github.com/zenbu-labs/terminal-browser) | Mod pane | A real browser beside the chat that the agent can drive; 53 release tags | Helper binary plus plugin; Windows only via WSL |
| 4 | [skins](https://github.com/hellosverre/claude-skins), [claudinator](https://github.com/patheonsceo/claudinator), [prismantis](https://github.com/NahumLitvin/prismantis) | Transcript re-skin | Cards for code, diffs, tables, math and Mermaid. skins has 15 themes swapped live with `/skin`; claudinator ships matching color schemes for six terminals | Two commands; pick **one**, since they redraw the same sites |
| 5 | [flightdeck](https://github.com/scasella/claude-flightdeck), [filetree](https://github.com/data-goblin/claude-code-filetree) | Mod panes | Live subagent swimlanes and permission checks; a file tree that shimmers as Claude reads | Fullscreen and at least 110 columns |
| 6 | [naruto](https://github.com/i-harsha-reddy/naruto-mod), [pokemon](https://github.com/dgokcin/claude-pokemon-mod), [galactic-battle](https://github.com/DarkVelours/claude-code-galactic-battle) | Band companions | 20 fighters and 60 animated jutsu; a Pokémon that evolves and raises a red "!" when Claude needs you; a space battle with a lightsaber context gauge | Two commands; truecolor; images look best in kitty/Ghostty |
| 7 | [peon-ping](https://github.com/PeonPing/peon-ping) | Hooks | "Work, work" and "Job's done!" plus overlay banners and phone push | One-line install |
| 8 | [Ghostty cursor shaders](https://github.com/sahaj-b/ghostty-cursor-shaders), [full-screen shaders](https://github.com/hackr-sh/ghostty-shaders) | Terminal | Cursor trails, CRT, bloom that makes red errors glow, starfields | About 5 minutes; "generally less than 10%" CPU per surface; a bad shader can black out the window ([Ghostty config](https://ghostty.org/docs/config/reference)) |
| 9 | [claude-powerline](https://github.com/Owloops/claude-powerline) `tui` style, [ccstatusline](https://github.com/sirmalloc/ccstatusline) gradients, [claude-hud](https://github.com/jarrodwatts/claude-hud) | Status line | Polished, screenshot-ready bars that also inform | Low; keep an ASCII fallback |
| 10 | [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents), [pixtuoid](https://github.com/pixtuoid/pixtuoid), [Clawd on Desk](https://github.com/rullerzhou-afk/clawd-on-desk) | Companion apps | Each session becomes a pixel coworker in an office; Pixel Agents shows 126.5k installs | Low; pixtuoid renders inside the terminal |
| 11 | Desk hardware ([status-bar display](https://www.reddit.com/r/ClaudeAI/comments/1ui85ys/), [mod-driven USB display](https://www.reddit.com/r/ClaudeCode/comments/1wye4ix/)) | Physical | Usage and permission state visible across the room; Claude even designed one enclosure in FreeCAD | High: hardware and firmware |
| 12 | [Session Wrapped](https://www.onewave-ai.com/blog/claude-code-mods), [tokscale](https://github.com/junhoyeo/tokscale) | Shareable artifacts | A Spotify-Wrapped-style PNG card of your session; a 3D contributions graph and public leaderboard | Low; leaderboard submission uploads your usage |

Anthropic's own samples earn an honorable mention for impact per line of code. Token Weather's ☀→↯ forecast band, paired with a restyled spinner, is the best screenshot-per-minute ratio in the whole mod API. Blast Radius freezing an `rm -rf build` in front of an audience is the best live-demo moment ([claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)).

Each flex has a ceiling. Pixel images never draw inside tmux. A mod can open a pane on its own only at 144 columns or wider. Every band mod competes for one strip, and ordinary redraws top out at 30 a second, with only pixel blits reaching about 60 ([Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface); [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts)). Windows users lose most of the pixel showpieces.

The community's taste is sharp and consistent. A Ghostty fork that animates Claude flying between files as a comet drew both "DOPAMINEEEEE" and "looks cool but has no real usecase" ([Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wycbbr/)). One reviewer called the Doom mod "completely useless" but fun ([Sharbel](https://sharbel.com/articles/claude-code-mods)). The top comment on a hardware status-bar post said that "a claude usage statusbar is the new 'hello world'" ([Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ui85ys/)).

The flexes that survive put personality on top of a real signal. Examples are a pet that panics on `rm -rf`, a companion that flags permission requests, and a voice that names the project that just finished. The strongest flex is a mod you had Claude build for you. One popular tip: ask Claude to audit your last 30 sessions and propose five mods ([StationX](https://app.stationx.net/articles/claude-code-mods)).

## Three setups to adopt, from zero-risk to full demo mode

Three principles run through every tier. Give each surface exactly one occupant. Tie every flourish to a real signal. Keep everything reversible: `claude --safe-mode` gives you a vanilla session whenever you need one ([Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)).

### Setup 1: the quiet power rice uses only first-party settings

This tier takes about 30 minutes and runs no third-party code inside Claude Code. That makes it the right baseline for work machines and for Team/Enterprise accounts, where user mods are partly fenced off anyway. The terminal half follows Andrew Baker's published Ghostty config ([Andrew Baker](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)), with one change: blur uses the current `background-blur` key from the [Ghostty config reference](https://ghostty.org/docs/config/reference) instead of the older key name in his post.

```ini
# ~/.config/ghostty/config
font-family = JetBrainsMonoNerdFont
font-size = 14
font-thicken = true
theme = light:Catppuccin Latte,dark:Catppuccin Mocha
window-theme = auto
background-opacity = 0.9
background-blur = 20
window-padding-x = 10
window-padding-y = 8
resize-overlay = never
quick-terminal-position = top
keybind = global:super+grave_accent=toggle_quick_terminal
```

The Claude half uses only keys documented in the [settings reference](https://code.claude.com/docs/en/settings-reference). It assumes you have done ccstatusline's pinned global install ([ccstatusline](https://github.com/sirmalloc/ccstatusline)).

```json
{
  "theme": "auto",
  "tui": "fullscreen",
  "maxProseWidth": 100,
  "timeFormat": "24-hour",
  "preferredNotifChannel": "ghostty",
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": ["Nuking from orbit", "Folding space", "Making it so", "Yak-shaving"]
  },
  "spinnerTipsOverride": {
    "label": "Rice",
    "excludeDefault": true,
    "tips": ["Ctrl+O then [ dumps the chat into native scrollback",
             "/color gives this session its own prompt bar"]
  },
  "statusLine": { "type": "command", "command": "ccstatusline", "refreshInterval": 10 },
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "async": true,
      "command": "afplay /System/Library/Sounds/Glass.aiff" }] }],
    "PermissionRequest": [{ "hooks": [{ "type": "command", "async": true,
      "command": "afplay /System/Library/Sounds/Ping.aiff" }] }]
  }
}
```

`"auto"` makes Claude follow Ghostty from day to night. `"dark-ansi"` would inherit Catppuccin's exact palette but stay dark all the time. If you want an exact accent color, add a file under `~/.claude/themes/` ([Terminal config](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)).

In ccstatusline's TUI, build two lines. The first shows identity: model, effort, repo and branch. The second shows health: a context bar, 5-hour and 7-day usage with reset countdowns, and a cache timer. Swap in claude-hud if you want live tool and agent rows, or claude-powerline's `tui` style if looks matter most.

The hooks fire on `Stop` and `PermissionRequest` rather than `Notification`, because the `Notification` event waits 6 to 60 seconds ([Hooks reference](https://code.claude.com/docs/en/hooks#notification)). On Linux, swap `afplay` for `paplay /usr/share/sounds/freedesktop/stereo/complete.oga` ([Andrew Baker](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)). Outside Ghostty, kitty and iTerm2, add the official `terminalSequence` notification script, which emits OSC 777 ([Hooks reference](https://code.claude.com/docs/en/hooks#emit-terminal-notifications)). OSC 9 is on the allowlist for Windows Terminal and WezTerm, though that path is untested here.

Two more touches finish the tier. Turn on "Push when actions required" in `/config` to get phone alerts through Remote Control ([Remote Control](https://code.claude.com/docs/en/remote-control#mobile-push-notifications)). And run `/color` in each parallel session so you can tell them apart ([Commands](https://code.claude.com/docs/en/commands)).

### Setup 2: the mod-powered daily driver adds one vetted mod per surface

This tier needs Claude Code 2.1.287 or later, a fullscreen Ghostty or kitty window at least 144 columns wide, and about an hour.

The band goes to Anthropic's Token Weather, or to token-weather-usage, which adds 5-hour/7-day pace, cache time left, cost and running subagents. token-weather-usage is listed in Anthropic's directory, and its scan footprint is only "reads", the L1 reach level ([token-weather-usage](https://github.com/augiefra/claude-mods)). The pane goes to flightdeck, which only observes ([flightdeck](https://github.com/scasella/claude-flightdeck)). The transcript goes to prismantis for tables and diagrams; turn off its diagram hints to save about 190 tokens per prompt ([prismantis](https://github.com/NahumLitvin/prismantis)). Add image-view, next-steps, and Blast Radius as a safety net. Turn on the built-in "You should know" for a second pair of eyes. Validate each mod before it reaches your user scope.

```bash
# Official samples as a local marketplace
git clone https://github.com/anthropics/claude-code-playground.git
cd claude-code-playground/claude-code/mods
claude plugin validate ./token-weather          # read the hooks: and calls: lines
claude plugin marketplace add ./
claude plugin install token-weather@claude-code-playground-mods --scope user
claude plugin install blast-radius@claude-code-playground-mods --scope user

# Community picks (validate a clone of each first)
claude plugin marketplace add scasella/claude-flightdeck
claude plugin install flightdeck@claude-flightdeck
claude plugin marketplace add anthropics/claude-plugins-community
claude plugin install next-steps@claude-community
# In a session: /plugin marketplace add jarrodwatts/claude-image-view, then /plugin install image-view
# In a session: /plugin enable cc-plugin-you-should-know@builtin
```

Sources: [playground mods README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods), [flightdeck](https://github.com/scasella/claude-flightdeck), [next-steps](https://github.com/anthropics/claude-plugins-community/tree/main/next-steps), [image-view](https://github.com/jarrodwatts/claude-image-view), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).

Once a mod passes review, pin it. Copy each vetted mod into a personal local marketplace, and leave marketplace auto-update off for third-party sources ([Install plugins](https://code.claude.com/docs/en/plugins/install)). Reviewers warn that unpinned installs and third-party marketplaces can change after review ([Sharbel](https://sharbel.com/articles/claude-code-mods)), and security testers caught a mod fetching new code after it had passed review ([Pluto Security](https://pluto.security/blog/claude-code-function-hooks-security/)).

The multi-session layer runs on tmux 3.7 or later with the block below. The first three lines are Anthropic's ([Terminal config](https://code.claude.com/docs/en/terminal-config#configure-tmux)). The truecolor line comes from the env-var docs ([Env vars](https://code.claude.com/docs/en/env-vars)). The last line adds pane borders that change color with agent state ([tmux-agent-indicator](https://github.com/accessd/tmux-agent-indicator)).

```bash
# ~/.tmux.conf
set -g allow-passthrough on
set -s extended-keys on
set -as terminal-features 'xterm*:extkeys'
set -g mouse on
set -ga terminal-overrides ',*:Tc'     # and: export CLAUDE_CODE_TMUX_TRUECOLOR=1
set -g @plugin 'accessd/tmux-agent-indicator'
```

Pixels never cross tmux, so keep image-drawing mods in a plain Ghostty tab and use tmux for the agent wall. Round out the setup with `claude agents` for dispatch, ccusage `--compact` tables for history, CodexBar in the menu bar, and peon-ping or Agent Notifications for sound and toasts.

### Setup 3: full demo mode is a separate profile for screenshots and talks

Layer this on top of setup 2 and switch it on only when presenting. In the terminal, add `custom-shader = shaders/ghostty/cursor_warp.glsl` and a bloom shader. Set `custom-shader-animation = always` so the effects keep running when the window loses focus ([ghostty-cursor-shaders](https://github.com/sahaj-b/ghostty-cursor-shaders); [ghostty-shaders](https://github.com/hackr-sh/ghostty-shaders)). One caveat: Claude draws its own block cursor unless `CLAUDE_CODE_NATIVE_CURSOR=1` is set ([Env vars](https://code.claude.com/docs/en/env-vars)), and whether trails follow Claude's caret in either mode is untested.

Hand the band to a companion such as naruto or pokemon, and move the usage readout to the status line, since only one band owner shows. Swap prismantis for skins with a loud theme. Use intermission for waits, show-your-work for QA, terminal-browser for previews, and Session Wrapped at the end for the shareable card. For the agent wall, experimental agent teams give each teammate its own tmux pane with state-colored borders, at a token cost that grows with every teammate ([Agent teams](https://code.claude.com/docs/en/agent-teams)).

Screen hygiene is part of the flex. `IS_DEMO=1` hides your email and organization, and `CLAUDE_CODE_HIDE_CWD=1` hides your path ([Env vars](https://code.claude.com/docs/en/env-vars)). The display-redaction mod masks email addresses and secret-shaped text on screen "for recordings and screen shares" ([display-redaction](https://github.com/melodic-software/claude-code-plugins)). A `maxProseWidth` between 80 and 100 makes text blocks look composed on a wide display.

Windows users should flip the emphasis. Use Windows Terminal with WSL, skip the pixel mods, and invest in the status line: ccstatusline has Windows documentation, and Awesome Statusline renders natively in PowerShell. Add toast notifications from Agent Notifications ([ccstatusline](https://github.com/sirmalloc/ccstatusline); [Awesome Statusline](https://github.com/awesomezun/claude-statusline); [claude-notifications-go](https://github.com/777genius/claude-notifications-go)).

## Conclusion

The October launch changed what "ricing Claude Code" means. Before mods, customization wrapped the tool from outside, through the terminal, tmux and a status-line script, and choosing a terminal emulator was a matter of taste. Now Claude Code itself is the canvas. The terminal decides which parts of that canvas exist, because kitty graphics, a 144-column window and the fullscreen renderer gate the most impressive mods. Picking Ghostty or kitty has become a decision about capability, not looks. The limiting factor has shifted too, from imagination to trust. Anyone can prompt a mod into existence in minutes, which is how 3,836 appeared in two weeks. What's scarce is code you're willing to run inside Claude Code with your credentials. A sensible ricer budgets mod permissions the way a gamer budgets frame time: no network or process access for anything cosmetic, pinned versions, and a local marketplace.

The community's votes already show what lasts. The flourishes people keep are the ones that answer four questions at a glance without spending tokens: how much quota and context remains and how fast it's burning, which session needs you, what the agent is doing, and what state the repo is in. Personality works when it carries those signals and gets mocked when it doesn't. The ecosystem's blank spots are accessibility themes, a pane-layout manager, session-to-GIF export, per-task cost attribution, and notifications that say which session wants what. Those are exactly where a personal mod would be both useful and new. Anthropic says more built-ins will move into mods ([Announcement](https://claude.com/resources/articles/claude-code-mods)), so the line between configuring Claude Code and modding it will keep blurring. In that world, the most durable flex is a mod that Claude built for you, that fixes your own daily annoyance, and that you're still running two weeks later.
