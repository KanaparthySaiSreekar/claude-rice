# Ricing Claude Code in October 2026: Mods, Statuslines, Themes and a Curated Linux Setup

For a beautiful and information-dense Claude Code terminal on Linux, use five layers. Start with a GPU terminal that supports the kitty graphics protocol (Ghostty or kitty), a Nerd Font and a matching custom `/theme`. Add one statusline (claude-hud or ccstatusline). Then add a small set of 2–4 vetted mods for live panes and bands: token-weather or context-bar, flightdeck, blast-radius, and optionally image-view and filetree. Shell hooks handle notifications and guardrails, and ccusage plus a tmux session manager cover analytics and parallel agents. Mods are only two weeks old, are not sandboxed and change between releases, so a few audited ones beat a pile of novelty.

## TL;DR
- **Mods are the big new customization layer.**\[1\]\[2\] Anthropic launched them on October 1, 2026, in Claude Code v2.1.287. Per mixed-news.com it reached npm at 16:59 UTC, and the changelog entry reads "Added Claude Mods: plugins may now modify deeper behavior." Mods are JS/TS event handlers that run *inside* Claude Code and ship as plugins. They can draw panes, bands above the prompt, toasts and restyled spinners or tool rows, and they can intercept tool calls. The community moved fast: Boris Cherny's X announcement drew "833,000 views and 5,200 likes. Within hours, someone had Tetris running inside their terminal" (Max Quimby, DEV Community, Oct 4). One scanner counts 3,836 public mods as of Oct 13. Only a handful are mature, and none are sandboxed.
- **Statuslines are still the most mature "informative" layer, and mods complement them rather than replace them.** claude-hud (28,506★ and 1,321 forks per skillsllm.com) and ccstatusline are the category leaders. Custom JSON themes (since v2.1.118) handle color, and tweakcc handles deeper patching such as spinners and thinking verbs.
- **The recommended Linux stack:**
  - Ghostty or kitty, with JetBrains Mono Nerd Font and a Catppuccin/Dracula theme matched in `~/.claude/themes/`.
  - claude-hud as the statusline.
  - Mods: token-weather or context-bar, flightdeck and blast-radius.
  - Hooks: notify-send for notifications, plus git-safety and protect-secrets from karanb192/claude-code-hooks.
  - ccusage for analytics, and Claude Squad or a tmux session manager for parallel sessions.
  - Validate every mod with `claude plugin validate` before installing it.

## Key Findings

1. **What mods are, officially.** The docs define a mod as "a plugin that changes how Claude Code looks and behaves. It's made of JavaScript or TypeScript event handlers." Each handler can observe, rewrite or answer an event: a tool call, a prompt, a turn, or a render of part of the UI.\[3\] Anthropic's launch post frames it as letting developers reshape Claude Code "without waiting for us to ship a feature." It says hooks "can't rewrite events, draw new UI, or replace features. Mods can."\[4\]
2. **Anthropic is dogfooding the system.** `/diff`, AGENTS.md loading, the `sec-default` guard and telemetry are themselves built-in mods. As pasqualepillitteri.it notes, "Four mods written by Anthropic (diff, agents-md, sec-default, telemetry) have public code in the anthropics/claude-code repository on GitHub." Anthropic says it plans "to move more built-in features to mods over time, so you can pare Claude Code down to a small core."
3. **The ecosystem is huge but shallow.** karanb192's awesome-claude-code-mods (563★, 112 forks) scans GitHub nightly and reported "3836 mods · Last scanned 2026-10-13".\[5\] The hand-curated claude-mods.com lists 188 mods, updated Oct 9, in these categories:\[6\]
   - Games: 20
   - While you wait: 36
   - Dashboards: 45
   - Security: 12
   - Context & memory: 23
   - Automation: 16
   - Interface: 35\[6\]

   Most have single-digit stars.
4. **Star counts for mods are misleading.** Directories show the *host repo's* stars. All three Anthropic samples show "★ 219" because they live in the claude-code-playground repo. firstmate-calm shows 7.9k because it lives in a bigger project.\[6\] Judge a mod by its code and activity, not its star count.
5. **Security is the main risk.** Mods run with your full permissions, can read your env and secrets, see every prompt, auto-approve tool calls and spend your usage. "Mods aren't sandboxed", and a process a mod starts runs outside the Bash sandbox.\[3\]\[7\] On Oct 2 the awesome-list scan covered 359 mods: "127 start processes, 95 write files, 75 reach the network and 111 see every prompt."\[8\]\[9\]
6. **Performance and conflicts are real but manageable.** Every hook runs under time limits, and Claude Code skips hooks that exceed them.\[10\] The AbovePrompt band can be redrawn up to 30 times a second.\[11\] A mod that forgets `await next(e)` *replaces* whatever other mods drew in the band, and in one case it also hid Claude Code's own task list.\[8\]

## Details

### 1. How mods work and how they relate to everything else

**Requirements.**
- Terminal: Claude Code ≥ v2.1.287.\[12\] Desktop app: ≥ v2.1.286.
- Mods are on by default. The early-access flag `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is now ignored.\[8\]
- Run `/plugin` to see a dim line such as `1 mod active · first-mod`.\[3\]\[8\]

**Anatomy.** A mod has three files: `.claude-plugin/plugin.json`, `hooks/hooks.json` with `"modules": ["./register.js"]`, and the hooks module itself.\[3\]\[10\] The module exports `register(on)`. Each `on(event, matcher?, async ($, e, next) => …)` call registers middleware:
- Calling `next(e)` passes the event along.
- Returning an object answers the event instead.
- Everything with side effects goes through `$`, the mods API. Its namespaces include `$.ui`, `$.model`, `$.fs`, `$.session` and others.

Routing every side effect through `$` is what lets `claude plugin validate` list a mod's calls without running it.\[8\]

**Events worth knowing for ricing and insight.**
- `ui.render` on sites such as `AbovePrompt`, `Pane` and `Spinner`.
- `session.measure`, which fires after each turn and when plan-limit percentages change.\[10\]
- `turn.complete`, `tool.call`, `agent.spawn`, and `prompt.suggest`/`prompt.fill`.
- `$.session.usage()` returns `{ startedAt, context, rateLimits, cost }`, with context tokens, window and percent, and the 5-hour/weekly limits.\[10\] That is the same data a statusline gets.

**Surfaces a mod can draw on:**
- the band above the prompt;
- a pane, docked right in a wide fullscreen terminal and inline otherwise;
- toasts;
- a per-mod status line;
- dim prompt suggestions;
- restyled spinner, tool rows and question dialog.

The permission prompt cannot be restyled.\[8\]\[13\]

**Where mods draw.**

| Where you run Claude Code | Hooks run | Mod UI appears |
|---|---|---|
| Terminal (incl. editor/JetBrains terminals) | Yes | Yes |
| Desktop app Code tab | Yes | Yes (minus terminal-only elements) |
| Desktop WSL session | No | No |
| VS Code chat panel | Yes | No |
| `claude -p` / Agent SDK | Yes | No |
| Cloud sessions | Only if the plugin reaches the session | No\[3\] |

**Mods vs. the rest of the toolbox.** Use the lightest tool that works.

| Mechanism | What it is | Can draw UI | Best for |
|---|---|---|---|
| CLAUDE.md / output styles | Text Claude reads | No | Behavior and tone |
| `/theme` custom theme | JSON color overrides in `~/.claude/themes/` | Colors only | Palette ricing |
| Statusline (`statusLine` in settings.json) | Shell command; reads JSON on stdin and prints ANSI/OSC 8 | One or more lines under the prompt | Always-on metrics, zero tokens |
| Settings hook | Shell/HTTP/prompt/agent run on lifecycle events | Text only | Hard rules, notifications, formatting |
| Skill | `SKILL.md` instructions | No | Repeatable processes |
| MCP server | External tool provider | No | External systems |
| Subagent / slash command | Delegated agent / prompt macro | No | Workflow |
| **Mod** | In-process JS/TS middleware | **Yes: panes, bands, toasts, restyles** | Live dashboards, interactive guards, rewriting events |
| Plugin | The package | — | Ships any of the above together |

**Authoring.**
- Easiest path: describe the mod to Claude. The built-in `plugin-authoring` skill writes it to `~/.claude/dev-mods/<session-id>/` and offers hot reload.\[7\] Copy it out if you want to keep it.
- Manual path: `claude --plugin-dir ./my-mod` reloads on every save.\[8\]
- Testing: `claude plugin test` runs `*.test.ts` against the real runtime.\[12\]
- Anthropic's walkthrough is Addy Osmani's "Getting started with Claude Code mods" on claude.dev, published Oct 1.\[14\] Community skills include BeLazy167/claude-mods-skill, noeltock/mod-builder, karanb192's mod-builder,\[5\] and ruvnet's "Claude Code Mods: a field guide" gist.

**Kill switches.**
- `claude --safe-mode` disables installed mods for one session.
- `"disableAllHooks": true` disables them everywhere, but also kills your settings hooks and custom statusline.
- Built-in mods keep running in both cases.\[3\]\[11\]

### 2. Catalog of mods and tools

#### 2a. Official and built-in

| Mod | What it does | Install | Notes |
|---|---|---|---|
| token-weather (Anthropic sample) | Context-fill "forecast" above the prompt, from ☀ under 25% to "compact soon" at 90%+, with a 12-turn sparkline\[8\] | Clone `anthropics/claude-code-playground`, then `claude --plugin-dir ./claude-code/mods/token-weather`; to keep it, add the clone's mods dir as a marketplace and `claude plugin install token-weather@claude-code-playground-mods --scope user` | Smallest, best learning example; unsupported sample.\[15\] Community forks add 5h/weekly limits (qarge) and `/handoff`\[8\]\[16\]\[17\] |
| blast-radius (Anthropic sample) | Holds `rm -rf`/force-push and shows what would change, with Proceed/Cancel\[6\] | Same as above | StationX notes an `rm` inside a script gets past it, so it is not a full guard\[8\] |
| replay-theater (Anthropic sample) | `/replay` steps through last turn's edits\[6\] | Same as above | —\[3\] |
| `cc-plugin-diff` (built-in) | `/diff` pane | Built in | Can disable or replace\[3\] |
| `cc-plugin-you-should-know` (built-in) | Side agent shows "heads up" notes above the prompt | `/plugin enable cc-plugin-you-should-know@builtin`\[18\] | Off by default; costs usage\[8\] |
| next-steps (community marketplace; promoted by Anthropic's Thariq) | Suggested next actions/skills after each reply | `claude plugin marketplace add anthropics/claude-plugins-community` then `claude plugin install next-steps@claude-community`\[19\] | Uses model calls |

#### 2b. Look and feel (ricing)

| Tool | Type | What it does | Linux / caveats |
|---|---|---|---|
| Custom `/theme` | Native (v2.1.118+) | JSON in `~/.claude/themes/<slug>.json` with `name`, `base` (dark, light, dark-daltonized, light-daltonized, dark-ansi, light-ansi) and `overrides`; accepts hex/rgb/ansi256/ansi names; hot-reloads\[20\] | Works everywhere; use `dark-ansi` if you want your terminal palette to drive colors |
| Piebald-AI/claude-code-themes | Theme pack | Community theme JSONs (apply via tweakcc)\[21\] | — |
| tweakcc (Piebald-AI) | Patcher | Thinking verbs, 70+ spinner animations, input-box style, markdown styling, system prompts, toolsets; `npx tweakcc` or `brew install tweakcc` | Patches Claude Code's minified JS, so updates can undo changes; unofficial\[22\]\[23\]\[24\] |
| claude-skins (hellosverre) | Mod | Seven transcript skins: timed tool rows, table cards, themed spinner words, usage band | terminal + desktop\[6\] |
| prismantis (NahumLitvin) | Mod | 15 themes for replies: colored tables, highlighted code, Mermaid, charts with copy buttons\[6\] | Default diagram hints add ~190 tokens/prompt (can be disabled)\[5\] |
| cc-crayon, gfm-render, md-prompt | Mods | Themed markdown, GitHub alerts as colored boxes, syntax highlighting in the prompt box as you type\[6\] | Small/new |
| image-view (jarrodwatts) | Mod | Thumbnails of pasted images above the prompt\[6\] | Needs kitty graphics (Ghostty/kitty, Linux OK); half-blocks inside tmux\[25\] |
| figures, mermaid-inline, claude-mod-images | Mods | Real images, LaTeX and diagrams in kitty/Ghostty; box-art fallback elsewhere\[6\] | Same terminal requirement |
| firstmate-calm | Mod | Hides tool rows, sailboat spinner, `/calm` toggle, zero tokens\[6\] | Minimalist "zen" rice |
| nowloading, cat-spinner, pixelband, clawd variants | Mods | Restyled working line (tape deck, flap board, campfire), pixel-art pets, scenes\[6\] | Pure aesthetics |
| starfleet-panel, netrunner-hud | Mods | LCARS console / cyberpunk HUD with model, context, rate limits, git | 0–1★; style showpieces\[6\] |

#### 2c. Informative and insight

**Statuslines** (one `statusLine` slot; zero tokens). The official payload already includes model, cost, `context_window`, `rate_limits` (5h/7d), worktree, agent, output style and vim mode, plus multi-line ANSI and OSC 8 links.\[26\] You can also run `/statusline <describe it>` to have Claude generate one.\[27\]\[28\]

| Project | Stars (date) | Runtime | Install | Best for |
|---|---|---|---|---|
| jarrodwatts/claude-hud | 28,506, 1,321 forks (skillsllm.com, Oct 2026; MIT) | JS plugin | `/plugin marketplace add jarrodwatts/claude-hud` → `/plugin install claude-hud` → `/claude-hud:setup` | Agent observability: context, rate limits, active tools, running agents, todos (parses transcript JSONL, ~300 ms updates) |
| sirmalloc/ccstatusline | 8.6k, 379 forks (GitHub, Oct 2026; npm v2.2.32) | TS TUI | `npx ccstatusline@latest` / `bunx` | Most configurable: powerline, themes, multi-line, widgets, block timer |
| Haleclipse/CCometixLine | 2,683 (Apr 2026) | Rust | npm binary | Speed + TUI, but also patches Claude Code (more invasive)\[28\] |
| Owloops/claude-powerline | 1,010 (Apr 2026) | TS plugin | Plugin marketplace or `npx` | Prettiest plugin-native powerline themes\[28\] |
| stephenleo/cship | 321 (Apr 2026) | Rust | script / `cargo install` | Reuse your `starship.toml`\[28\] |
| fredrikaverpil/claudeline | 34 (Apr 2026) | Go | plugin / `go install` | Conservative, ops-minded single binary (service status, plan vs provider)\[28\] |
| AwesomeJun/CC-statusline | — | shell/PS | one-liner or `/plugin install awesome-statusline` | Catppuccin gradient bars, 5 size presets, Linux/macOS/Windows\[29\] |
| felipeelias/claude-statusline | — | Go | `go install …` | TOML config, 6 presets\[30\] |
| ccusage statusline | (ccusage) | — | `"command": "bun x ccusage statusline"` | Burn rate and block projections (beta)\[31\] |

**Insight mods** (live panes and bands):

| Mod | What it shows | Install / notes |
|---|---|---|
| flightdeck (scasella) | Read-only live dashboard: context, cost, every permission check, subagent cards and swimlanes, turn receipt | `/plugin marketplace add scasella/claude-flightdeck` → `/plugin install flightdeck@claude-flightdeck`;\[32\] Featured on the awesome list; no file, process or network calls per StationX\[5\]\[8\] |
| context-bar, mission-control, where-am-i (hamzafer, 17-mod pack) | Stacked context bar by category; agents, tool calls and the files they touch; goal, current step and what waits on you | `claude plugin marketplace add hamzafer/claude-code-mods` → `claude plugin install context-bar@claude-code-mods`; lines stack and hide when empty; also has cache-clock and usage-meter\[6\]\[33\]\[34\] |
| cctop | Context, cost, rate limits, tool stats in a side pane | Small (11★)\[6\] |
| savvy-progress, hivemind, agent-flow, plan-progress, telltale | Subagent trees with model, context, cost and time; plan as progress bars\[6\] | Pick one |
| quota-meter, token-ledger, context-lens, budget-guard (Arunjay) | 5h/7d limits with projection, cache hit ratio, turns-left-before-compaction, hard budget stops | No LICENSE file (README says MIT), per StationX\[6\]\[8\] |
| claude-code-usage-quota, wavy-usage, claude-mod-usage (jack21) | Plan limits and run-out forecast as bars or rings | jack21 stacks politely under other band mods\[6\]\[35\] |
| cache-tax / cache-keeper | Prompt-cache countdown, cold-send guard, optional keep-warm pings\[6\] | Keep-warm spends tokens\[5\] |
| turn-timeline, change-ledger, session-meter | Where the turn's time went; per-file edit ledger\[6\] | — |
| autotel | OpenTelemetry traces of hook dispatch and tool durations\[6\] | Good fit for your observability-minded agent work |
| gh-ci-status, cc-pr-tracker, pull-request-pane, linear | CI runs, PR state, Linear issues above the prompt or in a pane\[6\] | Need `gh`/tokens |

**Analytics outside the session.** ccusage (19.0k★ and 877 forks on GitHub, written in Rust) reads local JSONL logs. Its README says MIT, though mrtechking.com lists the repo licence as "custom (Other)". Useful commands: `ccusage daily`, `ccusage blocks --active`, `ccusage session`, and `--json`.\[36\]\[37\] Per mrtechking.com, it now "reads the logs of 18 agents, including Codex, OpenCode, Amp, Gemini CLI, GitHub Copilot CLI…"

#### 2d. Usability and productivity

| Tool | Type | What it does | Notes |
|---|---|---|---|
| Stop/Notification hooks + `notify-send` | Settings hook | Desktop alert when Claude finishes or needs input | Append `\|\| true` (a Stop hook exiting 2 blocks the stop); needs a notification daemon.\[38\]\[39\] Ghostty/kitty get Claude Code's own notifications by default\[20\]\[40\] |
| karanb192/claude-code-hooks | 22-plugin hook marketplace | git-safety (blocks pushes to main, destructive `gh`), protect-secrets, block-dangerous-commands, auto-stage, format-code, context-hogs leaderboard, cache-tax | Measured costs: auto-stage 68 ms, format-code 114 ms per call\[41\]\[42\] |
| ccnudge, rins_hooks, claude-code-templates hooks | Hook installers | Sound/notification, auto-commit, formatter\[43\]\[44\]\[45\] | Older shell-hook generation |
| filetree (data-goblin) | Mod | File tree with git status that highlights what Claude reads/edits;\[6\] click passes path | Sidebar needs fullscreen and ≥110 columns\[5\] |
| prompt-rail, claude-queue, command-buttons, next-steps, cc-prompt-enhance-mod | Mods | Prompt history rail, queued follow-ups, Run/Copy buttons, suggested next prompts\[6\] | — |
| auto-handoff, ctx-handoff, fast-jev-compaction, taskcut, workface | Mods | Smarter compaction/handoff\[6\] | Change model context; test carefully |
| Loop Breaker, Assertion Guardian, collision-guard, git-gates, anchorwatch | Mods | Stop edit ping-pong, refuse tests that drop assertions, avoid cross-session edit collisions\[6\] | Guard mods **fail open** if they crash or time out\[8\] |
| secret-redactor, honmoon-redact, recording-mode | Mods | Redact secrets/PII before the model sees them; mask screen while recording\[6\] | Useful for demos\[46\] |
| Shift+Enter | Native | Works out of the box in Ghostty, Kitty, WezTerm, and Alacritty ≥0.16 (kitty keyboard protocol, v2.1.269+) | gnome-terminal can't do it, so use Ctrl+J;\[47\] tmux needs `extended-keys`\[48\] |

#### 2e. Multi-session, monitoring and wrappers

| Tool | What it does | Linux |
|---|---|---|
| Claude Squad (smtg-ai) | Go TUI: tmux sessions + git worktree per agent, diff preview, commit/push; 8.6k★ and 625 forks on GitHub (8.5k on Sep 13, 2026 per star-history.com), AGPL-3.0 | Yes; needs tmux + gh |
| Agent Deck | tmux TUI; session forking, per-session MCP toggling, MCP socket pooling (claims 85–90% memory reduction)\[49\] | Yes |
| craftzdog/tmux-claude-session-manager | tmux plugin: picker (`prefix + u`), live working/waiting/idle status via hooks\[50\] | Yes |
| `claude agents` (native agent view) | Built-in view of dispatched sessions\[51\] | Yes |
| claude-fleet, syzygy, console-status (mods) | Session boards from inside Claude Code\[6\] | New, low adoption |
| Multi-Agent Observability Dashboard | Streams hook events to a web UI (~1.3k★)\[52\] | Yes |

#### 2f. Fun and novelty
Popular "while you wait" mods:
- intermission: multiplayer Doom in a pane that hands control back when Claude needs you.\[6\]\[8\]
- claude-doom (Apple Silicon alpha).\[53\]
- cc-arcade: nine games plus a pet.\[6\]
- mindful-claude: guided breathing.\[6\]\[53\]
- claude-pokemon, claudagotchi and cc-tamagotchi: pets.
- coaster-tycoon, tool-snake, context-dungeon, speedrun-splits.
- ClaudeAmp: a Winamp-style player whose playlist is your tool calls.\[6\]
- roll-credits: session "movie credits".\[6\]

Several are macOS-only, including Spotify/Apple Music players, adlib-lyrics and cc-shorts.\[6\] Most are zero-token, but they still occupy your band or pane.

### 3. Usability assessment

**Mature or well-regarded:**
- claude-hud, ccstatusline, claude-powerline, ccusage, Claude Squad and karanb192/claude-code-hooks. These are months old, have big adoption and are actively maintained.
- Among mods: Anthropic's samples (as references), flightdeck (Featured, read-only), hamzafer's pack, image-view, filetree and prismantis. All are on the awesome list's six-pick Featured shelf or have meaningful adoption.\[5\]

**Treat as experimental.** Almost everything else, since most mods are 0–20★ and a week or two old. The API is still moving: v2.1.288 brought the first mod fixes plus `$.ui.selection()`, and v2.1.289 fixed stale local-marketplace copies and a case where a mod approval beat a deny rule.\[8\] Directory listings note the Claude Code version each author tested with.\[6\]

**Common pitfalls:**
- **Band crowding.** Each band mod should stack via `await next(e)`.\[54\] Poorly written ones overwrite others or hide Claude Code's task list.\[8\] Limit yourself to 2–3 band mods.
- **Redraw cost and flicker.** Keep render hooks cheap, because the band can redraw ~30×/sec.\[11\] Per secondary reports, all installed mods share one worker thread, and repeated crashes can unload every non-built-in mod.\[8\]
- **Hidden token spend.** Mods that call `$.model.fork`/`complete`,\[8\] inject prompt hints (prismantis) or keep the cache warm all bill your plan.\[8\]
- **Guards fail open.** A crashed or timed-out mod guard lets the call continue to normal permissions.\[8\]
- **tmux breaks image mods.** Kitty-graphics mods fall back to half-blocks inside tmux/screen, and Claude Code doesn't yet wrap images for tmux passthrough (issue #100146).\[25\]
- **tweakcc patches** can break or reset on Claude Code updates.\[55\]
- **Supply chain.** Ehud Melzer of Pluto Research published "Inside Claude Code Function Hooks: The Trust Problem Behind Claude Mods" on Sep 22, 2026, testing the pre-release build (v2.1.274). A test mod "returned the Claude Code OAuth credential and an 834 KB history.jsonl containing every prompt we had ever typed, across every project and session." Pluto also showed a mod that hooks everything reported as "Hooks (0)" by `claude plugin details`, UI spoofing, and code fetched after review via un-pinned `$.http.fetch`. Pluto credits what held: no ambient fetch/require/eval, and the permission prompt can't be rewritten. The `sec-default` guard only loads on Team/Enterprise or managed machines,\[8\] so on a personal setup you are the reviewer.\[8\]

**Community consensus.** Reviewers converge on the same advice:
- Use the lightest tool first: instruction, then setting or statusline, then hook, then mod.\[8\]
- Keep one statusline and add a few insight mods.
- Run `claude plugin validate` before installing.\[56\]

Launch-week pushback on Hacker News and r/ClaudeCode focused on malicious-mod risk and lock-in.\[8\] HN commenters called mods "a grasp at all the pi and dsh users".\[57\] One HN thread found AGENTS.md support only worked with telemetry on, because that built-in mod sat behind a remote switch.\[8\]

### 4. Notable setups and showcases
- **Matt Pocock's "perfect status line"** (aihero.dev, Feb 2026): repo name, git branch and context-window % via a bash script plus ccstatusline.\[58\] A minimal, high-signal baseline.
- **Yiğit Konur's statusline comparison** (Apr 2026, 24 repos plus 2 gists) found the best quick-glance layout in Ghostty was not a framework. It was the shell lineage from SippieCup's March 30, 2026 gist, tuned with stronger severity colors and a giant context row.\[28\]
- **StationX's HAL setup.** Nathan House's team built three daily mods (next-steps buttons, a dashboard, a guard).\[8\] They switched the guard off within a day because it over-triggered, and found their dashboard band hid Claude Code's task list.\[8\] This is a useful cautionary tale.
- **hamzafer's published "My setup"** stacks context-bar, token-weather, usage-meter, where-am-i and review-watch as self-hiding lines above the prompt.\[33\]\[34\] It is the closest thing to a shared "dotfiles rice" for mods.
- **XDA's hands-on** paired ccstatusline with a pile of Reddit and GitHub mods and admitted many are "ridiculously fun" but not practical.\[59\]
- **Reddit showcases** (via the claudemods.dev catalogue): a custom-colors-plus-toolbar mod with usage meter, cache countdown and stock ticker, and a permission-gate mod claiming median latency fell from 329 ms to 164 ms.\[60\] These are unverified secondhand summaries.
- **YouTube.** Start with these:
  - Thariq Shihipar (Anthropic) on Latent Space: mods, forking, mutable software.\[8\]
  - Chase AI, "Claude Mods Is The Biggest Claude Code Upgrade Since Skills".
  - Nate Herk, "Set Up These 5 NOW" (cache-keeper, recording-mode, goal-meter, collision-guard).
  - Mark Kashef, "10 Worth Stealing".
  - lustoykov (image viewer, cost band).
  - Mr. Cloud Book's 18-minute architecture tour.\[8\]

  No Linux-specific or r/unixporn-style Claude Code rice videos turned up.

### 5. Emerging trends and gaps
**Trends:**
- Built-in features are being turned into mods ("small core").\[4\]
- Fork-based "smart" mods use `$.model.fork` to supervise, quiz or suggest next steps cheaply while the cache is warm.\[8\]
- Cache-economics tooling is spreading (cache-tax, cache-clock, cache-keeper).
- Multi-model routing mods (multi-core, lane-stack, agent-router, fable-pin).\[6\]
- Capability-scanning catalogues: aidojo access badges, claudemods.dev safety reviews, mod-audit's update-diffing.\[61\]
- Inline graphics via the kitty protocol.

**Gaps where nothing good exists yet:**
- Integrity-pinned or signed mod updates. mod-audit's baseline/diff is a stopgap.\[62\]
- A theme-sync mod that derives the Claude Code theme from your terminal or wallpaper palette (pywal/matugen style).
- Linux-native media and desktop integrations. Spotify/Music mods are macOS-only, and there is no MPRIS mod.
- Robust tmux/zellij passthrough for image mods.
- A coordinated band layout manager so mods don't fight over AbovePrompt.
- Any r/unixporn-grade, Linux-first published rice.

## Recommendations: a curated Linux setup for you

This stack fits an agentic-AI product engineer (Python/FastAPI, React, Docker, GCP, AutoGen, MCP) who wants beauty and density without fragility.

**Step 0: Prerequisites.**
- Run `claude --version` and check it is ≥ 2.1.287 (otherwise `claude update`).
- Install Node ≥18 (mod-finder needs it)\[63\] and Bun (for ccusage/ccstatusline), plus `libnotify-bin`, `gh` and tmux.

**Step 1: Terminal and font.**
- Use **Ghostty** (or **kitty**). Both support the kitty graphics protocol (needed for image-view, figures and mermaid-inline), native Shift+Enter, and Claude Code notifications by default.\[20\]\[40\]
- Install JetBrains Mono Nerd Font for powerline glyphs. Set a Catppuccin Mocha (or Dracula) terminal palette.
- Use native terminal splits for the Claude pane, so image mods keep real pixels. Reserve tmux for the session manager.

**Step 2: Claude Code theme.**
- Run `/theme` → "New custom theme…", or create `~/.claude/themes/catppuccin.json` with `"base": "dark"` and overrides such as `"claude": "#cba6f7"`.\[20\]\[64\]
- It hot-reloads.\[64\] Optionally run `npx tweakcc` for custom thinking verbs and spinners, but expect to re-apply after updates.

**Step 3: Statusline. Pick one.**
- **claude-hud** (recommended for you): it surfaces active tools, running subagents and todo progress, which matches agentic workflows. Install with `/plugin marketplace add jarrodwatts/claude-hud` → `/plugin install claude-hud` → `/claude-hud:setup`.\[65\]
- **Alternative:** `npx ccstatusline@latest` for a two-line powerline with model, context %, 5h/7d limits, git branch and cost.

**Step 4: Mods. Install at most 4, and validate each first.**
1. `git clone` each mod, run `claude plugin validate ./mod`, and read the `hooks:`/`calls:` lines.\[3\]
2. Add **token-weather** (playground) *or* **context-bar** (hamzafer) for context at a glance.
3. Add **flightdeck** for a read-only subagent, permission and cost pane, toggled when you're debugging agent runs.
4. Add **blast-radius** as an interactive destructive-command check. Keep the shell-hook guard too, because mod guards fail open.
5. Optional: **image-view** if you paste screenshots of React UIs, and **filetree** if your monitor gives ≥110 columns fullscreen.
6. Use `mod-finder` (`/plugin install mod-finder --marketplace karanb192/awesome-claude-code-mods`) to discover more, but apply the same vetting.\[5\]

**Step 5: Hooks (non-negotiable guardrails and notifications).**
- `/plugin marketplace add karanb192/claude-code-hooks`, then install `git-safety`, `protect-secrets` and `block-dangerous-commands`.\[42\] Add `format-code` if ruff fits your Python stack (~114 ms/call).\[41\]
- Add `Stop` and `Notification` hooks running `notify-send 'Claude Code' '…' || true`.\[66\]

**Step 6: Analytics and sessions.**
- Bind `ccusage blocks --active` and `ccusage daily --breakdown` to shell aliases.
- For parallel agents, use **Claude Squad** (`go install github.com/smtg-ai/claude-squad@latest`) or craftzdog's tmux-claude-session-manager with live working/waiting/idle status.\[50\]\[67\]

**Step 7: Hygiene.**
- Pin mods to commits you reviewed. Re-validate on every update (mod-audit `baseline`/`diff` helps).\[62\]
- Keep `claude --safe-mode` in mind for debugging.
- Remember that `disableAllHooks` also kills your statusline.\[3\]\[11\]

## Caveats
- Mods are two weeks old. Event names, limits and APIs may change, and some behavior (the shared worker thread, crash-unload rules) is reported secondhand via StationX rather than confirmed in docs I read.
- Star counts are snapshots from different dates and, for mods, often reflect the host repository. For example, ccstatusline was at 7,638 in April 2026 and shows 8.6k on GitHub now.
- Reddit content was gathered indirectly (catalogue summaries and secondary guides). Specific Reddit quotes and upvote counts could not be verified, and no r/unixporn Claude Code posts were found.
- Pluto's security findings were demonstrated on a pre-release build.\[8\] Some disclosure gaps may since have changed, but the core "unsandboxed, full permissions" model is unchanged by design.\[8\]
- Several community mods lack licenses or have unverified claims (e.g., latency improvements, memory savings). Treat them as marketing until you test them.

## Sources

1. [Claude Code Gets Mods, Plugins That Rewrite the Agent](https://pasqualepillitteri.it/en/news/19871/claude-code-mods-plugins)
2. [Claude Code Mods Just Landed: First Hook, Blast Radius Guard, and Why They're Not Sandboxed - DEV Community](https://dev.to/yong_yu_f98e15562e9b120a0/claude-code-mods-just-landed-first-hook-blast-radius-guard-and-why-theyre-not-sandboxed-3225)
3. <https://code.claude.com/docs/en/plugins/mods/overview>
4. [Customize Claude Code with mods in TypeScript | Claude by Anthropic](https://claude.com/blog/claude-code-mods)
5. [GitHub - karanb192/awesome-claude-code-mods: Community catalogue of public Claude Code mods (function hooks), scanned from GitHub with what each mod can read, write, run or send over the network. Browse https://mods.aidojo.si/](https://github.com/karanb192/awesome-claude-code-mods)
6. [Claude Mods: a directory of mods for Claude Code · Claude Mods](https://claude-mods.com/)
7. [Claude Code Mods: Extensions Running Inside Claude Code — rotecodefraktion](https://www.rotecodefraktion.de/en/blog/claude-code-mods/)
8. [Claude Code Mods: The Complete Guide + 34 Videos (2026)](https://app.stationx.net/articles/claude-code-mods)
9. [Best Claude Code Mods to Try First (October 2026) — StashBase](https://stashbase.ai/blog/best-claude-code-mods/)
10. [Mods reference - Claude Code Docs](https://code.claude.com/docs/en/plugins/mods/reference)
11. [Wish Claude Code Worked Your Way? Write Your First Mod](https://21zerixpm.medium.com/wish-claude-code-worked-your-way-write-your-first-mod-ad157c60e3fb)
12. [Getting started with Claude Code mods / claude.dev Blog](https://claude.dev/blog/getting-started-with-claude-code-mods/)
13. [Claude Code Mods: Building Custom UI and Behavior from Inside the Agent](https://betterstack.com/community/guides/ai/claude-code-mods/)
14. [Claude Code Mods: Official TS Plugins (Oct 1)](https://explainx.ai/blog/claude-code-mods-typescript-plugins-guide-2026)
15. [Token Weather Mod for Claude Code: What It Does & How to Use It](https://ccmodshub.com/mods/token-weather)
16. [token-weather: a Claude Code mod by qarge](https://claudemods.si/mods/token-weather-qarge)
17. [token-weather - Claude Code Mods - ModsCode](https://modscode.com/claude-mods/mods/aicoder2009-token-weather/)
18. [Claude Code's new Mods system lets developers rewrite the AI coding tool from the inside](https://the-decoder.com/claude-codes-new-mods-system-lets-developers-rewrite-the-ai-coding-tool-from-the-inside/)
19. [Thariq on X: "Claude can make mods for you! just prompt it, read more in @addyosmani's blog post here: https://t.co/nLxZnw6tyq" / X](https://x.com/trq212/status/2105734202209755614)
20. [Configure your terminal for Claude Code - Claude Code Docs](https://code.claude.com/docs/en/terminal-config)
21. [GitHub - Piebald-AI/claude-code-themes: Community themes for Claude Code. Use tweakcc to apply them. · GitHub](https://github.com/Piebald-AI/claude-code-themes)
22. [GitHub - pnf/claude-tweakcc: Customize Claude Code's system prompts, create custom toolsets, add custom themes/thinking verbs/spinner, input box style, user message display, sign-in ASCII art, fix bugs (frozen spinner), and add features (context limit customization). Supports both native (binary) and npm installs on all platforms.](https://github.com/pnf/claude-tweakcc)
23. [Homebrew Formulae: tweakcc](https://formulae.brew.sh/formula/tweakcc)
24. [ClaudeLog - Claude Code Docs, Guides, Tutorials & Best Practices](https://claudelog.com/claude-code-mcps/tweakcc/)
25. [GitHub - jarrodwatts/claude-image-view: See the images you paste into Claude Code: thumbnails above the prompt instead of bare \[Image #1\] tags · GitHub](https://github.com/jarrodwatts/claude-image-view)
26. [Claude Code ft. Codex, Gemini and clickable hyperlinks - DEV Community](https://dev.to/newellpaul/claude-code-without-leaving-the-terminal-3i1j)
27. [Claude Code Status Line: Context Usage in a Powerline Bar](https://levelup.gitconnected.com/claude-code-status-line-context-usage-in-a-powerline-bar-e7f9344824ec?gi=41429df5a84e)
28. [Claude Code Statuslines Compared](https://yigitkonur.com/research/claude-code-statuslines-compared)
29. [GitHub - AwesomeJun/CC-statusline: An aesthetic statusline for Claude Code by awesomejun · GitHub](https://github.com/AwesomeJun/CC-statusline)
30. [claude-statusline: a configurable status line for Claude Code](https://felipeelias.github.io/2026/03/17/claude-statusline.html)
31. [Statusline Integration (Beta) 🚀](https://ccusage.com/guide/statusline)
32. [flightdeck: a Claude Code mod by scasella](https://claudemods.si/mods/flightdeck)
33. [claude-code-mods/docs/mods.md at main · hamzafer/claude-code-mods · GitHub](https://github.com/hamzafer/claude-code-mods/blob/main/docs/mods.md)
34. [GitHub - hamzafer/claude-code-mods: Claude Code mods: plugins built on hooks that add live lines above the prompt, guards, panes and games. Context bar, usage meter, Codex review watch, Markdown preview, Spotify now playing and more. · GitHub](https://github.com/hamzafer/claude-code-mods)
35. [GitHub - jack21/claude-mod-usage: Claude Code Mod: context, 5-hour and 7-day usage as gradient progress bars above the prompt. 12 languages. · GitHub](https://github.com/jack21/claude-mod-usage)
36. [stars/stars/ryoppippi/ccusage.md at master · DavidWells/stars](https://github.com/DavidWells/stars/blob/master/stars/ryoppippi/ccusage.md)
37. [ccusage/docs/guide/blocks-reports.md at main · ryoppippi/ccusage](https://github.com/ryoppippi/ccusage/blob/main/docs/guide/blocks-reports.md)
38. [Get a desktop notification when Claude Code finishes, with a Stop hook - DEV Community](https://dev.to/aicoding-guide/get-a-desktop-notification-when-claude-code-finishes-with-a-stop-hook-3832)
39. [Claude Code Notifications: Stop Babysitting Your AI](https://startupbros.com/claude-code-notifications/)
40. [Best Terminal for Claude Code on Mac (2026)](https://www.agentastic.dev/compare/best-terminal-for-claude-code)
41. [GitHub - karanb192/claude-code-hooks: 🪝 Claude Code hooks + an installable plugin marketplace: safety, cost, observability, productivity. · GitHub](https://github.com/karanb192/claude-code-hooks)
42. [GitHub - k21993/claude-code-hooks: 🪝 Claude Code hooks + an installable plugin marketplace: safety, cost, observability, productivity. · GitHub](https://github.com/k21993/claude-code-hooks)
43. [Simple Notifications Hook for Claude Code: Desktop Alerts for macOS & Linux](https://aitmpl.com/blog/simple-notifications-hook/)
44. [github.com](https://github.com/RonitSachdev/ccnudge)
45. [rins hooks](https://github.com/maker95/rins_hooks)
46. [Claude Code Mods Are Game Changers. Set Up These 5 NOW.](https://x.com/nateherk/article/2106143340794454346)
47. [New line in Claude Code without sending: Ctrl+J works in every terminal, Shift+Enter doesn't](https://wmedia.es/en/tips/claude-code-new-line-shift-enter)
48. [Ghostty the terminal for Claude Code: Config, Splits, and Scripts](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)
49. [\[Resource\]: Agent Deck · Issue #712 · hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code/issues/712)
50. [I made a Claude Code session manager for tmux](https://www.devas.life/i-made-a-claude-code-session-manager-for-tmux/)
51. [How to Manage Multiple Claude Code and Codex Sessions in 2026](https://superset.sh/compare/manage-multiple-coding-agent-sessions)
52. [GitHub - ithiria894/awesome-claude-code-hooks: Curated collection of Claude Code hooks for event-driven automation · GitHub](https://github.com/ithiria894/awesome-claude-code-hooks)
53. [awesome-claude-code-mods/docs/RESEARCH.md at main · whyashthakker/awesome-claude-code-mods](https://github.com/whyashthakker/awesome-claude-code-mods/blob/main/docs/RESEARCH.md)
54. [Draw in the interface with a mod - Claude Code Docs](https://code.claude.com/docs/en/plugins/mods/interface)
55. [tweakcc install and themes for Claude Code](https://hysenlabs.com/projects/piebald-ai-tweakcc)
56. [Best Claude Code Mods and Where to Find Them](https://capitalandcompute.net/blog/best-claude-code-mods/)
57. [The AGENTS.md support was implemented via our new extensibility system for CC, c...](https://news.ycombinator.com/item?id=49815421)
58. [Creating The Perfect Claude Code Status Line - Freek Van der Herten's blog on Laravel, PHP and AI](https://freek.dev/3010-creating-the-perfect-claude-code-status-line)
59. [Claude Code can now be modded like a video game, and I couldn't stop tinkering](https://www.xda-developers.com/claude-code-just-became-moddable-like-a-video-game/)
60. [Reddit posts — Claude Code plugins · ClaudeMods](https://claudemods.dev/en/types/reddit)
61. [karanb192/awesome-claude-code-mods](https://deepwiki.com/karanb192/awesome-claude-code-mods)
62. [mod-audit v0.2: the update is the attack — delta risk reports for Claude Code Mods - DEV Community](https://dev.to/haoli/mod-audit-v02-the-update-is-the-attack-delta-risk-reports-for-claude-code-mods-15f2)
63. [Awesome Claude Code Mods](https://mods.aidojo.si/)
64. [Claude Code Themes: Customize Your Terminal Colors](https://claudcod.com/blog/claude-code-themes/)
65. [https://github.com/jarrodwatts/claude-hud](https://awesome.ecosyste.ms/projects/github.com/jarrodwatts/claude-hud)
66. [Claude Code: Set up desktop notifications so you never miss an input request](https://geeknet.me/claude-code-set-up-desktop-notifications-so-you-never-miss-an-input-request/)
67. [Best Claude Code Session Managers 2026 — 6 Tools Compared](https://amux.io/guides/best-claude-code-session-managers-2026/)
