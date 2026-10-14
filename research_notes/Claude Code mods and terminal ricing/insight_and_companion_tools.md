# Insight and companion tools for Claude Code beyond the status line (as of 2026-10-14)

Scope: built-in insight commands, usage/cost monitors, observability (OpenTelemetry, dashboards, hook loggers, API proxies), transcript/session viewers and replay tools, multi-session managers/GUIs, community sentiment, privacy/security, plus the "wow / flex factor" view the user asked for. Status-line tools are out of scope except where a tool also ships a separate dashboard. Mods are covered elsewhere; this file only notes companion tools that also ship as a mod or plugin.

## 1. Built-in insight commands and views (Claude Code v2.1.299, released 2026-10-14)

### Takeaway
In Oct 2026 Claude Code ships its own insight layer. `/usage` is now the hub: `/cost` and `/stats` are aliases for its tabs. It shows session cost, plan-limit bars, an activity heatmap, prompt-cache diagnostics, and what is using up your plan (skills, subagents, plugins, MCP servers, loops). `/context` shows a token grid with optimization tips, and `/insights` writes an HTML report on how you work. Agent view (`claude agents`, with a `--json` mode for scripts) is the official multi-session dashboard. `/todos` is no longer in the command reference; the task checklist is toggled with Ctrl+T.

### Cited Findings

#### Method and data notes (how the numbers in this file were gathered)
- Installed CLI checked locally: `claude --version` reports `2.1.299 (Claude Code)`, and `claude --help` lists the subcommands `agents`, `attach`, `logs`, `stop|kill`, `respawn`, `rm`, `doctor`, `purge`, `gateway`, `ultrareview`, `plugin`, `mcp`, `update`, plus flags such as `--bg`, `--remote-control`, `--cloud`, `--desktop`, `--tmux` and `-w/--worktree`. Source: local `claude --help` output on 2026-10-14. The same subcommands appear in the CHANGELOG — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Version release dates come from the npm registry `time` map: 2.1.299 → 2026-10-14, 2.1.287 → 2026-10-01, 2.1.139 → 2026-05-11, 2.1.118 → 2026-04-22, 2.0.0 → 2025-09-29 — [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code). npm dist-tags on 2026-10-14: `latest` 2.1.299, `stable` 2.1.287, `next` 2.1.300 — [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code).
- GitHub star counts, last-push and creation dates for third-party repos come from the public GitHub API mirror `https://ungh.cc/repos/{owner}/{repo}`, fetched 2026-10-14. api.github.com and github.com HTML were blocked by this session's proxy. License and top language come from `https://img.shields.io/github/license/{owner}/{repo}.json` and `.../languages/top/...`. Releases come from `https://ungh.cc/repos/{owner}/{repo}/releases`. Values marked "~" are rounded shields.io star badges (`https://img.shields.io/github/stars/{owner}/{repo}.json`). npm weekly downloads come from `https://api.npmjs.org/downloads/point/last-week/{pkg}`. Example: [ungh ccusage](https://ungh.cc/repos/ccusage/ccusage).
- Community signals from Hacker News were pulled from the Algolia HN API (e.g. [HN search API](https://hn.algolia.com/api/v1/search?tags=story&query=ccusage)). Reddit could not be accessed: WebSearch rejected reddit.com as "not accessible to our user agent".

#### `/usage` (with `/cost` and `/stats` as aliases): cost, plan limits, stats, attribution
- `/usage` is described as "Show session cost, plan usage limits, and activity stats. On a Pro, Max, Team, or Enterprise plan, includes a breakdown of what counts against your plan limits. `/cost` and `/stats` are aliases". `/stats` "Opens on the Stats tab" — [Commands reference](https://code.claude.com/docs/en/commands).
- History: `/usage` was added in 2.0.0 (2025-09-29) "to see plan limits". `/stats` was added in 2.0.64 (2025-12-10) with "favorite model, usage graph, usage streak". `/stats` got a date-range filter (`r` cycles 7d/30d/all) in 2.1.6 (2026-01-13). 2.1.118 (2026-04-22) "Merged `/cost` and `/stats` into `/usage` — both remain as typing shortcuts that open the relevant tab" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Session block (API users): an example shows `Total cost`, `Total duration (API)`, `Total duration (wall)`, `Total code changes`, and `Usage by model` with input/output/cache read/cache write per model. The doc warns: "The Session block in `/usage` shows API token usage and is intended for API users… Max and Pro subscribers… the session cost figure isn't relevant for billing purposes". The dollar figure "is an estimate" computed locally at list price unless a managed `modelPricing` table is set — [Manage costs](https://code.claude.com/docs/en/costs).
- Prompt-cache diagnostics: a `Prompt cache (main)` line gives request count, share of input tokens served from cache, misses, expected rebuilds, and warm/cold with TTL. It requires v2.1.251, and the likely-cause text ("likely cause: tool definitions changed") requires v2.1.260 — [Manage costs](https://code.claude.com/docs/en/costs); CHANGELOG 2.1.251 (2026-08-28) and 2.1.260 (2026-09-03) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Plan usage breakdown on Pro/Max/Team/Enterprise:
  - Attribution to skills, subagents, plugins and individual MCP servers.
  - Behavior flags such as long context or cache misses when one passes 10% of usage.
  - Loops rows for `/loop` and scheduled tasks, which the docs say need v2.1.242+. The CHANGELOG lists the feature under 2.1.243.
  - `d`/`w` toggles 24h/7d. "The figures are approximate and computed from local session history on this machine, so usage from other devices or claude.ai is not included."
  - Sources: [Manage costs](https://code.claude.com/docs/en/costs); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) (2.1.149 per-category breakdown, 2.1.243 Loops).
- Stats tab extras:
  - An activity heatmap (2.1.246 fixed it being one cell off east of UTC).
  - "Stats screenshot (Ctrl+S in /stats)" (2.1.84), which copies a stats image to the clipboard (2.1.132 fixed a Linux/X11 hang).
  - Sources: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Newest: 2.1.299 (2026-10-14) "Added `/usage` warnings for max effort, workflows, always-on context and large tool results". It also fixed `/usage` and the status line sometimes showing more than 100% used — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- When the plan-usage endpoint is rate-limited, `/usage` shows last-known bars from the past 60 minutes with a "Showing last-known usage" note; `r` retries — [Manage costs](https://code.claude.com/docs/en/costs).
- VS Code: `/usage` opens a native Account & Usage dialog (2.1.120), with usage attribution over 24h/7d (2.1.174). `/context` opens a native token-usage dialog (2.1.121) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).

#### `/context`: context-window grid and optimization tips
- "Visualize current context usage as a colored grid. Shows optimization suggestions for context-heavy tools, memory bloat, and capacity warnings". `/context all` gives per-skill estimates — [Commands reference](https://code.claude.com/docs/en/commands).
- History:
  - Added in 1.0.86 (2025-08-20) "to help users self-serve debug context issues".
  - Grouped skills/agents by source in 2.0.74.
  - "actionable suggestions" in 2.1.74 (2026-03-11).
  - Warns when the conversation exceeds the window (2.1.216).
  - MCP server instructions counted as their own row (2.1.283).
  - Sources: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).

#### `/insights`: an LLM-written HTML report on how you work
- "Generate an HTML report analyzing your recent sessions on this machine: which projects you work in, how you use Claude Code, where things go wrong, and features to try. Not available in cloud sessions" — [Commands reference](https://code.claude.com/docs/en/commands).
- Details:
  - It analyzes "up to 200 sessions it hasn't seen before and skips very short ones".
  - It writes `~/.claude/usage-data/report.html` plus timestamped copies, deleted with other session data after `cleanupPeriodDays` (30 days by default).
  - "The analysis runs through the same provider and account as your regular sessions, and the tokens count against your plan or API usage. Sessions from other devices and claude.ai aren't included."
  - Sources: [Manage costs](https://code.claude.com/docs/en/costs).
- It can estimate how many permission prompts auto mode would have handled (2.1.281, 2026-09-23). It uses the default Opus model unless the deployment can't reach it (2.1.269). It had a Windows `EBUSY` crash fix in 2.1.113 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Launch timing: no "Added /insights" CHANGELOG line was found; the earliest CHANGELOG mention is 2.1.101 (2026-04-10). Hacker News discussion dates to 2026-02-04 ("Claude Code's /Insights", 13 points) — [HN](https://news.ycombinator.com/item?id=46889088). Blog coverage gives conflicting details (30 days vs 50 sessions; Opus vs Haiku). Prefer the official doc — [vincentqiao blog](https://blog.vincentqiao.com/en/posts/claude-code-insights/), [pasqualepillitteri](https://pasqualepillitteri.it/en/news/408/claude-code-insights-workflow-command).

#### `/status`, `/doctor` / `claude doctor`, `/release-notes`, `/heapdump`, `/debug`
- `/status`: "Open the Settings interface on the Status tab, showing version, model, account, and connectivity", plus a `Session kind` row (`background job · attached/unattended` or `interactive`) — [Commands reference](https://code.claude.com/docs/en/commands). Recent additions:
  - Auto-mode server row (2.1.278).
  - Organization policy line (2.1.261).
  - Ignored-telemetry-variable entries (2.1.282).
  - Sandbox-policy warning (2.1.290).
  - Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- `/doctor [prompt-audit [path]]` is a bundled skill: "Run a setup checkup that diagnoses installation, settings, extension, and CLAUDE.md problems and proposes fixes that Claude applies after you confirm" — [Commands reference](https://code.claude.com/docs/en/commands). `prompt-audit` (also `/checkup prompt-audit`) audits CLAUDE.md, skills, agents and commands "for prompting patterns written for older models" (2.1.283, 2026-09-25) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md). The shell command `claude doctor` "Check[s] the health of your Claude Code installation… For a full checkup that can also fix issues, run /doctor in a session" — local `claude --help`.
- `/release-notes` opens an interactive version picker over the changelog — [Commands reference](https://code.claude.com/docs/en/commands).
- `/heapdump` writes a JS heap snapshot plus memory breakdown. The `.heapsnapshot` "contains your full conversation and credentials" — [Commands reference](https://code.claude.com/docs/en/commands).
- `/debug [description]` (skill) turns on debug logging mid-session and reads the debug log — [Commands reference](https://code.claude.com/docs/en/commands).

#### Task, transcript and session views
- `/todos` was added in 1.0.94 (2025-08-27) "to list current todo items" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md). It does not appear in the current [Commands reference](https://code.claude.com/docs/en/commands). `Ctrl+T` now toggles "Claude's task checklist" (up to five tasks shown), which "is not the background-task view; use `/tasks`" — [Interactive mode](https://code.claude.com/docs/en/interactive-mode).
- `/tasks` (alias `/bashes`): "View and manage background work in the current session, including subagents that have finished" — [Commands reference](https://code.claude.com/docs/en/commands). `/workflows` opens a progress view to watch, pause, resume or save workflows — [Commands reference](https://code.claude.com/docs/en/commands).
- Transcript viewer `Ctrl+O`: "Shows detailed tool usage and execution, with a timestamp and the model used on each assistant message." In fullscreen rendering it adds `less`-style navigation, `/` search, and `[` to "write the full conversation to your terminal's native scrollback so Cmd+F, tmux copy mode, and other native tools can search it" — [Interactive mode](https://code.claude.com/docs/en/interactive-mode); [Fullscreen rendering](https://code.claude.com/docs/en/fullscreen). 2.1.296 cached syntax-highlighted blocks to speed the toggle — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- `/export [filename]` exports the conversation as plain text (added 1.0.44, 2025-07-07) — [Commands reference](https://code.claude.com/docs/en/commands); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md). `/recap` gives a one-line session summary on demand; an automatic recap appears after you've been away ≥3 minutes in sessions with ≥3 turns (feature added 2.1.108, 2026-04-14) — [Interactive mode](https://code.claude.com/docs/en/interactive-mode); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md). `/btw` asks a side question "without adding to the conversation history" — [Interactive mode](https://code.claude.com/docs/en/interactive-mode).
- "You should know" is a built-in mod. A side agent shows a note above the prompt when it finds something you might have missed. Turn it on with `/plugin enable cc-plugin-you-should-know@builtin`; it needs first-party sessions with telemetry on (2.1.287, 2026-10-01) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).
- Other built-in mods include `cc-plugin-diff`, which takes over `/diff` and draws its pane, and `cc-plugin-telemetry`, which sends Claude Code's own analytics records — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview). Mods themselves were added in 2.1.287: "Added Claude Mods: plugins may now modify deeper behavior" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).

#### Agent view: the official multi-session dashboard (details in section 5)
- `claude agents` opens "one screen for all your background sessions: what's running, what needs your input, and what's done"; it is a research preview — [Agent view docs](https://code.claude.com/docs/en/agent-view). It was added in 2.1.139 (2026-05-11) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- `claude agents --json [--all] [--cwd <path>]` "is the supported way to read session state from outside Claude Code, for example from a status bar, a scheduler, or another Claude session". Fields include `state` (working/blocked/done/failed/stopped), `status` (busy/waiting/idle) and `waitingFor` — [Agent view docs](https://code.claude.com/docs/en/agent-view); local `claude agents --help` ("for scripting; does not require a TTY").

#### Org-level analytics (built in)
- Teams/Enterprise get a dashboard at `claude.ai/analytics/claude-code`: usage metrics, contribution metrics with GitHub integration, a leaderboard, and data export. API customers get `platform.claude.com/claude-code` with usage, spend and team insights — [Analytics](https://code.claude.com/docs/en/analytics).

### Inferences
- For a single subscriber, the built-ins now cover most of what early third-party trackers existed for: plan bars, per-skill/MCP attribution, a heatmap with a screenshot shortcut, and cache-miss causes. Third-party trackers now earn their place by adding things the built-ins lack: cross-machine, cross-agent or long-history views; always-visible menu-bar or bar-widget displays; forecasting; and team aggregation.
- The official, version-stable integration surfaces for "riced" setups are `claude agents --json`, status-line JSON (`rate_limits`, `prompt_cache`), hooks (`transcript_path`) and OpenTelemetry. Parsing `~/.claude/projects/*.jsonl` directly is explicitly unstable (section 7).

### Gaps
- The exact version that introduced `/insights` could not be verified: there is no CHANGELOG "Added" line, and the earliest mention is 2.1.101. Public discussion starts 2026-02-04.
- Whether `/todos` was removed or is just undocumented could not be confirmed; no CHANGELOG removal entry was found.
- I could not run the commands interactively (constraint), so all output descriptions come from the docs and CHANGELOG, not screenshots I captured.

## 2. Usage and cost trackers (third-party)

### Takeaway
ccusage is still the default "zero-install" historical tracker: 19.0k stars and ~365k npm downloads a week. It is now multi-agent, and its old `blocks --live` monitor is gone (removed in v18; use its status line or another live tool). For live and forecasting views:
- Claude-Code-Usage-Monitor v4 (8.7k stars) is the TUI pick. It now prefers Claude Code's official status-line `rate_limits` over its own estimates.
- CodexBar (22.5k stars, macOS plus Linux/Omarchy) and Claude-Usage-Tracker (3.7k) are the menu-bar picks.
- Codeburn (11.4k stars, created Apr 2026) is the fast-rising "where is my spend wasted" tool.

Accuracy caveat: everything that reads local JSONL computes list-price estimates for this machine only. Subscribers should trust plan-percentage numbers from the official endpoint or status line over dollar figures.

### Cited Findings

| Tool | Insight it adds | Install | Platforms | Stars · last push · latest release · license · language | Maturity notes |
|---|---|---|---|---|---|
| **ccusage** ([repo](https://github.com/ccusage/ccusage), [meta](https://ungh.cc/repos/ccusage/ccusage)) | daily/weekly/monthly/session/5-hour `blocks` reports, per-model `--breakdown`, per-project `--instances`, `--json`, `--offline` pricing, `--compact` "perfect for screenshots", custom pricing overrides, beta `statusline`; covers Claude Code plus Codex, OpenCode, Amp, Droid, Gemini CLI, Copilot CLI and more ([README](https://github.com/ccusage/ccusage/blob/main/apps/ccusage/README.md)) | `npx ccusage@latest` · `bunx ccusage` · `pnpm dlx ccusage` · `nix run github:ccusage/ccusage` ([README](https://github.com/ccusage/ccusage/blob/main/apps/ccusage/README.md)) | Node/Bun anywhere | 19,002 · 2026-10-14 · npm 20.0.32 (2026-10-14) · MIT ([npm](https://registry.npmjs.org/ccusage)) · Rust 91.9% per GitHub stats | Repo moved from ryoppippi/ccusage to the `ccusage` org. ~364,993 npm downloads/week ([npm API](https://api.npmjs.org/downloads/point/last-week/ccusage)). "`blocks --live`… has been removed in v18.0.0… Please use the statusline command instead" ([docs](https://github.com/ccusage/ccusage/blob/main/docs/guide/blocks-reports.md)) |
| **Claude-Code-Usage-Monitor** ([repo](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor), [meta](https://ungh.cc/repos/Maciek-roboblog/Claude-Code-Usage-Monitor)) | Rich live TUI with burn rate, forecasts and reset-aware pace. v4.0.0 "Usage Ops Companion": `--statusline` captures official `rate_limits`, and "stale or expired captures fall back to labeled local estimates". `--once` exit codes, `--write-state` JSON "for status bars and dashboards", `--warehouse`, `--title-format` terminal-title template | `uv tool install claude-monitor` (recommended) · `pipx install claude-monitor` · `pip install claude-monitor`; run `claude-monitor` / `cmonitor` / `ccm` | macOS/Linux/Windows; WSL discovery | 8,743 · 2026-07-05 · v4.0.0 (2026-06-27) · MIT · Python | Plans: pro, max5 (88k tokens/$35), max20 (220k/$140), team ("estimate / unverified"), custom (P90 over the last 192 h, the default) ([README](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)). Show HN 245 pts / 135 comments (2025-06-19) ([HN](https://news.ycombinator.com/item?id=44317012)) |
| **CodexBar** ([repo](https://github.com/steipete/CodexBar), [meta](https://ungh.cc/repos/steipete/CodexBar)) | Menu-bar limits for many AI providers, Claude Code included: "Per-provider session, weekly, and monthly windows with countdowns to the next reset" | `brew install --cask codexbar`; Linux Qt 6 app; AUR `codexbar-cli` | macOS 14+; Linux (Wayland/X11); "On Omarchy, a native bar widget… follows your theme" | 22,488 · 2026-10-14 · v0.75.0 (2026-10-14) · MIT · Swift | "Reuses existing provider sessions — OAuth, device flow, API keys, browser cookies, local files — so no passwords are stored" ([README](https://github.com/steipete/CodexBar)) |
| **Claude Usage Tracker** ([repo](https://github.com/hamed-elfayome/Claude-Usage-Tracker), [meta](https://ungh.cc/repos/hamed-elfayome/Claude-Usage-Tracker)) | Native menu-bar app: session/weekly/per-model limits, usage-history charts, multi-profile, a "Dynamic Island (Beta)… notch HUD showing what Claude Code is doing in real time", statusline integration | Download `Claude-Usage.zip` from Releases | macOS 14+ | 3,656 · 2026-08-31 · v3.3.0 (2026-08-29) · MIT · Swift | "Credentials in the macOS Keychain, local storage, minimal anonymous analytics (version-only heartbeat), no cloud sync" ([README](https://github.com/hamed-elfayome/Claude-Usage-Tracker)) |
| **CCSeva** ([repo](https://github.com/Iamshankhadeep/ccseva), [meta](https://ungh.cc/repos/Iamshankhadeep/ccseva)) | Menu-bar 5-hour blocks, burn rate, weekly history, "server-truth limit gauges" read from Claude Code's OAuth usage endpoint (includes other devices) | Download from Releases | macOS 14+ | 806 · 2026-08-03 · v2.0.2 (2026-08-03) · MIT | Rewritten from Electron+ccusage to native Swift (~3 MB). Optional opt-in sync uploads token totals/cost/model, "never… prompts, responses, transcript content, project names or paths… or Claude OAuth credentials" ([README](https://github.com/Iamshankhadeep/ccseva)) |
| **Codeburn** ([repo](https://github.com/getagentseal/codeburn), [meta](https://ungh.cc/repos/getagentseal/codeburn)) | Spend by project/model/git branch/task across 37 tools. `codeburn optimize` lists token waste (re-read files, unused MCP servers). Desktop app, macOS menu bar, "Capacity Dock". `codeburn guard install` sets "spending caps for Claude Code" | `npx codeburn` · `npm install -g codeburn` · `brew install codeburn` (Node 22.13+) | macOS app; CLI wherever Node runs | 11,439 · 2026-10-13 · (release n/a) · MIT | Created 2026-04-13 and already 11k stars: the fastest riser in this category ([README](https://github.com/getagentseal/codeburn)) |
| **tokscale** ([repo](https://github.com/junhoyeo/tokscale), [meta](https://ungh.cc/repos/junhoyeo/tokscale)) | Multi-agent token tracker with TUI views, a web "3D Contributions Graph", "Wrapped 2025", and a global leaderboard via `tokscale submit` | `bunx tokscale@latest` · `npx tokscale@latest` | cross-platform (Rust native binaries via npm) | 5,673 · 2026-10-14 · v4.18.0 (2026-10-05) · MIT · Rust | ~49,514 npm downloads/week ([npm API](https://api.npmjs.org/downloads/point/last-week/tokscale)); `submit --dry-run` previews what is uploaded ([README](https://github.com/junhoyeo/tokscale)) |
| **Splitrail** ([repo](https://github.com/Piebald-AI/splitrail), [meta](https://ungh.cc/repos/Piebald-AI/splitrail)) | Real-time multi-agent token/cost tracker. `splitrail web` serves a local dashboard on `127.0.0.1:8765`. VS Code extension. Optional "Splitrail Cloud" | build with Cargo / see README | cross-platform (Windows build notes) | 223 · 2026-10-14 · MIT · Rust | Upload is opt-in (`auto_upload = false` in config) ([README](https://github.com/Piebald-AI/splitrail)) |
| **Claude Code Templates `--analytics`** ([repo](https://github.com/davila7/claude-code-templates), [meta](https://ungh.cc/repos/davila7/claude-code-templates)) | `--analytics` real-time session monitoring dashboard; `--chats` mobile-optimized live conversation monitor (`--tunnel` via Cloudflare Tunnel); `--health-check`; `--plugins` dashboard | `npx claude-code-templates@latest --analytics` | Node anywhere | 32,641 · 2026-10-14 · v1.29.7 (2026-10-09), npm 1.30.0 (2026-10-10) · MIT | Mainly a component catalog (aitmpl.com); the dashboards are side features ([README](https://github.com/davila7/claude-code-templates)) |
| **Sniffly** ([repo](https://github.com/chiphuyen/sniffly), [meta](https://ungh.cc/repos/chiphuyen/sniffly)) | Local analytics dashboard: usage stats, error-type analysis, command walkthrough, opt-in shareable dashboards | `uvx sniffly@latest init` → `http://localhost:8081` | anywhere with uv/pip | 1,275 · **2025-08-08** · MIT · Python | Stale (no push in ~14 months); Show HN 41 pts (2025-08-31) ([HN](https://news.ycombinator.com/item?id=45081711)) |
| **better-ccflare** ([repo](https://github.com/tombii/better-ccflare), [meta](https://ungh.cc/repos/tombii/better-ccflare)) / **ccflare** ([repo](https://github.com/snipeship/ccflare)) | API proxy with "intelligent load balancing across multiple accounts" and a request-level analytics web dashboard (latency, tokens, cost) | `npm install -g better-ccflare` / `npx better-ccflare`; ccflare: `bun install` and serve on `:8080` | Linux x64 npm; Windows path caveat | better-ccflare 272 · 2026-10-09 · v3.5.93 · MIT; ccflare 1,051 · 2026-04-19 · MIT | Routing Claude subscription OAuth across accounts conflicts with Anthropic's credential policy (see section 7) |
| **Claumon** ([repo](https://github.com/fabioconcina/claumon)) | Pro/Max dashboard: "live rate-limit gauges, calibrated usage forecasts" (Gamma-process model), session costs, `~/.claude` disk footprint | `brew install fabioconcina/claumon/claumon` | macOS/Linux/Windows single binary | 16 · 2026-10-12 · MIT · Go | Tiny project; Show HN 7 pts (2026-06-11) ([HN](https://news.ycombinator.com/item?id=48488753)) |
| **vibe-log-cli** ([repo](https://github.com/vibe-log/vibe-log-cli)) | Local productivity reports, standups, and a status-line "coach" for Claude Code and Codex | `npx vibe-log-cli@latest` | Node | 339 · 2026-04-19 · v0.8.14 · MIT | Quiet since April 2026; 29 npm downloads/week ([npm API](https://api.npmjs.org/downloads/point/last-week/vibe-log-cli)) |

Additional sourced points:
- Accuracy from the official side:
  - The `/usage` session dollar figure is a local list-price estimate meant for API users, and subscribers should read plan bars instead.
  - Plan attribution covers only "local session history on this machine".
  - Sources: [Manage costs](https://code.claude.com/docs/en/costs).
- Organizations can make `/cost`, the status line and telemetry use contracted rates via the managed `modelPricing` setting (2.1.243). Estimates include the 1.1× data-residency premium (2.1.239) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Transcript JSONL "is internal to Claude Code and changes between versions, so scripts that parse these files directly can break on any release" — [Manage sessions](https://code.claude.com/docs/en/sessions). This applies to ccusage, Sniffly, Splitrail, tokscale, Codeburn and other log readers.
- Blog roundups (vendor-written or self-promotional, so treat as editorial) say ccusage is local-only and can't see other machines or claude.ai, and that tracker figures are local-log estimates — [Torii roundup](https://www.toriihq.com/articles/five-claude-code-usage-dashboards-and-monitoring-tools), [bestagent.dev](https://bestagent.dev/best-claude-code-tools), [claudefa.st](https://claudefa.st/blog/tools/monitors/claude-code-usage-monitor).
- The curated awesome-claude-code list (55,673 stars) has a "Usage & Cost" section. It lists AgentWatch, better-ccflare, CCDash, ccusage, ccxray, ClaudeBar, Claumon, Codeburn, context-tax, goccc, Pacer, toktrack and several status lines — [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code).

### Inferences
- Best default stack for a terminal ricer:
  - `npx ccusage@latest daily --breakdown` (or `--compact` for screenshots) for history.
  - `claude-monitor` in a tmux pane for live forecasting; its `--write-state` JSON can feed tmux, sketchybar or waybar.
  - CodexBar for an always-visible bar widget, including Omarchy/Hyprland on Linux.
  - Built-in `/usage` for authoritative plan percentages.
- Tools that switched to official data sources (Claude-Code-Usage-Monitor v4 reads `rate_limits`; CCSeva reads the OAuth usage endpoint) should give more accurate subscriber numbers than pure JSONL-estimate tools, because only server data includes other devices and claude.ai.
- ccusage's removal of `--live` means "ccusage live dashboard" advice from 2025 is outdated.

### Gaps
- No independent accuracy benchmark comparing ccusage, the Monitor, Codeburn and the official `/usage` was found.
- Codeburn's latest release tag and primary language were not retrieved. Splitrail's and ccflare's release cadence is unknown. GitHub could not identify ccusage's license (the LICENSE file is a symlink), so the MIT value comes from npm.
- Claude-Code-Usage-Monitor's plan token limits are the project's own numbers; Anthropic does not publish token limits in that form (not verified against official sources).

## 3. Observability: OpenTelemetry, dashboards, hook-based event loggers and API proxies

### Takeaway
Claude Code's official OpenTelemetry export is the robust path:
- Metrics: sessions, LOC, PRs, commits, cost, tokens, edit decisions and active time.
- Rich events: prompts, API requests and errors, tool results and decisions, hooks, compaction, subagents and more.
- Beta distributed tracing.

Privacy-sensitive content is off by default. For dashboards:
- Grafana Cloud has had an official Claude Code integration since March 2026, and community dashboards 25255 (Prometheus) and 25052 exist.
- The once-popular ColeMurray/claude-code-otel stack and Anthropic's own ROI guide repo are stale (last pushed mid-2025).

For live per-agent visibility, hook-based dashboards are the go-to: disler's multi-agent observability, agents-observe (installable as a Claude Code plugin), Claude-Code-Agent-Monitor and cctop. API proxies (claude-trace, claude-code-proxy, ccxray, OrcaReplay) show raw traffic but carry the highest privacy risk.

### Cited Findings

#### Official OpenTelemetry support
- Quick start: `CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_METRICS_EXPORTER=otlp|prometheus|console|none`, `OTEL_LOGS_EXPORTER=otlp|console|none`, `OTEL_EXPORTER_OTLP_PROTOCOL=grpc`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`, optional headers. Debug intervals: `OTEL_METRIC_EXPORT_INTERVAL=10000`, `OTEL_LOGS_EXPORT_INTERVAL=5000` — [Monitoring](https://code.claude.com/docs/en/monitoring-usage).
- Metrics: `claude_code.session.count`, `lines_of_code.count`, `pull_request.count`, `commit.count`, `cost.usage` (USD), `token.usage`, `code_edit_tool.decision`, `active_time.total` — [Monitoring](https://code.claude.com/docs/en/monitoring-usage).
- Events include user prompt, assistant response, tool result, API request/error/refusal, API request/response body, tool decision, permission-mode change, auth, MCP server connection, plugin installed/loaded, skill activated, at-mention, hook registered/start/complete, compaction, subagent completed, feedback survey, and retention sweep — [Monitoring](https://code.claude.com/docs/en/monitoring-usage).
- Traces (beta) need `CLAUDE_CODE_ENABLE_TELEMETRY=1` + `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1` + `OTEL_TRACES_EXPORTER`. Spans redact prompts, tool inputs and tool content unless `OTEL_LOG_USER_PROMPTS=1`, `OTEL_LOG_TOOL_DETAILS=1`, `OTEL_LOG_TOOL_CONTENT=1`. Bash subprocesses inherit `TRACEPARENT` — [Monitoring](https://code.claude.com/docs/en/monitoring-usage).
- `OTEL_LOG_RAW_API_BODIES=1` (added 2.1.111, 2026-04-16) emits full request/response bodies. `=file:<dir>` writes untruncated bodies to disk, with an `index.jsonl` from v2.1.274 — [Monitoring](https://code.claude.com/docs/en/monitoring-usage); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Since 2.1.282 (2026-09-24), project and local settings can't turn OTel export on, set its endpoint, or capture content. Only shell, user or managed settings can. Claude Code also doesn't pass `OTEL_*` vars to subprocesses — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [Monitoring](https://code.claude.com/docs/en/monitoring-usage).
- `service.name` is `claude-code` for the terminal and `claude-code-desktop` for Desktop Code-tab sessions. "If your collector pipelines or dashboards filter on `service.name = claude-code`, add `claude-code-desktop`" — [Monitoring](https://code.claude.com/docs/en/monitoring-usage).
- The docs point to the "Claude Code ROI Measurement Guide" ([anthropics/claude-code-monitoring-guide](https://github.com/anthropics/claude-code-monitoring-guide)), which has Docker Compose, Prometheus and OTel collector configs and Linear-based report templates. It has 375 stars, was created and last pushed 2025-07-29, and has no license file ([meta](https://ungh.cc/repos/anthropics/claude-code-monitoring-guide)) — [Monitoring](https://code.claude.com/docs/en/monitoring-usage).

#### Dashboards and backends
- **Grafana Cloud integration** v1.0.0 "March 2026: Initial release of Claude Code integration". It installs four dashboards: "Claude Code", "Claude Code stats", "Claude Code usage breakdown" and "Claude Code productivity". It uses OTLP over `http/protobuf` and needs `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=cumulative` — [Grafana Cloud docs](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-claude-code/).
- **Grafana dashboard 25255 "Claude Code Metrics (Prometheus)"** by @rockdarko is a Prometheus port of dashboard 25052 (Azure App Insights). Panels: Overview KPIs, Leaderboards (top users by cost), Cost & Tokens, Activity & Productivity, Cost Breakdown (by effort, cache-hit ratio). Grafana 11+; source [rockdarko/claude-code-metrics-prometheus](https://github.com/rockdarko/claude-code-metrics-prometheus) — [grafana.com 25255](https://grafana.com/grafana/dashboards/25255-claude-code-metrics-prometheus/); [grafana.com 25052](https://grafana.com/grafana/dashboards/25052/).
- **ColeMurray/claude-code-otel** ([repo](https://github.com/ColeMurray/claude-code-otel), [meta](https://ungh.cc/repos/ColeMurray/claude-code-otel)): Collector → Prometheus + Loki → Grafana. `make up`; Grafana at `localhost:3000` (admin/admin). Screenshots: [cost dashboard](https://raw.githubusercontent.com/ColeMurray/claude-code-otel/main/docs/images/cost-usage-analytics.png). 512 stars, MIT, **last push 2025-06-17**, so it predates traces and most of the 2026 events.
- Vendor comparison (Dash0, published 2026-08-19, vendor-authored) lists eight options:
  - Anthropic analytics/Admin APIs.
  - Dash0 AI Coding Insights ($10/dev/month).
  - Prometheus + Grafana.
  - CloudWatch Coding Agent Insights.
  - Datadog Agent Console (preview).
  - Grafana Cloud.
  - Honeycomb ("prebuilt Claude Code boards… session investigation").
  - SigNoz (self-hosted or cloud).

  Its advice: "Start with Anthropic's native analytics… Add an observability backend once you need to explain what happened in a specific session" — [Dash0 comparison](https://www.dash0.com/comparisons/claude-code-monitoring-tools).
- HN shows modest interest in OTel write-ups: "Monitoring Claude Code with OTel / Datadog" (2025-05-21), "Instrumenting Claude Code: OTel Logging for Detection Engineers" (2026-03-17), and "Aimeterly – Per-user cost dashboards from Claude Code's built-in OTel" (2026-08-04) — [HN](https://news.ycombinator.com/item?id=44055898), [HN](https://news.ycombinator.com/item?id=47414043), [HN](https://news.ycombinator.com/item?id=49168457).

#### Hook-based event loggers and live multi-agent dashboards
- **disler/claude-code-hooks-multi-agent-observability** ([repo](https://github.com/disler/claude-code-hooks-multi-agent-observability), [meta](https://ungh.cc/repos/disler/claude-code-hooks-multi-agent-observability)):
  - Architecture: "Claude Agents → Hook Scripts → HTTP POST → Bun Server → SQLite → WebSocket → Vue Client". It covers all 12 hook events.
  - Setup: copy the `.claude/hooks` scripts and settings, which need `uv`, `bun` and `just`. `just start` serves `http://localhost:5173`.
  - Media: [dashboard](https://raw.githubusercontent.com/disler/claude-code-hooks-multi-agent-observability/main/images/app.png), [data-flow GIF](https://raw.githubusercontent.com/disler/claude-code-hooks-multi-agent-observability/main/images/AgentDataFlowV2.gif), and a YouTube deep dive linked from the README.
  - 1,548 stars; last push 2026-02-08; no license file.
- **agents-observe** ([repo](https://github.com/simple10/agents-observe), [meta](https://ungh.cc/repos/simple10/agents-observe)): "Real-time observability of claude code sessions & multi-agents" with filtering, search, "full replay and token usage stats". **Installs as a Claude Code plugin**: `claude plugin marketplace add simple10/agents-observe` then `claude plugin install agents-observe`. Media: [dashboard GIF](https://raw.githubusercontent.com/simple10/agents-observe/videos/docs/assets/dashboard.gif), [demo video](https://raw.githubusercontent.com/simple10/agents-observe/videos/docs/assets/demo.mp4). 696 stars, MIT, created 2026-03-26, last push 2026-09-04.
- **Claude-Code-Agent-Monitor** ([repo](https://github.com/hoangsonww/Claude-Code-Agent-Monitor), [meta](https://ungh.cc/repos/hoangsonww/Claude-Code-Agent-Monitor)): a self-hosted real-time dashboard via native hooks (SQLite/Node/Express/React). 1,074 stars, MIT, last push 2026-10-11 — [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code).
- **cctop** ([repo](https://github.com/stefanprodan/cctop), [meta](https://ungh.cc/repos/stefanprodan/cctop)):
  - A top-style TUI showing every running session's PID, memory, CPU, busy/idle state, context size, model, branch and last prompt, plus a sub-agent and process tree.
  - Opt-in OSC 9 notifications ("iTerm2, Ghostty, kitty, WezTerm, Windows Terminal"); "Works with tmux `monitor-bell`".
  - Install: `curl -fsSL https://raw.githubusercontent.com/stefanprodan/cctop/main/install.sh | sh` or `brew install stefanprodan/tap/cctop`.
  - 144 stars, Apache-2.0, last push 2026-10-01. [Screenshot](https://raw.githubusercontent.com/stefanprodan/cctop/main/docs/screens/cctop-tui.png).
- **claude-esp** ([repo](https://github.com/phiat/claude-esp), [meta](https://ungh.cc/repos/phiat/claude-esp)): streams "hidden output (thinking, tool calls, subagents) to a separate terminal in real-time" by watching JSONL with fsnotify. `go install github.com/phiat/claude-esp@latest`, or Linux/macOS/Windows binaries. 155 stars, MIT. [Screenshot](https://raw.githubusercontent.com/phiat/claude-esp/main/docs/screenshot.png).
- **c9watch** ([repo](https://github.com/minchenlee/c9watch), [meta](https://ungh.cc/repos/minchenlee/c9watch)): a macOS menu-bar app plus JSON CLI that finds every Claude Code, Codex, Cursor and Pi session by scanning OS processes. 129 stars, MIT.

#### API-traffic proxies and recorders
- **claude-trace** ([README](https://github.com/badlogic/lemmy/tree/main/apps/claude-trace)):
  - Records "system prompts, tool outputs, and raw API data" to `.claude-trace/*.jsonl` plus a self-contained HTML viewer.
  - `npm install -g @mariozechner/claude-trace`. It also has `--extract-token` to "Extract OAuth token".
  - The npm package was last published 2025-08-13 (1.0.9), with 1,158 downloads/week ([npm](https://registry.npmjs.org/@mariozechner/claude-trace), [npm API](https://api.npmjs.org/downloads/point/last-week/@mariozechner/claude-trace)).
  - Simon Willison wrote it up on 2025-06-02 ([simonwillison.net](https://simonwillison.net/2025/Jun/2/claude-trace/)).
- **claude-code-proxy** ([repo](https://github.com/seifghazi/claude-code-proxy), [meta](https://ungh.cc/repos/seifghazi/claude-code-proxy)): "captures and visualizes in-flight Claude Code requests". Set `ANTHROPIC_BASE_URL=http://localhost:3001`; dashboard at `:5173`; `make install && make dev` or Docker. [Demo GIF](https://raw.githubusercontent.com/seifghazi/claude-code-proxy/main/demo.gif). 510 stars, MIT, last push 2026-01-04.
- **ccxray** ([repo](https://github.com/lis186/ccxray)): "A transparent HTTP proxy and real-time dashboard that sits between Claude Code and the Anthropic API" — [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code). About 295 stars (shields), last commit 2026-10-14 ([shields](https://img.shields.io/github/stars/lis186/ccxray.json)).
- **OrcaReplay** ([repo](https://github.com/Continuum-AI-Corp/OrcaReplay), [meta](https://ungh.cc/repos/Continuum-AI-Corp/OrcaReplay)): "Time travel for AI agents. Record, replay, fork, and debug any agent run". `npm i -g orcareplay`, then `orca replay last` ("no network, no tokens, no charge") and `--from 4 --model … --ui` to fork. [Demo GIF](https://raw.githubusercontent.com/Continuum-AI-Corp/OrcaReplay/main/docs/demo-cli.gif). 284 stars, Apache-2.0, created 2026-08-29.

### Inferences
- For a personal "flex" Grafana setup, the low-effort path is the Grafana Cloud free tier with the official integration (four prebuilt dashboards). Self-hosters should start from dashboard 25255 rather than the stale 2025 docker stacks, whose panels may miss newer attributes such as `effort`, `speed` and `query source`.
- Hook-based dashboards are the best match for "watch my agents work live". They need no proxy or credential interception, and they survive JSONL format changes better because hooks are a documented interface.
- claude-trace was last published to npm on 2025-08-13 and launches Claude Code itself to record its traffic. Whether it still works with 2026 Claude Code builds, including native-binary installs, is unverified. Its README doesn't mention native builds, and the tool hasn't been updated in 14 months, so treat it as legacy.

### Gaps
- No download or usage numbers were found for Grafana dashboards 25255/25052 (not shown on the pages).
- I did not verify Honeycomb, SigNoz, Datadog or CloudWatch Claude Code boards first-hand; they come from the vendor comparison only.
- claude-trace's compatibility with the 2026 native installer was not verified.

## 4. Transcript/session viewers, exporters and replay tools

### Takeaway
The most capable and actively maintained viewers in Oct 2026:
- **claude-code-log** (Python; HTML/Markdown export, TUI, live `serve --watch` with full-text archive search; v1.7.0 on 2026-10-05).
- **Claude Code History Viewer** (desktop app plus headless server for 31 assistants; v1.32.0 on 2026-10-10).
- **claude-code-viewer** (web/PWA client; made chat-sending opt-in in April 2026 over ToS concerns).
- Simon Willison's **claude-code-transcripts**, for pretty, shareable HTML/Gist output.

Natively, `Ctrl+O` plus `/export` cover reading and exporting. Anthropic's sample `replay-theater` mod adds a `/replay` command.

### Cited Findings

| Tool | What it shows/does | Install | Platforms | Stars · last push · latest release · license · language |
|---|---|---|---|---|
| **claude-code-log** ([repo](https://github.com/daaain/claude-code-log), [meta](https://ungh.cc/repos/daaain/claude-code-log)) | JSONL → HTML/Markdown/JSON. Interactive TUI (`--tui`) with summaries and resume. `watch` mode keeps Markdown or Obsidian current. `serve` gives loopback full-text archive search. Per-message token usage; zoomable interactive timeline. [Example output](https://daaain.github.io/claude-code-log/example/), [feature walkthrough](https://daaain.github.io/claude-code-log/demos/) | `uvx claude-code-log@latest --open-browser` | anywhere with uv | 1,242 · 2026-10-09 · 1.7.0 (2026-10-05) · MIT · Python |
| **Claude Code History Viewer (CCHV)** ([repo](https://github.com/jhlee0409/claude-code-history-viewer), [meta](https://ungh.cc/repos/jhlee0409/claude-code-history-viewer)) | Browse, search and analyze history from 31 assistants. Analytics dashboard and token statistics (screenshots in README) | `brew install --cask jhlee0409/tap/claude-code-history-viewer`; .dmg/.exe/.AppImage; headless `brew install jhlee0409/tap/cchv-server && cchv-server --serve` → `:3727` | macOS, Windows, Linux | 2,254 · 2026-10-14 · v1.32.0 (2026-10-10) · MIT |
| **claude-code-viewer** ([repo](https://github.com/d-kimuson/claude-code-viewer), [meta](https://ungh.cc/repos/d-kimuson/claude-code-viewer)) | Web client focused on "comprehensive session log analysis", with real-time log viewing, git ops, a PWA with push notifications, and remote access via Tailscale and `--password` | `npx @kimuson/claude-code-viewer@latest --port 3400` | macOS and Linux ("Windows is not supported") | 1,296 · 2026-08-18 · v0.8.2 (2026-08-18) · MIT · TS |
| **claude-code-transcripts** ([repo](https://github.com/simonw/claude-code-transcripts), [meta](https://ungh.cc/repos/simonw/claude-code-transcripts)) | Converts sessions to "clean, mobile-friendly HTML pages with pagination". `all` builds an archive; `--gist` publishes via gisthost; `web` imports cloud sessions. [Example](https://static.simonwillison.net/static/2025/claude-code-microjs/index.html) | `uv tool install claude-code-transcripts` / `uvx claude-code-transcripts` | anywhere with uv (keychain auto-auth on macOS) | 1,700 · 2026-02-12 · 0.6 (2026-01-25) · Apache-2.0 · Python |
| **claude-history** ([repo](https://github.com/raine/claude-history), [meta](https://ungh.cc/repos/raine/claude-history)) | Rust TUI: fuzzy, lexical and semantic search across conversations; viewer with vim keys; resume/fork | `curl -fsSL https://raw.githubusercontent.com/raine/claude-history/main/scripts/install.sh \| bash`; Homebrew (macOS/Linux) | macOS/Linux | 509 · 2026-10-10 · v0.1.76 (2026-09-20) · MIT · Rust |
| **claude-conversation-extractor** ([repo](https://github.com/ZeroSumQuant/claude-conversation-extractor), [meta](https://ungh.cc/repos/ZeroSumQuant/claude-conversation-extractor)) | Export to Markdown; search; `claude-start` interactive UI | `pipx install claude-conversation-extractor` | anywhere with Python | 684 · 2026-01-02 · v1.1.2 (2025-09-16) · MIT |
| **ccresume** ([repo](https://github.com/sasazame/ccresume), [meta](https://ungh.cc/repos/sasazame/ccresume)) | TUI to browse and resume conversations ([demo GIF](https://raw.githubusercontent.com/sasazame/ccresume/master/docs/images/demo.gif)) | `npx @sasazame/ccresume@latest` | Node | 174 · 2026-08-01 · v2.0.0 (2026-05-08) · MIT |
| **cchistory** ([repo](https://github.com/eckardt/cchistory), [meta](https://ungh.cc/repos/eckardt/cchistory)) | "Like the shell history command but for your Claude Code sessions" (the commands Claude ran) | `npm install -g cchistory` / `npx cchistory` | Node | 138 · 2026-06-10 · v0.3.0 · MIT |
| **bough** ([repo](https://github.com/nickelsec/bough), [meta](https://ungh.cc/repos/nickelsec/bough)) | Draws a day's work (tasks and prompts) as a styled diagram and prices it ([demo GIF](https://raw.githubusercontent.com/nickelsec/bough/main/docs/img/demo.gif)) | `brew install nickelsec/tap/bough`; `curl -fsSL https://www.bough.run/install.sh \| sh`; Windows `irm https://www.bough.run/install.ps1 \| iex` | macOS/Linux/Windows | 122 · 2026-10-02 · MIT (created 2026-09-02) |
| **CC Harness** ([repo](https://github.com/lookfree/cc-harness), [meta](https://ungh.cc/repos/lookfree/cc-harness)) | Desktop workbench: "Live subagent call tree… per-node latency, token cost", token-cost drill-down, hook sandbox, dependency graph ([topology GIF](https://raw.githubusercontent.com/lookfree/cc-harness/main/images/agent-topology.gif)) | Releases (unsigned; macOS `xattr -cr`, Windows SmartScreen) | macOS/Windows/Linux | 49 · 2026-08-06 · MIT |

Additional sourced points:
- Official: `/export` gives "a rendered transcript for a person to read". For scripts, use JSON results, `transcript_path` in hooks or status-line input, or a `SessionEnd` hook to archive transcripts. Transcripts live at `~/.claude/projects/<project>/<session-id>.jsonl` — [Manage sessions](https://code.claude.com/docs/en/sessions).
- Anthropic sample mods in [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods) include `replay-theater` ("adds a `/replay` command that steps through the file edits Claude made in the last turn") and `token-weather` ("draws a forecast of your context window above the prompt"). They are "shared as they are, without support" — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).
- claude-code-viewer's ToS notice: "As of April 2026, Anthropic's Terms of Service prohibit using the Agent SDK to send chat messages with a subscription account… chat sending, session resuming, permission approval, and `AskUserQuestion` have been made opt-in". Read-only viewing "remain[s] fully available" — [claude-code-viewer README](https://github.com/d-kimuson/claude-code-viewer).
- HN shows small but steady interest: "Claude Code History Viewer for macOS" (2025-07-03, 8 pts), "Claude Code Compaction Viewer" (swyx, 2026-03-06), "Claude-code-replay – get lost project code back from Claude Code logs" (2026-05-29) — [HN](https://news.ycombinator.com/item?id=44459376), [HN](https://news.ycombinator.com/item?id=47271295), [HN](https://news.ycombinator.com/item?id=48322770).

### Inferences
- For a riced terminal, claude-code-log `--tui`, claude-history and ccresume stay in the terminal. `claude-code-log serve --watch` gives a browser companion pane that updates live.
- For sharing a session, claude-code-transcripts `--gist` produces the most polished public artifact. Sanitize first (section 7).

### Gaps
- No user-count data exists beyond stars and npm downloads (e.g. claude-code-viewer 884 npm downloads/week — [npm API](https://api.npmjs.org/downloads/point/last-week/@kimuson/claude-code-viewer)).
- Whether claude-code-log and CCHV correctly handle the newest 2.1.29x JSONL record types was not tested.

## 5. Multi-session managers and GUIs (official and third-party)

### Takeaway
The landscape consolidated in 2026:
- **Official options**: agent view (`claude agents`, research preview since 2026-05-11), the Claude Desktop Code tab (macOS/Windows/Linux beta) with parallel worktree sessions, cloud sessions on claude.ai/code and mobile, and Remote Control. These now cover the core "many sessions, one screen" need.
- **Third-party winners**: claude-squad (tmux-native, 8.6k stars) and ccmanager (no tmux, the most actively released) for terminal purists; cmux (~28k stars) and Superset (~15k, YC P26) as agent-centric terminal/IDE apps on macOS; Emdash (6k, YC W26) for cross-platform; Happy (24k) for E2E-encrypted mobile.
- **Wound down or sunsetting**: Vibe Kanban (bloop shut down, now community-maintained), Crystal (became Nimbalyst), sugyan/claude-code-webui (archived), and opcode (no binaries since Aug 2025).

### Cited Findings

#### Official
- **Agent view** (`claude agents`):
  - Dispatch a background session per prompt and see rows grouped "Needs input / Working / Completed".
  - Peek (`Space`) and reply inline, attach (`Enter`/`→`) and detach (`←`).
  - PR status per row; `/bg`, `claude --bg "<task>"`, `claude attach|logs|stop|respawn|rm`; a supervisor daemon (`claude daemon status|logs`). State lives under `~/.claude/jobs/<id>/`, which is "not a stable interface".
  - Screenshot: [agent view (dark)](https://mintcdn.com/claude-code/HDAmBwgbrZVk0pOt/images/agent-view-dark.png?fit=max&auto=format&n=HDAmBwgbrZVk0pOt&q=85&s=fc3c195bfc57e313ced1f1beb36cee93).
  - Sources: [Agent view docs](https://code.claude.com/docs/en/agent-view).
  - The announcement (2026-05-11) says it replaces juggling "multiple terminal tabs, a tmux grid, and an overloaded mental ledger". It is available on Pro, Max, Team, Enterprise and API plans — [Claude blog](https://claude.com/blog/agent-view-in-claude-code).
  - Recent: `/effort` and `/fast` in agent view (2.1.299); a Windows input fix (2.1.132) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- **Claude Desktop Code tab**: "parallel sessions with Git isolation, drag-and-drop pane layout, integrated terminal and file editor, side chats, computer use, Dispatch sessions from your phone, visual diff review, app previews, PR monitoring". Downloads for macOS (universal), Windows x64/ARM64 and Linux beta (apt) — [Desktop docs](https://code.claude.com/docs/en/desktop). `claude --desktop` and `/desktop` hand a session off (macOS or x64 Windows) — local `claude --help`; [Commands reference](https://code.claude.com/docs/en/commands). Mods draw in the Code tab from v2.1.286, but not in WSL sessions — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).
- **Remote Control** (`claude --remote-control`, `/remote-control` or `/rc`) puts your local session in claude.ai/code or the iOS/Android Claude app. "Claude keeps running locally the entire time" — [Remote Control docs](https://code.claude.com/docs/en/remote-control). **Cloud sessions** run in Anthropic VMs; use `--cloud` and `--teleport` — [Cloud docs](https://code.claude.com/docs/en/claude-code-on-the-web).
- `claude -w/--worktree [name] --tmux` creates a worktree plus a tmux session, using "iTerm2 native panes when available" — local `claude --help`.

#### Third-party (terminal-first)

| Tool | What it looks like / does | Install | Platforms | Stars · last push · latest release · license · language | Maturity / community |
|---|---|---|---|---|---|
| **claude-squad** ([repo](https://github.com/smtg-ai/claude-squad), [meta](https://ungh.cc/repos/smtg-ai/claude-squad)) | TUI over tmux sessions plus git worktrees, one per agent (Claude Code, Codex, OpenCode, Amp). [Screenshot](https://raw.githubusercontent.com/smtg-ai/claude-squad/main/assets/screenshot.png) | `brew install claude-squad && ln -s "$(brew --prefix)/bin/claude-squad" "$(brew --prefix)/bin/cs"` or `curl -fsSL https://raw.githubusercontent.com/smtg-ai/claude-squad/main/install.sh \| bash`; needs `tmux`, `gh` | tmux platforms (macOS/Linux; Windows via WSL inferred) | 8,601 · 2026-08-20 · v1.0.20 (2026-08-20) · AGPL-3.0 · Go | Mature; the "classic". HN posts were small (5 pts, 2025-04-03) ([HN](https://news.ycombinator.com/item?id=43575127)) |
| **CCManager** ([repo](https://github.com/kbwo/ccmanager), [meta](https://ungh.cc/repos/kbwo/ccmanager)) | Self-contained TUI (no tmux) for 8 agent CLIs: busy/waiting/idle indicators, worktree create/merge/delete, copy session data between worktrees, status-change hooks, devcontainers. "If you love tmux-based workflows, stick with Claude Squad!" | `npm install -g ccmanager` / `npx ccmanager`; optional `claude plugin install ccmanager-config@ccmanager` | Node | 1,262 · 2026-10-12 · v4.4.6 (2026-10-10) · MIT · TS | Very active releases, yet only 373 npm downloads/week ([npm API](https://api.npmjs.org/downloads/point/last-week/ccmanager)) |
| **agent-deck** ([repo](https://github.com/asheshgoplani/agent-deck), [meta](https://ungh.cc/repos/asheshgoplani/agent-deck)) | "Mission control" TUI for Claude, Gemini, OpenCode, Codex; `$` opens a Cost Dashboard; ships a Claude plugin (`/plugin install agent-deck@agent-deck`) | `curl -fsSL https://raw.githubusercontent.com/asheshgoplani/agent-deck/main/install.sh \| bash` · `brew install asheshgoplani/tap/agent-deck` · `go install github.com/asheshgoplani/agent-deck/cmd/agent-deck@latest` | macOS, Linux, Windows (WSL) | 1,081 · 2026-10-14 · MIT · Go | Active; Show HN Dec 2025 ([HN](https://news.ycombinator.com/item?id=46276905)) |
| **uzi** ([repo](https://github.com/devflowinc/uzi)) | CLI for many parallel agents with worktrees | see README | — | 582 · **2025-06-04** · v0.0.2 · MIT · Go | Abandoned-looking |

#### Third-party (desktop / web / mobile)

| Tool | What it looks like / does | Install | Platforms | Stars · last push · release · license | Maturity / community |
|---|---|---|---|---|---|
| **cmux** ([repo](https://github.com/manaflow-ai/cmux)) | "A Ghostty-based macOS terminal with vertical tabs and notifications for AI coding agents". The sidebar shows git branch, linked PR, ports and latest notification; panes get "a blue ring" when an agent needs you; built-in browser; SSH. [Screenshot](https://raw.githubusercontent.com/manaflow-ai/cmux/main/docs/assets/main-first-image.png), [YouTube demo](https://www.youtube.com/watch?v=i-WxO5YUTOs) | `.dmg` from Releases | macOS | ~28k ([shields](https://img.shields.io/github/stars/manaflow-ai/cmux.json)) · last commit 2026-10-14 · v0.65.1 · license not identified by GitHub | Show HN 198 pts / 77 comments (2026-02-19) ([HN](https://news.ycombinator.com/item?id=47079718)) |
| **Superset** ([repo](https://github.com/superset-sh/superset)) | "IDE for the agents era": parallel workspaces with live diffs, agent monitoring sidebar, diff viewer, in-app browser. [Hero GIF](https://raw.githubusercontent.com/superset-sh/superset/main/apps/marketing/public/images/readme-hero.gif) | .dmg (Apple Silicon/Intel) | macOS primary; Linux AppImage experimental; "Windows: not yet available" | ~15k ([shields](https://img.shields.io/github/stars/superset-sh/superset.json)) · last commit 2026-10-14 · desktop-v1.37.0 | Launch HN (YC P26) 108 pts / 135 comments (2026-05-22) ([HN](https://news.ycombinator.com/item?id=48236770)); Show HN 96 pts (2025-12-23) ([HN](https://news.ycombinator.com/item?id=46368739)) |
| **Emdash** ([repo](https://github.com/generalaction/emdash), [meta](https://ungh.cc/repos/generalaction/emdash)) | "Open-Source Agentic Development Environment (YC W26). Run multiple coding agents in parallel". Installs marker-tagged hooks into agent configs for status/notifications | `brew install --cask emdash`; MSI; AppImage/DEB | macOS, Windows, Linux x64/ARM64 | 5,983 · 2026-10-14 · v1.2.8 (2026-10-10) · Apache-2.0 · TS | Active, cross-platform |
| **Conductor** ([site](https://www.conductor.build/)) | "Run parallel coding agents on your Mac": Claude Code, Codex and Cursor agents "in isolated workspaces"; "See at a glance what they're working on", then review/merge | Download from site | macOS only | closed source; latest 0.90.0 | Pricing: Free $0 (local workspaces), Pro $50/mo (cloud workspaces, multiplayer, API, mobile app), Teams $60/user/mo; "Bring your own subscriptions and keys" ([pricing](https://www.conductor.build/pricing)) |
| **Nimbalyst** (ex-Crystal) ([repo](https://github.com/nimbalyst/nimbalyst), [meta](https://ungh.cc/repos/nimbalyst/nimbalyst)) | "Open-source visual workspace for Claude Code, Codex, and OpenCode", parallel agents with worktree isolation | [nimbalyst.com/download](https://nimbalyst.com/download/) | desktop (OS list not verified) | 1,898 · 2026-10-14 · MIT · TS | Crystal "deprecated and replaced by Nimbalyst… February 2026" ([Crystal README](https://github.com/stravu/crystal)); Crystal repo 3,129 stars, last release v0.3.5 (2026-02-26) ([meta](https://ungh.cc/repos/stravu/crystal)) |
| **Vibe Kanban** ([repo](https://github.com/BloopAI/vibe-kanban), [meta](https://ungh.cc/repos/BloopAI/vibe-kanban)) | Kanban issues → per-task agent workspaces. [Board screenshot](https://raw.githubusercontent.com/BloopAI/vibe-kanban/main/packages/public/vibe-kanban-screenshot-overview.png) | `npx vibe-kanban` | Node | 28,365 · 2026-09-19 · npm 0.1.44 (2026-04-24, latest) · Apache-2.0 · Rust/TS | **Sunsetting**: announced 2026-04-10. bloop is shutting down; "The Vibe Kanban project will live on, open source and community maintained"; cloud features ended after 30 days; "local workspaces will continue to function" ([shutdown post](https://www.vibekanban.com/blog/shutdown)). Show HN 195 pts (2025-07-11) ([HN](https://news.ycombinator.com/item?id=44533004)) |
| **opcode** (ex-Claudia) ([repo](https://github.com/winfunc/opcode), [meta](https://ungh.cc/repos/winfunc/opcode)) | Tauri GUI: custom agents, interactive sessions, background agents, "Usage Analytics Dashboard" (cost/tokens by model/project), "Timeline & Checkpoints" | Build from source ("Release Executables Will Be Published Soon") | Windows 10/11, macOS 11+, Linux | 22,414 · 2026-09-18 · v0.2.0 (2025-08-31) · AGPL-3.0 · TS | Very popular at launch: "Claudia – Desktop companion for Claude code" 501 pts / 226 comments (2025-08-17) ([HN](https://news.ycombinator.com/item?id=44933255)). Now low-velocity; `getAsterisk/claudia` redirects here ([meta](https://ungh.cc/repos/getAsterisk/claudia)) |
| **CloudCLI / Claude Code UI** ([repo](https://github.com/siteboon/claudecodeui), [meta](https://ungh.cc/repos/siteboon/claudecodeui)) | Desktop and mobile web UI/PWA for Claude Code, Cursor CLI and Codex: file explorer, git, plugins, experimental Docker sandboxes. [Screenshot](https://raw.githubusercontent.com/siteboon/claudecodeui/main/public/screenshots/desktop-main.png) | `npx @cloudcli-ai/cloudcli` → `http://localhost:3001` (Node 22+) | any (browser) | 14,087 · 2026-10-12 · npm 1.37.4 (2026-10-09) · AGPL-3.0 | Active; also a hosted "CloudCLI Cloud" upsell |
| **Happy** ([repo](https://github.com/slopus/happy), [meta](https://ungh.cc/repos/slopus/happy)) | "End-to-end encrypted mobile app" (iOS/Android/web) plus CLI wrapping Claude Code/Codex; desktop app; "Reuse your subscriptions"; "Natively multiplayer" | `npm install -g happy` then `happy claude` | iOS, Android, web, desktop | 24,143 · 2026-10-14 · cli-1.2.6-beta.1 (2026-10-09) · MIT · TS | 8,297 npm downloads/week ([npm API](https://api.npmjs.org/downloads/point/last-week/happy)); Show HN 30 pts (2025-08-14) ([HN](https://news.ycombinator.com/item?id=44904039)) |
| **Maestro** ([repo](https://github.com/RunMaestro/Maestro), [meta](https://ungh.cc/repos/RunMaestro/Maestro)) | "Agent Orchestration Command Center": session discovery, cost tracking, Usage Dashboard (`Opt+Cmd+U`), mobile remote control via QR, speakable notifications. [Screenshot](https://raw.githubusercontent.com/RunMaestro/Maestro/main/docs/screenshots/main-screen.png), [YouTube](https://youtu.be/3wX5Q1I0sgI) | Releases page | cross-platform desktop | 3,451 · 2026-10-14 · v1.0.0 (2026-10-09) · AGPL-3.0 · TS | Just hit 1.0 |
| **VibeTunnel** ([repo](https://github.com/amantus-ai/vibetunnel), [meta](https://ungh.cc/repos/amantus-ai/vibetunnel)) | "Turn any browser into your terminal & command your agents on the go" | macOS app (Homebrew cask `vibetunnel`); npm `vibetunnel` for Linux | macOS, Linux | 4,689 · 2026-08-05 · v1.0.0-beta.18 (2026-07-11) · MIT | Beta |
| **Sculptor** ([repo](https://github.com/imbue-ai/sculptor), [meta](https://ungh.cc/repos/imbue-ai/sculptor)) | Parallel agents in containers; "experimental research preview" | download links (Linux, Linux ARM64, …) | — | 238 · 2026-10-14 · MIT · Python | Research preview |
| **Omnara** ([repo](https://github.com/omnara-ai/omnara), [meta](https://ungh.cc/repos/omnara-ai/omnara)) | Pivoted to "The open-source managed agent platform. A self-hostable alternative to Claude Managed Agents" | `npx omnara …` / Docker self-host | — | 2,915 · 2026-10-14 · Apache-2.0 · Go | No longer primarily a Claude Code mobile monitor (inference from new README) |
| **claude-code-webui** ([repo](https://github.com/sugyan/claude-code-webui)) | Web chat UI | `npm install -g claude-code-webui` | — | 1,137 · 2026-05-29 · MIT | "No longer actively maintained… archived" (README) |
| **coder/agentapi** ([repo](https://github.com/coder/agentapi), [meta](https://ungh.cc/repos/coder/agentapi)) | "HTTP API for Claude Code, Goose, Aider, Gemini, Amp, and Codex", a building block for custom UIs | binary from Releases | macOS/Linux | 1,496 · 2026-09-13 · v0.12.2 (2026-05-27) · MIT · Go | Infrastructure piece |
| **Vibeyard** ([repo](https://github.com/elirantutia/vibeyard), [meta](https://ungh.cc/repos/elirantutia/vibeyard)) | "IDE built for AI coding agents" with a swarm grid of parallel agents and real-time session view | Releases | cross-platform | 1,389 · 2026-09-03 · MIT | — |

### Inferences
- For a riced terminal: agent view (zero install) plus claude-squad or agent-deck keeps everything inside tmux and your theme. ccmanager suits people who keep tmux separate. cmux replaces the terminal itself: macOS-only, Ghostty-based, so Ghostty themes and fonts carry over. Inferred from the "Ghostty-based" description; theme compatibility not verified. GUI apps (Superset, Emdash, Conductor, Nimbalyst, Maestro) trade terminal aesthetics for diff review and PR flows.
- Agent view's `--json` contract makes it easy to build tmux, sketchybar or waybar widgets that show "N blocked / N working". That is the most "riceable" official surface for multi-session state.
- Before adopting a GUI, check its maintenance signals: several of the most-starred ones are now wound down (Vibe Kanban), deprecated (Crystal), archived (claude-code-webui) or binary-less (opcode). Stars from 2025 hype don't mean current maintenance.

### Gaps
- Licenses for cmux and Superset show "not identifiable by github". Their exact star counts are rounded (shields).
- Nimbalyst's platform list and the Happy desktop app's maturity were not verified.
- Conductor's support for Claude subscriptions specifically is not stated on its pricing page.
- claude-squad's Windows/WSL support is inferred from its tmux requirement, not documented here.

## 6. What the community most recommends, and why

### Takeaway
Reddit was inaccessible, so this rests on GitHub stars, npm downloads, Hacker News, and the 55.7k-star awesome-claude-code curation.
- **Usage**: ccusage dominates installs (~365k/week), and Claude-Code-Usage-Monitor drew the biggest HN thread in its category (245 points). Menu-bar trackers (CodexBar 22.5k, Codeburn 11.4k) are the 2026 growth area.
- **Multi-session tools**: the loudest launches were Claudia/opcode (501 HN points), cmux (198), Vibe Kanban (195) and Superset (YC launch, 108). Many of the 2025 favorites have since declined.
- **Visualizers**: Pixel Agents (9.7k stars, 126.5k marketplace installs) shows that "fun" visualizations get huge adoption.

### Cited Findings
- npm weekly downloads (week ending 2026-10-14):
  - ccusage 364,993 — [npm API](https://api.npmjs.org/downloads/point/last-week/ccusage)
  - tokscale 49,514 — [npm API](https://api.npmjs.org/downloads/point/last-week/tokscale)
  - happy 8,297 — [npm API](https://api.npmjs.org/downloads/point/last-week/happy)
  - claude-code-templates 4,918 — [npm API](https://api.npmjs.org/downloads/point/last-week/claude-code-templates)
  - @cloudcli-ai/cloudcli 3,842 — [npm API](https://api.npmjs.org/downloads/point/last-week/@cloudcli-ai/cloudcli)
  - vibe-kanban 2,216 — [npm API](https://api.npmjs.org/downloads/point/last-week/vibe-kanban)
  - better-ccflare 1,529 — [npm API](https://api.npmjs.org/downloads/point/last-week/better-ccflare)
  - @mariozechner/claude-trace 1,158 — [npm API](https://api.npmjs.org/downloads/point/last-week/@mariozechner/claude-trace)
  - pixel-agents 863 — [npm API](https://api.npmjs.org/downloads/point/last-week/pixel-agents)
  - ccmanager 373 — [npm API](https://api.npmjs.org/downloads/point/last-week/ccmanager)
- Biggest HN threads:
  - "Claudia – Desktop companion for Claude code" 501 pts/226 c (2025-08-17) — [HN](https://news.ycombinator.com/item?id=44933255)
  - "Show HN: Claude Code Usage Monitor" 245 pts/135 c (2025-06-19) — [HN](https://news.ycombinator.com/item?id=44317012)
  - "Show HN: cmux" 198 pts/77 c (2026-02-19) — [HN](https://news.ycombinator.com/item?id=47079718)
  - "Show HN: Vibe Kanban" 195 pts/132 c (2025-07-11) — [HN](https://news.ycombinator.com/item?id=44533004)
  - "Launch HN: Superset (YC P26)" 108 pts/135 c (2026-05-22) — [HN](https://news.ycombinator.com/item?id=48236770)
  - "Ccusage" 75 pts/30 c (2025-07-18) — [HN](https://news.ycombinator.com/item?id=44610925)
  - "Sniffly" 41 pts (2025-08-31) — [HN](https://news.ycombinator.com/item?id=45081711)
  - "Happy Coder" 30 pts (2025-08-14) — [HN](https://news.ycombinator.com/item?id=44904039)
  - Agent view's own HN submissions were small (6 pts and 5 pts, 2026-05-11/12) — [HN](https://news.ycombinator.com/item?id=48100783), [HN](https://news.ycombinator.com/item?id=48104699)
- GitHub stars (2026-10-14):
  - Over 20k: vibe-kanban 28,365; cmux ~28k; happy 24,143; CodexBar 22,488; opcode 22,414.
  - 10k–20k: ccusage 19,002; Superset ~15k; CloudCLI 14,087; Codeburn 11,439.
  - Under 10k: Pixel Agents 9,696; Claude-Code-Usage-Monitor 8,743; claude-squad 8,601; Clawd on Desk 6,443; Emdash 5,983; tokscale 5,673.
  - Sources: per-repo meta links in sections 2–5 and 8.
- Community curation: awesome-claude-code (55,673 stars, updated 2026-10-14 — [meta](https://ungh.cc/repos/hesreallyhim/awesome-claude-code)) groups this space as:
  - "Observability & Monitoring" → "Session Monitors": c9watch, cc-semaphore, cctop, Claude Code Agent Monitor, Claude Status, claude-control, Clawd on Desk, so-agentbar, wattop.
  - "Usage & Cost".
  - "Observability": agents-observe, the ColeMurray OTel stack, claude-esp, Multi-Agent Observability, OrcaReplay.
  - "Alternative Clients": CloudCLI, Happy, Nimbalyst, Vibeyard, etc.
  - "Agent Orchestration": Claude Squad, etc.
  - Source: [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code).
- Blog roundups agree that ccusage is "the usual starting point" and the Monitor is the "live fuel gauge". They are vendor or self-promotional — [Torii](https://www.toriihq.com/articles/five-claude-code-usage-dashboards-and-monitoring-tools), [bestagent.dev](https://bestagent.dev/best-claude-code-tools), [codeongrass](https://codeongrass.com/blog/claude-code-companion-tools-ecosystem-2026/).

### Inferences
- "Why" these win:
  - ccusage needs zero setup (`npx`), touches no credentials, and gives instantly readable tables.
  - The Monitor answers the subscriber's real question ("will I hit my limit before reset?").
  - Menu-bar apps keep that answer always visible.
  - claude-squad and ccmanager respect the terminal workflow.
  - Pixel or pet visualizers make long agent runs glanceable and fun.
- Momentum in late 2026 favors cross-agent tools (ccusage multi-source, tokscale, Codeburn, CodexBar, ccmanager supporting eight CLIs) and official surfaces (agent view, `/usage`). Claude-only GUIs from 2025 are stalling.

### Gaps
- **Reddit sentiment could not be gathered**: reddit.com is blocked for this agent's crawler, so r/ClaudeAI and r/ClaudeCode opinions are missing.
- HN points measure launch buzz, not ongoing satisfaction. No surveys of Claude Code users' tool preferences were found.

## 7. Privacy and security considerations

### Takeaway
Nearly every companion tool reads `~/.claude/projects/*.jsonl`. Those are plaintext transcripts kept 30 days by default, containing prompts, code, tool output and sometimes secrets. Proxies and recorders additionally see auth headers and full API bodies. Anthropic's policy forbids third parties from intermediating subscription OAuth credentials. Safest choices, in order:
1. Built-ins.
2. Official OTel to your own backend, with content flags off.
3. Hook-based local dashboards.
4. Read-only local log readers.
5. Proxies and multi-account routers last.

### Cited Findings
- Transcripts: "Claude Code clients store session transcripts locally in plaintext under `~/.claude/projects/` for 30 days by default… Adjust the period with `cleanupPeriodDays`" — [Data usage](https://code.claude.com/docs/en/data-usage). The JSONL format "is internal to Claude Code and changes between versions" — [Manage sessions](https://code.claude.com/docs/en/sessions).
- `/insights` sends session content through your provider for analysis ("the tokens count against your plan or API usage") and stores reports in `~/.claude/usage-data/` — [Manage costs](https://code.claude.com/docs/en/costs).
- `/heapdump` output "contains your full conversation and credentials" — [Commands reference](https://code.claude.com/docs/en/commands).
- OTel privacy defaults:
  - Export is opt-in.
  - With OAuth, `user.email` is included, sent only to your endpoint.
  - Prompts, assistant text, tool details and tool content are off unless the `OTEL_LOG_*` flags are set.
  - `OTEL_LOG_RAW_API_BODIES` bodies "contain the full conversation history".
  - Repos can't enable export through project settings (2.1.282).
  - Sources: [Monitoring](https://code.claude.com/docs/en/monitoring-usage); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Anthropic operational telemetry (metrics/error reports) can be disabled with `DISABLE_TELEMETRY=1` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`. It is off by default on Bedrock, Vertex and Foundry — [Data usage](https://code.claude.com/docs/en/data-usage). The built-in `cc-plugin-telemetry` mod "Sends the analytics records that Claude Code and its built-in mods log" — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).
- Credential policy:
  - "OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications."
  - "Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users… may not collect, store, or intermediate Claude.ai credentials or session tokens."
  - It "does not… prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription".
  - Source: [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance).
- Tools that touch credentials or tokens:
  - claude-trace has `--extract-token` ("Extract OAuth token") — [claude-trace README](https://github.com/badlogic/lemmy/tree/main/apps/claude-trace).
  - better-ccflare does "load balancing across multiple accounts" with "Claude OAuth" and "OAuth Token Health" — [better-ccflare README](https://github.com/tombii/better-ccflare).
  - claude-code-viewer made sending opt-in because of the ToS — [README](https://github.com/d-kimuson/claude-code-viewer).
- Uploading and sharing paths, all opt-in:
  - `tokscale submit` creates a public leaderboard profile; `--dry-run` previews it — [tokscale README](https://github.com/junhoyeo/tokscale).
  - Splitrail Cloud has `auto_upload = false` by default — [Splitrail README](https://github.com/Piebald-AI/splitrail).
  - Sniffly's "Shared dashboards are opt-in only" — [Sniffly README](https://github.com/chiphuyen/sniffly).
  - CCSeva sync uploads aggregates only — [CCSeva README](https://github.com/Iamshankhadeep/ccseva).
  - claude-code-transcripts `--gist` uploads HTML transcripts to GitHub Gist — [README](https://github.com/simonw/claude-code-transcripts).
  - `claude-code-templates --chats --tunnel` exposes a live conversation monitor through a Cloudflare Tunnel — [README](https://github.com/davila7/claude-code-templates).
  - CCHV's headless server tells you to "keep authentication enabled" — [CCHV README](https://github.com/jhlee0409/claude-code-history-viewer).
  - claude-code-viewer supports `--password` for remote access — [README](https://github.com/d-kimuson/claude-code-viewer).
- CodexBar reads "browser cookies, local files" to reuse provider sessions — [CodexBar README](https://github.com/steipete/CodexBar). Claude Usage Tracker sends a "version-only heartbeat" — [README](https://github.com/hamed-elfayome/Claude-Usage-Tracker).
- Mods and plugins "run with your permissions… can read and write your files, start processes, and make network requests". Inspect one before installing with `claude plugin validate <dir>` — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview). claude-office's changelog lists a security audit remediation ("API key no longer disclosed over HTTP") — [claude-office README](https://github.com/paulrobello/claude-office). That shows local dashboards can carry real web vulnerabilities.

### Inferences
- Proxies via `ANTHROPIC_BASE_URL` (claude-code-proxy, ccxray, ccflare) see every prompt, response and auth header. Run them only on localhost and never share their SQLite stores.
- Before using `--gist`, `--tunnel`, `submit` or any "share" button, grep the transcript for keys and tokens. Transcripts include tool output (e.g. `.env` reads).
- Multi-account OAuth load balancers are the most likely to draw enforcement under the credential policy. Wrappers that just launch the unmodified `claude` binary (claude-squad, ccmanager, agent view itself) fit the explicitly allowed pattern.

### Gaps
- No public security audits were found for the major companion tools (ccusage, claude-squad, CloudCLI, Happy).
- Happy's E2E encryption claims and relay design were not independently verified.

## 8. Wow / flex factor: the most visually impressive dashboards and companion tools

### Takeaway
For maximum "look at my setup" value in Oct 2026:
- **Pixel-art offices**: Pixel Agents (VS Code or browser; 126.5k installs), claude-office (a boss/employee pixel building with a Command Center), and pixtuoid (a pixel office inside the terminal, the best fit for a riced terminal).
- **Desktop pet**: Clawd on Desk, which reacts to your agents.
- **Live multi-agent observability UIs**: disler's dashboard, agents-observe, CC Harness's live topology graph.
- **Leaderboard and 3D flex**: tokscale's 3D contributions graph and public leaderboard.
- **Polished agent terminals or IDEs**: cmux notification rings, Superset.
- **Built-in, zero-install**: `/usage` Stats heatmap with Ctrl+S screenshot, `/insights` HTML report, agent view.

Setup effort ranges from one command to a Docker or Bun stack (noted per item).

### Cited Findings
Ranked roughly by visual impact (my judgment), each with media, why it impresses, and setup effort:

1. **Pixel Agents**: every Claude Code terminal becomes an animated pixel-art character in a tiny office.
   - **Why it impresses**: characters "walk to their desks, sit down, type when they're editing files". Sub-agents and Agent Teams appear as separate characters, and the layout editor supports character, pet and furniture packs.
   - **Media**: [office screenshot](https://raw.githubusercontent.com/pixel-agents-hq/pixel-agents/main/webview-ui/public/office.png).
   - **Setup effort**: low. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents) or Open VSX, or run `npx pixel-agents` for a browser version "useful for tmux, remote, and non-VS Code workflows". Needs VS Code 1.105+ or Node 20+; Windows/Linux/macOS.
   - **Metadata**: 9,696 stars, MIT, created 2026-02-08, last push 2026-10-13 ([meta](https://ungh.cc/repos/pixel-agents-hq/pixel-agents)); "126.5k installs" marketplace badge ([badge data](https://gist.githubusercontent.com/pablodelucca/3cd28398fa4a2c0a636e1d51d41aee39/raw/installs.json)).
   - **Sources**: [README](https://github.com/pixel-agents-hq/pixel-agents).
2. **claude-office (Claude Office Visualizer)**: a real-time pixel-art office.
   - **Why it impresses**: a "boss" (main agent) spawns "employee" subagents. A multi-floor building, a cross-terminal **Command Center** showing which sessions need you, and a kanban whiteboard mode.
   - **Media**: [Command Center](https://raw.githubusercontent.com/paulrobello/claude-office/main/screenshots/sc_command_center.png), [office view](https://raw.githubusercontent.com/paulrobello/claude-office/main/screenshot.png), [YouTube demo](https://youtu.be/AM2UjKYB8Ew).
   - **Setup effort**: medium. Python 3.13+, Node 20+ and uv; `make install-all`, `make dev-tmux`. Linux/macOS/Windows.
   - **Metadata**: 564 stars, MIT, last push 2026-09-14 ([meta](https://ungh.cc/repos/paulrobello/claude-office)).
   - **Sources**: [README](https://github.com/paulrobello/claude-office).
3. **pixtuoid**: "Your AI coding agents, visualized as pixel-art coworkers in a terminal office", rendered inside the terminal.
   - **Why it impresses**: A*-routed walking, day/night skyline and weather, themes, sound, and a `pixtuoid floating` always-on-top window. Hook shim plus JSONL watching. The best match for a riced terminal.
   - **Media**: [demo GIF](https://raw.githubusercontent.com/pixtuoid/pixtuoid/main/docs/images/demo.gif).
   - **Setup effort**: low. `brew install pixtuoid` (Linux/macOS/WSL2) or `npm install -g pixtuoid`; Windows experimental.
   - **Metadata**: 491 stars, MIT, Rust, v0.19.0 (2026-09-21) ([meta](https://ungh.cc/repos/pixtuoid/pixtuoid)).
   - **Sources**: [README](https://github.com/pixtuoid/pixtuoid).
4. **Clawd on Desk**: a pixel desktop pet that reacts to your sessions.
   - **Why it impresses**: "Thinking when you prompt, typing when tools run, grooving or juggling for subagents, reviewing permissions, celebrating when tasks complete, sleeping when you step away".
   - **Media**: [hero GIF](https://raw.githubusercontent.com/rullerzhou-afk/clawd-on-desk/main/assets/hero.gif).
   - **Setup effort**: low (installers). Windows 11, macOS, Ubuntu/Linux.
   - **Metadata**: 6,443 stars, AGPL-3.0, created 2026-03-18 ([meta](https://ungh.cc/repos/rullerzhou-afk/clawd-on-desk)).
   - **Sources**: [README](https://github.com/rullerzhou-afk/clawd-on-desk).
5. **Multi-Agent Observability (disler)**: a real-time Vue dashboard of hook events across concurrent agents.
   - **Why it impresses**: the classic "watch the swarm" demo, with event timelines per agent.
   - **Media**: [dashboard](https://raw.githubusercontent.com/disler/claude-code-hooks-multi-agent-observability/main/images/app.png), [animated data flow](https://raw.githubusercontent.com/disler/claude-code-hooks-multi-agent-observability/main/images/AgentDataFlowV2.gif), YouTube deep dive linked in the README.
   - **Setup effort**: medium. Copy hooks into each project; needs uv, Bun and just; `just start`.
   - **Sources**: [README](https://github.com/disler/claude-code-hooks-multi-agent-observability).
6. **agents-observe**: a real-time dashboard with filtering, search, "full replay and token usage stats".
   - **Media**: [dashboard GIF](https://raw.githubusercontent.com/simple10/agents-observe/videos/docs/assets/dashboard.gif), [demo video](https://raw.githubusercontent.com/simple10/agents-observe/videos/docs/assets/demo.mp4).
   - **Setup effort**: low. Two `claude plugin` commands.
   - **Sources**: [README](https://github.com/simple10/agents-observe).
7. **CC Harness**: a live subagent and workflow topology graph that "grows as the workflow runs", with per-node latency and cost and a click-through to each agent's transcript.
   - **Media**: [topology GIF](https://raw.githubusercontent.com/lookfree/cc-harness/main/images/agent-topology.gif).
   - **Setup effort**: low to medium (unsigned desktop binaries).
   - **Sources**: [README](https://github.com/lookfree/cc-harness).
8. **tokscale**: TUI views plus a web **3D contributions graph** and "Wrapped 2025".
   - **Why it impresses**: `tokscale submit` puts you on a global leaderboard with a public profile: the purest "flex".
   - **Media**: [3D graph](https://raw.githubusercontent.com/junhoyeo/tokscale/main/.github/assets/frontend-contributions-graph.png), [TUI](https://raw.githubusercontent.com/junhoyeo/tokscale/main/.github/assets/tui-overview.png).
   - **Setup effort**: trivial (`bunx tokscale@latest`), but submitting uploads your usage.
   - **Sources**: [README](https://github.com/junhoyeo/tokscale).
9. **cmux**: a Ghostty-based macOS terminal where panes get a blue "notification ring" and tabs light up when an agent needs you. The sidebar shows branch, PR and ports.
   - **Media**: [notification rings](https://raw.githubusercontent.com/manaflow-ai/cmux/main/docs/assets/notification-rings.png), [YouTube demo](https://www.youtube.com/watch?v=i-WxO5YUTOs).
   - **Setup effort**: low (.dmg), macOS only.
   - **Sources**: [README](https://github.com/manaflow-ai/cmux).
10. **Superset**: parallel agent workspaces with live diffs and an agent-monitoring sidebar.
    - **Media**: [hero GIF](https://raw.githubusercontent.com/superset-sh/superset/main/apps/marketing/public/images/readme-hero.gif).
    - **Setup effort**: low (.dmg); macOS primary.
    - **Sources**: [README](https://github.com/superset-sh/superset).
11. **Built-in zero-install flexes**:
    - **`/usage` Stats tab**: activity heatmap; Ctrl+S copies a stats screenshot. Sources: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) 2.1.84/2.1.132/2.1.246.
    - **`/insights`**: a shareable-looking local HTML report on "which projects you work in, how you use Claude Code, where things go wrong, and features to try". Sources: [Commands reference](https://code.claude.com/docs/en/commands); [Manage costs](https://code.claude.com/docs/en/costs).
    - **Agent view**: [screenshot](https://mintcdn.com/claude-code/HDAmBwgbrZVk0pOt/images/agent-view-dark.png?fit=max&auto=format&n=HDAmBwgbrZVk0pOt&q=85&s=fc3c195bfc57e313ced1f1beb36cee93); [docs](https://code.claude.com/docs/en/agent-view).
    - **Anthropic sample mods**: `token-weather` (context-window forecast above the prompt) and `replay-theater` (`/replay` of last-turn edits). Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview).
    - **Setup effort**: none for the built-ins; `--plugin-dir` for the sample mods.
12. **Menu-bar and notch flexes**:
    - **Claude Usage Tracker** "Dynamic Island (Beta)": a notch HUD of live Claude Code activity. [Popover](https://raw.githubusercontent.com/hamed-elfayome/Claude-Usage-Tracker/main/.github/popover.png). Source: [README](https://github.com/hamed-elfayome/Claude-Usage-Tracker).
    - **CodexBar** popover with reset countdowns. [Screenshot](https://raw.githubusercontent.com/steipete/CodexBar/main/docs/codexbar.png). Source: [README](https://github.com/steipete/CodexBar).
    - **Claude-Code-Usage-Monitor** Rich TUI. [Screenshot](https://raw.githubusercontent.com/Maciek-roboblog/Claude-Code-Usage-Monitor/main/doc/scnew.png). Source: [README](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor).
    - **Setup effort**: low.
13. **Replay and history visuals**:
    - **OrcaReplay**: record, replay offline, fork onto other models. [Demo GIF](https://raw.githubusercontent.com/Continuum-AI-Corp/OrcaReplay/main/docs/demo-cli.gif). Source: [README](https://github.com/Continuum-AI-Corp/OrcaReplay).
    - **bough**: a day's work drawn as a priced diagram. [Demo GIF](https://raw.githubusercontent.com/nickelsec/bough/main/docs/img/demo.gif). Source: [README](https://github.com/nickelsec/bough).
    - **claude-code-log**: zoomable timeline and [example HTML](https://daaain.github.io/claude-code-log/example/). Source: [README](https://github.com/daaain/claude-code-log).
    - **Setup effort**: low.
14. **Kanban of parallel agents**:
    - **Vibe Kanban** board ([screenshot](https://raw.githubusercontent.com/BloopAI/vibe-kanban/main/packages/public/vibe-kanban-screenshot-overview.png)) is still the iconic kanban view, but it is sunsetting into community maintenance — [shutdown post](https://www.vibekanban.com/blog/shutdown).
    - **claude-office** has a kanban whiteboard mode — [README](https://github.com/paulrobello/claude-office).
    - **Maestro** has a usage dashboard and a mobile QR remote ([screenshot](https://raw.githubusercontent.com/RunMaestro/Maestro/main/docs/screenshots/main-screen.png)) — [README](https://github.com/RunMaestro/Maestro).
15. **Grafana "NOC wall"**:
    - The Grafana Cloud integration (four dashboards) — [Grafana docs](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-claude-code/).
    - Community dashboard 25255 with cost leaderboards and cache-hit panels — [grafana.com](https://grafana.com/grafana/dashboards/25255-claude-code-metrics-prometheus/).
    - **Setup effort**: medium (OTel env vars plus a backend).
16. **Dashboard mods**: Capital & Compute describes a ten-mod pack. It has numbered rows above the prompt for live activity, a context meter with sparkline, repo/PR/CI status, memory, system stats, and 5-hour/7-day usage meters with a model switcher. It is "not open source at the moment" (published 2026-10-03, updated 2026-10-04) — [Capital & Compute](https://capitalandcompute.net/blog/claude-code-dashboard-mods/). The mods researcher covers this area in depth.

All raw.githubusercontent.com and mintcdn.com image/GIF/MP4 URLs above returned HTTP 200/206 when checked on 2026-10-14. YouTube, marketplace and example-page links were copied from the READMEs and not fetched.

### Inferences
- The best riced-terminal "flex" combo with little setup:
  - pixtuoid in one tmux pane.
  - cctop or claude-esp in another.
  - Agent view for dispatch.
  - `npx ccusage@latest monthly --compact` for a screenshot-ready table.
  - CodexBar or Claude Usage Tracker in the menu bar.
- For a "wow" demo video, Pixel Agents (or claude-office) next to a running multi-agent workflow is the most recognizable visual in the community right now.
- The Grafana or OTel route impresses teammates but takes the most setup. Hook dashboards (agents-observe) give 80% of the live-swarm effect with two commands.

### Gaps
- No companion tool among those checked ships as a **Claude Code mod**, as distinct from a plugin with hooks, as of 2026-10-14. Mods launched only on 2026-10-01 (v2.1.287). agents-observe, ccmanager and agent-deck ship ordinary Claude Code plugins. The only insight "mods" found are Anthropic's samples (`token-weather`, `replay-theater`), the built-ins (`/diff`, "You should know"), and Capital & Compute's closed-source pack.
- Some visualizers (Clawd on Desk, Pixel Agents) also support many non-Claude agents. Claude-specific feature parity was not tested.
- Videos were not watched; the descriptions come from READMEs.
