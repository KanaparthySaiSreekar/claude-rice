# Claude Code status lines: official API, community tools, designs, pitfalls, mods impact, and wow factor (state as of 2026-10-14)

Research notes by the status-line researcher. Scope: status lines only (the `statusLine` / `subagentStatusLine` settings, status-line tools, galleries, and the status-like surfaces that mods add). Method notes, so readers can judge freshness:
- Official behavior comes from the live docs page (fetched 2026-10-14) and the CHANGELOG at its v2.1.299 head (released 2026-10-14). Version release dates come from the npm registry document for `@anthropic-ai/claude-code` ([registry](https://registry.npmjs.org/@anthropic-ai/claude-code)).
- GitHub star counts are exact counts as of 2026-10-14, taken from the ungh.cc GitHub mirror API (`https://ungh.cc/repos/{owner}/{repo}`), because the GitHub API was blocked in this environment. Last-commit dates come from shallow git clones. Latest-version dates come from npm where a package exists, and otherwise from the newest git tag (tag dates were not available). README claims were read from each repo's default branch on 2026-10-14.
- Reddit was not reachable (HTTP 403, and WebFetch refused old.reddit.com), so showcase evidence comes from Hacker News (Algolia API), two status-line galleries, blogs, and GitHub. See the Gaps sections.

---

## 1. The official `statusLine` feature: settings, `/statusline`, the JSON payload, rendering, update behavior, and 2026 changes

### Takeaway
The status line is still a plain shell command. Claude Code pipes a large JSON payload to it on stdin and renders whatever it prints to stdout: multiple lines, ANSI colors, and OSC 8 links all work. The command re-runs on events, with a 300 ms debounce, plus an optional `refreshInterval`. Through 2026 the payload grew a lot: native 5h/7d rate limits (v2.1.80, Mar 2026), effort and thinking, repo and PR info, prompt-cache statistics, spend limits, and worktree data. A separate `subagentStatusLine` lets you restyle each subagent row. Mods (v2.1.287, Oct 1, 2026) did not replace the status line. They added in-process alternatives, covered in section 5.

### Cited Findings

**Settings format (exact keys)**
- `statusLine` takes `type: "command"` and a `command` string (a script path or an inline shell command), plus three optional fields. `padding` adds characters of horizontal spacing, defaults to `0`, and is relative to the built-in spacing. `refreshInterval` re-runs the command every N seconds on top of event-driven updates, with a minimum of `1`. `hideVimModeIndicator: true` suppresses the built-in `-- INSERT --` text when your script renders `vim.mode` itself. — [Status line docs](https://code.claude.com/docs/en/statusline); [settings reference: statusLine](https://code.claude.com/docs/en/settings-reference)
- The docs give this canonical example: `{"statusLine": {"type": "command", "command": "~/.claude/statusline.sh", "padding": 2}}`. It also works as an inline jq one-liner: `"command": "jq -r '\"[\\(.model.display_name)] \\(.context_window.used_percentage // 0)% context\"'"`. — [Status line docs](https://code.claude.com/docs/en/statusline)
- `statusLine` can go in any settings file: user `~/.claude/settings.json`, project settings, or managed settings. It is unset by default, which means no status line. — [settings reference](https://code.claude.com/docs/en/settings-reference)
- Claude Code reloads settings automatically and runs the script as soon as you save the file. — [Status line docs](https://code.claude.com/docs/en/statusline)
- **Plugins cannot ship a main `statusLine`.** A plugin's settings apply only `agent` and `subagentStatusLine`, and other keys are dropped at load. Plugin-distributed status lines therefore include a setup command that writes `statusLine` into your user settings. Examples are claude-hud's `/claude-hud:setup` and claude-powerline's `/powerline`. — [Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference); [claude-hud README](https://github.com/jarrodwatts/claude-hud); [claude-powerline README](https://github.com/Owloops/claude-powerline)

**The `/statusline` command**
- `/statusline <natural language>` (for example, `/statusline show model name and context percentage with a progress bar`) has Claude Code generate a script in `~/.claude/` and update your settings. `/statusline delete`, `/statusline clear`, or `/statusline remove it` removes the status line. — [Status line docs](https://code.claude.com/docs/en/statusline)
- The feature launched in v1.0.71 (2025-08-07) with the note "Customizable status line: add your terminal prompt to Claude Code with /statusline". — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [npm registry dates](https://registry.npmjs.org/@anthropic-ai/claude-code)

**Where it renders and what it displaces**
- The status line gets its own row above the built-in footer badges. With a custom status line configured, Claude Code stops showing most footer keyboard hints (`esc to interrupt`, `? for shortcuts`, `hold space to speak`). For clickable ID badges without a script, use `footerLinksRegexes` (added in v2.1.176, 2026-06-12). — [Status line docs](https://code.claude.com/docs/en/statusline); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
  - *Conflict to flag:* v2.1.169 says "Fixed footer hints (e.g. 'esc to interrupt') not showing for users with a custom statusline", but the current docs say most hints are hidden. Behavior may have changed again after 2.1.169. — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) vs [Status line docs](https://code.claude.com/docs/en/statusline)
- The status line runs locally and costs no API tokens. It hides temporarily during the help menu and permission prompts. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Outside fullscreen rendering, notifications share the status line row: MCP errors and auto-update notices appear on the right, and transient warnings such as context-low cycle there. In fullscreen rendering, notifications get their own row. On narrow terminals these notifications may truncate your output. Verbose mode adds a token counter there. — [Status line docs](https://code.claude.com/docs/en/statusline)

**Update triggers and throttling**
- The script runs at session start and resume. It runs again when a new assistant message arrives, when `/compact` finishes, when the permission mode changes, when vim mode toggles, when the `statusLine.command` changes, when a `refreshInterval` tick fires, when a `rate_limits` window reaches its `resets_at`, and when a warm prompt cache reaches its `expires_at`. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Updates are **debounced at 300 ms**, so rapid changes run the script once. A changed `command` skips the debounce. If a new update fires while the script is still running, **the in-flight script is cancelled**. Event triggers can go quiet while the main session is idle, for example while a coordinator waits on background subagents, so use `refreshInterval` for clocks and other time-based segments. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Output appears only after the script **exits 0**. A non-zero exit or empty output blanks the line, and a slow script keeps stale output on screen. — [Status line docs](https://code.claude.com/docs/en/statusline)

**What the script can output**
- Each echoed line becomes its own row (multi-line is supported). ANSI escape colors and OSC 8 hyperlinks (Cmd+click on macOS, Ctrl+click on Windows/Linux) both work in terminals that support them, such as iTerm2, Kitty, and WezTerm. Terminal.app does not support OSC 8. `FORCE_HYPERLINK=1 claude` overrides hyperlink detection. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Since v2.1.153 (2026-05-27), Claude Code sets the `COLUMNS` and `LINES` environment variables, because `tput cols` cannot see the terminal from inside the captured script. — [Status line docs](https://code.claude.com/docs/en/statusline); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Full stdin JSON payload as of the Oct 2026 docs** ([Status line docs](https://code.claude.com/docs/en/statusline))
- Identity and paths: `session_id`, `session_name`, `prompt_id`, `transcript_path`, `version`, `cwd`, `workspace.current_dir`, `workspace.project_dir`, `workspace.added_dirs`, `workspace.git_worktree`, `workspace.repo.{host,owner,name}`. `session_name` comes from `--name`, `/rename`, or the AI-generated title. `prompt_id` matches the OpenTelemetry `prompt.id`. For GitLab subgroups, `workspace.repo.owner` holds the full namespace path.
- Model and mode: `model.id`, `model.display_name`, `output_style.name`, `fast_mode`, `effort.level` (`low`, `medium`, `high`, `xhigh`, or `max`; reflects live `/effort`), `thinking.enabled`, `vim.mode`, and `agent.name`.
- Cost (client-side estimate at list price, or at `modelPricing` rates when that setting is used): `cost.total_cost_usd`, `cost.total_duration_ms`, `cost.total_api_duration_ms`, `cost.total_lines_added`, `cost.total_lines_removed`. The cost resets to $0 on `/clear` since v2.1.211.
- Context: `context_window.total_input_tokens`, `total_output_tokens`, `context_window_size` (200000, or 1000000 for extended context), `used_percentage`, `remaining_percentage`, `current_usage.{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens}`, and `exceeds_200k_tokens`. `used_percentage` counts **input tokens only** (input + cache creation + cache read).
- Plan limits: `rate_limits.five_hour.{used_percentage,resets_at}` and `rate_limits.seven_day.{used_percentage,resets_at}`, in epoch seconds. These are present only for Pro and Max subscribers, and only after the first API response. `rate_limits.spend_limit.{used_percentage,resets_at,used_usd,limit_usd,period}` applies behind a Claude apps gateway; the dollar fields need v2.1.284+ and refresh about every 5 minutes.
- Prompt cache (v2.1.251+): `prompt_cache.{warm,caching_observed,ttl,expires_at,requests,misses,expected_rebuilds,hit_ratio,cache_write_tokens,miss_recache_tokens,last_miss_at,last_miss_cause,miss_causes,recache_tokens_if_cold}`. Cause names include `tools_changed`, `system_prompt_changed`, `ttl_expired_5m`, and `likely_server_side`.
- Git hosting: `pr.{number,url,review_state,kind}`. This mirrors the footer PR badge; `review_state` is `approved`, `pending`, `changes_requested`, or `draft`. `kind: "mr"` means a GitLab merge request (v2.1.234+).
- Worktree sessions: `worktree.{name,path,branch,original_cwd,original_branch}`.
- Fields that can be absent or null: `session_name`, `prompt_id`, `workspace.git_worktree`, `workspace.repo`, `effort`, `vim`, `agent`, `pr`, `worktree`, `rate_limits` (each window independently), and `prompt_cache`. `context_window.current_usage` is null before the first call and right after `/compact`. The docs recommend jq fallbacks such as `// 0` or `// empty`.
- `/context` adds an estimate for messages since the last response, so it can read higher than the status line. Use `used_percentage` for the simplest accurate value. — [Status line docs](https://code.claude.com/docs/en/statusline); [CHANGELOG 2.1.281](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**`subagentStatusLine` (per-subagent rows in the agent panel)**
- `{"subagentStatusLine": {"type": "command", "command": "~/.claude/subagent-statusline.sh"}}` runs once per refresh tick. Its stdin carries the base hook fields, `columns`, and a `tasks[]` array. Each task has `id`, `name`, `type`, `agentType` (v2.1.293+), `status`, `description`, `label`, `startTime`, `model`, `effort` (v2.1.213+), `contextWindowSize`, `tokenCount`, **`tokenSamples` (up to the last 16 `tokenCount` readings)**, and `cwd`. The script writes one JSON line per row, in the form `{"id": "...", "content": "<ANSI/OSC8 string>"}`. An empty `content` hides that row. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Plugins *can* ship a default `subagentStatusLine`. — [Status line docs](https://code.claude.com/docs/en/statusline); [Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference)

**Trust and policy gates (why a status line can silently vanish)**
- The status line stays blank until you accept the workspace trust dialog; `claude --debug` logs `Status line command skipped: workspace trust not accepted`. In v2.1.51 (2026-02-23), a security fix stopped `statusLine` from running without trust. — [Status line docs](https://code.claude.com/docs/en/statusline); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Under `allowManagedHooksOnly`, `disableAllHooks: true` set outside managed settings, or `--safe-mode`, only a managed `statusLine` runs, and yours is skipped **without warning**. A managed `disableAllHooks` turns the status line off entirely. — [settings reference: status line gates](https://code.claude.com/docs/en/settings-reference)
- `claude --debug` logs the script's stderr on every invocation and its exit code on the first invocation in a session. — [Status line docs](https://code.claude.com/docs/en/statusline)

**Windows**
- Status line commands run through Git Bash when it is installed, and through PowerShell otherwise. Use forward slashes in the `command` path, because Git Bash eats backslashes and the command then fails silently. `~` expands to the Windows home directory. To run a PowerShell script, use `"command": "powershell -NoProfile -File C:/Users/username/.claude/statusline.ps1"`. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Recent Windows fixes: v2.1.183 (2026-06-19) fixed fullscreen TUI corruption in Windows Terminal ("statusline mid-screen"). v2.1.293 (2026-10-07) fixed stopping a status line sometimes killing an unrelated process that had reused its PID. — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Status line changelog timeline** (versions from [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), dates from the [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code))
| Version (date) | Change |
|---|---|
| 1.0.71 (2025-08-07) | `/statusline` and custom status line introduced |
| 1.0.85 (2025-08-19) / 1.0.88 (2025-08-22) | Session cost info; `exceeds_200k_tokens` |
| 2.0.65 (2025-12-11) / 2.0.70 (2025-12-15) | Context window info; `current_usage` |
| 2.1.6 (2026-01-13) | `context_window.used_percentage` / `remaining_percentage` |
| 2.1.47 (2026-02-18) | `workspace.added_dirs` |
| 2.1.51 (2026-02-23) | Security fix: no status line without workspace trust |
| 2.1.69 (2026-03-04) | `worktree` object |
| 2.1.80 (2026-03-19) | **`rate_limits` (5-hour and 7-day)** |
| 2.1.97 (2026-04-08) | **`refreshInterval`**; `workspace.git_worktree`; fix for NO_FLICKER on short terminals |
| 2.1.119 (2026-04-23) | `effort.level`, `thinking.enabled` |
| 2.1.132 (2026-05-06) | Fixed `context_window` counts showing cumulative totals instead of current usage |
| 2.1.141 (2026-05-13) | Fixed multi-line rows dropped or corrupted when any line exceeds terminal width |
| 2.1.145 (2026-05-19) | GitHub repo and PR info in the JSON |
| 2.1.153 (2026-05-27) | `COLUMNS` / `LINES` env vars |
| 2.1.211 (2026-07-15) | `/clear` resets status line cost |
| 2.1.214 (2026-07-18) | Effort in the `subagentStatusLine` payload (`subagentStatusLine` exists by this version; the version that introduced it was not found) |
| 2.1.216 (2026-07-20) | Fixed statusline running twice on resume |
| 2.1.234 (2026-08-17) | GitLab merge request badge in the footer and statusline |
| 2.1.243 (2026-08-24) | `modelPricing` applies to status line cost; fixed stale `rate_limits` after reset |
| 2.1.251 (2026-08-28) | `rate_limits.spend_limit` and the `prompt_cache` object |
| 2.1.260 (2026-09-03) | Prompt-cache miss causes |
| 2.1.284 (2026-09-28) | Spend limit dollar fields |
| 2.1.287 (2026-10-01) | Mods on by default in the terminal (see section 5) |
| 2.1.293 (2026-10-07) | `agentType` in the `subagentStatusLine` payload; Windows PID fix |
| 2.1.296 (2026-10-09) | Status line cost reprices Sonnet 5.5 cache reads |
| 2.1.299 (2026-10-14) | Fixed status line sometimes showing more than 100% used |
- npm dist-tags on 2026-10-14: `stable` = 2.1.287, `latest` = 2.1.299. — [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)
- The official docs link two community projects, [ccstatusline](https://github.com/sirmalloc/ccstatusline) and [starship-claude](https://github.com/martinemde/starship-claude), as pre-built options. — [Status line docs](https://code.claude.com/docs/en/statusline)

### Inferences
- A local `strings` check of the installed v2.1.299 binary found the identifiers `hideVimModeIndicator`, `refreshInterval`, `subagentStatusLine`, `session_name`, `prompt_cache`, and `spend_limit`, consistent with the docs. This is my own local verification, not a published source.
- Because `rate_limits` became native in v2.1.80, tools that read OAuth credentials and poll the usage API are mostly obsolete for Pro/Max users. Prefer stdin data.
- Users on the npm `stable` channel (2.1.287) have mods but not the later payload additions: `agentType` (2.1.293) and the more-than-100% fix (2.1.299).
- `refreshInterval` (minimum 1 s) together with the `resets_at` and `expires_at` triggers makes live countdowns possible without a daemon. The 1-second minimum caps any "animation" at about 1 fps.

### Gaps
- The version that introduced `subagentStatusLine`, `hideVimModeIndicator`, `session_name`, `prompt_id`, and `fast_mode` was not found in the CHANGELOG.
- The 2.1.169 footer-hint fix and the current docs disagree about whether footer hints show alongside a custom status line. This was not tested.

---

## 2. Community status-line tools compared side by side

### Takeaway
Two tools dominate. **ccstatusline** is the most-used general formatter, with about 202.7k npm downloads a month, 13.3k stars, the deepest widget set, and a TUI editor. **claude-hud** has the most stars of any status-line project (28.5k) and is a plugin focused on live activity: tools, agents, and todos. **claude-powerline** is the best-looking plugin-first powerline (6 themes × 4 styles, plus a web visual builder). **ccusage statusline** suits cost and burn-rate focus. **CCometixLine** is the established Rust option but has been dormant since March 2026. Newer fast binaries (cship in Rust; claudeline, TheoBrigitte, and felipeelias in Go) and single-file Bash scripts (claude-pace, kcchien, awesome statusline) fill niches.

### Cited Findings

**Comparison table** (stars are exact counts on 2026-10-14 via [ungh.cc](https://ungh.cc), which mirrors the GitHub API; "last commit" comes from a shallow clone. Install snippets follow the table.)

| Tool (repo) | Language / runtime | Stars | Last commit · latest version | License | Configurator | Look | What it shows (highlights) |
|---|---|---|---|---|---|---|---|
| [claude-hud](https://github.com/jarrodwatts/claude-hud) | TypeScript/JS plugin; Node 18+ or Bun on macOS/Linux, Node 18+ on Windows | 28,520 | 2026-10-13 · tag v0.11.2 | MIT | `/claude-hud:configure` guided flow with preview | 2 lines with `█░` bars; optional activity lines | Model, provider label, path, git; context bar (green→yellow→red); 5h/7d usage with reset; optional tools/agents/todos, MCP, cache, compactions, weekly cost, usage-pace ▲ |
| [ccusage](https://github.com/ccusage/ccusage) `statusline` (moved from ryoppippi/ccusage) | TypeScript (Bun/Node) | 19,002 (whole project) | 2026-10-14 · npm 20.0.32 (2026-10-14) | MIT | CLI flags only | Single emoji line | Session, today, and 5h-block cost; block time left; 🔥 burn rate $/hr; 🧠 context tokens %; model and effort |
| [ccstatusline](https://github.com/sirmalloc/ccstatusline) | TypeScript, runs on Bun or Node | 13,286 | 2026-10-13 · npm 2.2.32 (2026-10-09) | MIT | **React/Ink TUI with live preview**, fuzzy widget picker, import/export | Powerline (caps, flex mode, auto-align, colors continuing across lines), built-in themes, 16/256/truecolor, **gradients**, minimalist mode, unlimited lines | Very broad widget set (listed below) |
| [CCometixLine](https://github.com/Haleclipse/CCometixLine) | Rust (npm-distributed binary) | 3,472 | **2026-03-15** · v1.1.2 (npm 2026-03-14) | MIT (Cargo.toml; no LICENSE file in root) | TUI `ccline -c` / `--config` with real-time preview | Themes cometix, minimal, gruvbox, nord, powerline-dark, plus custom TOML; needs a Nerd Font | Model, directory, git branch/status/tracking, context; transcript-based usage; "Claude Code enhancement utilities" |
| [claude-statusline (kamranahmedse)](https://github.com/nilbuild/claude-statusline) (repo now nilbuild/claude-statusline) | Bash + jq + curl | 1,399 | 2026-04-03 · npm 1.0.6 (2026-04-03) | MIT | None (installer) | Minimal single line | Limits, directory, git |
| [claude-powerline](https://github.com/Owloops/claude-powerline) | TypeScript, Node 18+, **zero dependencies** | 1,174 | 2026-10-11 · npm 1.32.3 (2026-10-10) | MIT | `/powerline` wizard plus **Powerline Studio** web builder ([powerline.owloops.com](https://powerline.owloops.com/)) | 6 themes (dark, light, nord, tokyo-night, rose-pine, gruvbox) + custom; 4 styles (minimal, powerline, capsule, **tui** bordered panel); unicode or ASCII charset | Directory (full/fish/basename), git, model, session, 5h block with pace, weekly, metrics, cache timer (5m/1h TTL detection), context |
| [cc-statusline](https://github.com/chongdashu/cc-statusline) | TypeScript generator that writes a Bash script (needs jq) | 644 | 2025-12-24 · v1.4.0 | MIT | 3-question `init` wizard | Emoji single line | Directory, git, model, cost with burn rate (via ccusage), tokens/tpm, session time |
| [ClaudeCodeStatusLine](https://github.com/daniel3303/ClaudeCodeStatusLine) | Bash + PowerShell | 614 | 2026-05-25 · tag v1.4.4 | MIT | None (Claude installs it from INSTALL.md) | Compact line | Model, cwd@branch (+/−), tokens used/total (%), effort, 5h/7d with reset times |
| [claude-code-statusline (rz1989s)](https://github.com/rz1989s/claude-code-statusline) | Bash (99 .sh files), TOML config | 479 | 2026-07-15 · tags up to v2.27.1 | MIT | `--interactive` installer | Themes classic, garden, catppuccin | Block metrics, burn rate, cache efficiency, cost projections, MCP monitoring, prayer times; macOS, Linux, WSL |
| [cship](https://github.com/stephenleo/cship) | Rust | 427 | 2026-09-06 · v1.8.3 | Apache-2.0 | TOML (`~/.config/cship.toml`) | Starship-compatible styling, embeds Starship modules (for example the Catppuccin Powerline preset), Nerd Font glyphs | Cost, context, model, 5h/7d limits (with `{bar}`), vim mode, agent; "≤10ms render budget" |
| [claude-code-usage-bar / claude-statusbar](https://github.com/leeguooooo/claude-code-usage-bar) | Python (PyPI `claude-statusbar`), native release bundles | 377 | 2026-10-09 · tag v3.46.1 | MIT | CLI | **3 styles (battery-bar, capsule, hairline) × 9 themes** | 5h/7d bars, reset countdowns, model, context, prompt-cache countdown; floating HUD for the desktop app |
| [claude-code-statusline-pro (ccsp)](https://github.com/Wangnov/claude-code-statusline-pro) | Rust core shipped via npm | 237 | 2026-07-26 · 4.1.1 (npm 2026-06-09) | MIT | TOML + letter presets (`PMBTURS`) | Classic, Powerline, Capsule; Nerd Font, emoji, or text modes; gradient bar | Tokens (claims parity with the official count), thinking/ready state; README in Chinese and English |
| [claude-pace](https://github.com/Astro-Han/claude-pace) | Pure Bash + jq, single file | 236 | 2026-09-25 · v0.9.5 (npm 2026-09-24) | MIT | None | Minimal, pace arrows ⇡/⇣ | 5h/7d %, reset countdown, **pace delta**, git |
| [claude-code-statusline (kcchien)](https://github.com/kcchien/claude-code-statusline) | Bash + jq | 198 | 2026-03-24 (single snapshot) | MIT | Env vars | **Truecolor gradient bar**, optional Nerd Font/powerline | Model, context, cost, duration, git dirty, rate limits; "< 50ms" |
| [Awesome Statusline](https://github.com/awesomezun/claude-statusline) (formerly AwesomeJun/CC-statusline) | Bash; native PowerShell on Windows | 197 | 2026-10-14 · tag v3.3.2 | MIT | 5 size presets (xs–xl) | **Catppuccin gradient bars**, emoji (no Nerd Font) | Context, 5h/7d, cost, ⚡effort, 💡thinking |
| [starship-claude](https://github.com/martinemde/starship-claude) | Bash wrapper around Starship | 152 | 2026-04-30 | MIT | Setup wizard via plugin | Starship TOML templates | Starship-styled Claude info (linked from the official docs) |
| [pyccsl](https://github.com/wolfdenpublishing/pyccsl) | Python single file | 83 | push 2025-08-12 (stale) | not checked | n/a | Nine themes, five separator styles (per [Konur](https://yigitkonur.com/research/claude-code-statuslines-compared)) | Cache hit rate, token breakdowns, response timing |
| [claudeline](https://github.com/fredrikaverpil/claudeline) | Go, standard library only | 54 | 2026-10-08 · v0.27.0 | MIT | Flags | Minimal 5-char `█░` bars | Plan/provider, model, context, 5h/7d quota, 🥊 prompt-cache cold indicator |
| [claudia-statusline](https://github.com/hagan/claudia-statusline) | Rust | 36 | 2026-09-28 · v3.3.0 | MIT | TOML presets | **11 themes**, 5 layout presets | Dir/git, context bar, model, duration, lines, cost with burn rate; SQLite session persistence |
| [claude-statusline (felipeelias)](https://github.com/felipeelias/claude-statusline) | Go | 22 | 2026-09-26 · v0.11.0 | MIT | TOML; `claude-statusline themes` previews all presets | Presets default, minimal, pastel-powerline, tokyo-night (gradient), gruvbox-rainbow, catppuccin | Directory, model and effort, cost, context bar, usage limits |
| [claude-statusline (TheoBrigitte)](https://github.com/TheoBrigitte/claude-statusline) | Go static binary | 8 | 2026-10-13 · v0.3.0 | MIT | TOML modules | Plain | Model, context bar/tokens/%, cost, duration, 🟢🟡🔴 Claude API status (10-min cache), rate limits |

**Install and config snippets (exact, from each README)**
- **ccstatusline:** `npx -y ccstatusline@latest` or `bunx -y ccstatusline@latest` opens the TUI. Choosing **"Pinned global install"** writes `"command": "ccstatusline"`, which avoids re-resolving `@latest` on every repaint. The README's settings example is `{"statusLine": {"type": "command", "command": "npx -y ccstatusline@latest", "padding": 0, "refreshInterval": 10}}`. Config lives at `~/.config/ccstatusline/settings.json`, and `CLAUDE_CONFIG_DIR` is honored. — [ccstatusline README](https://github.com/sirmalloc/ccstatusline); [docs/WINDOWS.md](https://github.com/sirmalloc/ccstatusline/blob/main/docs/WINDOWS.md)
- **claude-hud:** run `/plugin marketplace add jarrodwatts/claude-hud`, then `/plugin install claude-hud`, `/reload-plugins`, and `/claude-hud:setup`. From a shell: `claude plugin marketplace add jarrodwatts/claude-hud && claude plugin install claude-hud@claude-hud`. On Windows, if setup finds no JS runtime: `winget install OpenJS.NodeJS.LTS`. — [claude-hud README](https://github.com/jarrodwatts/claude-hud)
- **claude-powerline:** run `/plugin marketplace add Owloops/claude-powerline`, then `/plugin install claude-powerline@claude-powerline` and `/powerline`. The wizard writes `~/.claude/claude-powerline.json` and updates `settings.json`. Or set `"command": "npx -y @owloops/claude-powerline@latest --style=powerline"`. CLI flags: `--theme`, `--style`, `--charset=text`. Env vars: `CLAUDE_POWERLINE_THEME`, `CLAUDE_POWERLINE_STYLE`, `CLAUDE_POWERLINE_CONFIG`, `CLAUDE_POWERLINE_DEBUG`, `CLAUDE_POWERLINE_CACHE_DIR`. — [claude-powerline README](https://github.com/Owloops/claude-powerline)
- **ccusage:** `"command": "bun x ccusage statusline"` (recommended), `"npx -y ccusage statusline"`, or `"BUN_BE_BUN=1 claude x ccusage statusline"` (native Claude Code only). Options: `--visual-burn-rate emoji`, `--cost-source cc|ccusage|both`, `--no-offline` (by default it runs offline with cached pricing). Sample output: `🤖 Fable 5 (high) | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr | 🧠 25,000 (12%)`. Burn-rate colors: green under 2,000 tokens/min, yellow 2,000–5,000, red above 5,000. The guide is labeled "Beta". — [ccusage statusline guide](https://ccusage.com/guide/statusline) (source: [docs/guide/statusline.md](https://github.com/ccusage/ccusage/blob/main/docs/guide/statusline.md))
- **CCometixLine:** `npm install -g @cometix/ccline`, then set `"command": "~/.claude/ccline/ccline"` (or `ccline`). On Windows, download the `ccline-windows-x64.zip` release. The README says `~` expands on Windows since Claude Code v2.1.47, so don't use `%USERPROFILE%`. Themes: `ccline --theme cometix|minimal|gruvbox|nord|powerline-dark`. — [CCometixLine README](https://github.com/Haleclipse/CCometixLine)
- **cc-statusline:** `npx @chongdashu/cc-statusline@latest init` asks three questions and writes `.claude/statusline.sh`. — [cc-statusline README](https://github.com/chongdashu/cc-statusline)
- **cship:** `curl -fsSL https://cship.dev/install.sh | bash`, or on Windows `irm https://cship.dev/install.ps1 | iex`, or `cargo install cship`. Then `"statusLine": {"type": "command", "command": "cship"}`. — [cship README](https://github.com/stephenleo/cship)
- **starship-claude:** `/plugin marketplace add martinemde/starship-claude`, then `/plugin install starship-claude@starship-claude` and the setup wizard, which asks about Nerd Fonts. The resulting command is `~/.local/bin/starship-claude`. — [starship-claude README](https://github.com/martinemde/starship-claude)
- **claude-pace:** `/plugin marketplace add Astro-Han/claude-pace` and `/plugin install claude-pace`, or `npx claude-pace`, or copy the single script. — [claude-pace README](https://github.com/Astro-Han/claude-pace)
- **kamranahmedse/claude-statusline:** `npx @kamranahmedse/claude-statusline` backs up your old status line, copies the script to `~/.claude/statusline.sh`, and configures settings. Remove with `--uninstall`. — [README](https://github.com/nilbuild/claude-statusline)
- **claudeline:** `/plugin marketplace add fredrikaverpil/claudeline` and `/plugin install claudeline@claudeline`, or `go install github.com/fredrikaverpil/claudeline@latest` with `"command": "~/go/bin/claudeline"`. Example flags: `claudeline -cwd -git-branch`. — [claudeline README](https://github.com/fredrikaverpil/claudeline)
- **felipeelias:** `brew install felipeelias/tap/claude-statusline` or `go install github.com/felipeelias/claude-statusline@latest`, then `"command": "claude-statusline prompt"`. — [README](https://github.com/felipeelias/claude-statusline)
- **TheoBrigitte:** `curl` the release binary to `~/.local/bin/claude-statusline`, or `go install github.com/TheoBrigitte/claude-statusline@latest`, then `"command": "claude-statusline"`. — [README](https://github.com/TheoBrigitte/claude-statusline)
- **ccsp:** `"command": "npx ccsp@latest"`. Examples: `npx ccsp@latest --preset PMBTURS --theme powerline` and `npx ccsp@latest config init -w`. The old name `claude-code-statusline-pro` still works. — [README](https://github.com/Wangnov/claude-code-statusline-pro)
- **Awesome Statusline:** `curl -fsSL https://raw.githubusercontent.com/AwesomeJun/CC-statusline/main/install.sh | bash`, or on Windows `irm https://raw.githubusercontent.com/AwesomeJun/CC-statusline/main/install.ps1 | iex`. — [README](https://github.com/awesomezun/claude-statusline)
- **rz1989s:** `curl -sSfL https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/install.sh | bash`, with options `--interactive` and `--check-all-deps`. — [README](https://github.com/rz1989s/claude-code-statusline)
- **claudia-statusline:** `curl -fsSL https://raw.githubusercontent.com/hagan/claudia-statusline/main/scripts/quick-install.sh | bash`. — [README](https://github.com/hagan/claudia-statusline)
- **claude-statusbar (leeguooooo):** `curl -fsSL https://raw.githubusercontent.com/leeguooooo/claude-code-usage-bar/main/install.sh | bash`. — [README](https://github.com/leeguooooo/claude-code-usage-bar)

**ccstatusline widget inventory** (README changelog sections, read on 2026-10-14)
- Model, session name/cost/duration, thinking effort, vim mode, voice status, account email, Claude status (can link to the status page as of 2026-10-13), and sandbox status.
- Context length, context %, context window, context bar, tokens in/out, token speed, compaction counter, cache timer (HOT state, TTL countdown), cache hit rate, cache read/write.
- Session and weekly usage, including per-model (Sonnet, Opus, Fable) weekly widgets, block timer, and block/weekly reset timers.
- Git: branch, status, staged, unstaged, untracked, ahead/behind, conflicts, SHA, insertions/deletions, PR/MR, CI status, worktree, origin/upstream, is-fork. JJ widgets too.
- Working directory, git root, memory usage, skills, OSC 8 link, custom text, custom command, custom symbol.
- Source: [ccstatusline README](https://github.com/sirmalloc/ccstatusline)
- Recent engineering: per-cwd git caches, non-blocking PR/CI refresh from a versioned disk cache, "full-width layouts by default", Windows temp-file leak fix, and filtering of terminal control sequences while keeping colors and hyperlinks. — [ccstatusline README](https://github.com/sirmalloc/ccstatusline)

**Adoption signals (npm, last 30 days, read 2026-10-14 from api.npmjs.org)**
- ccstatusline 202,712 · @owloops/claude-powerline 19,133 · @cometix/ccline 1,554 · @kamranahmedse/claude-statusline 324 · @chongdashu/cc-statusline 281 · claude-pace 271 · ccsp 89 plus claude-code-statusline-pro 95. ccusage logged 877,566, but that counts every ccusage use, not just the status line. — [npm: ccstatusline](https://www.npmjs.com/package/ccstatusline); [npm: @owloops/claude-powerline](https://www.npmjs.com/package/@owloops/claude-powerline); [npm: ccusage](https://www.npmjs.com/package/ccusage)

**Name-collision warnings**
- The npm package `claude-hud` (1.1.0, 2026-03-10) has no repository link and is *not* jarrodwatts' plugin, which installs through the plugin marketplace. — [npm registry: claude-hud](https://registry.npmjs.org/claude-hud); [claude-hud README](https://github.com/jarrodwatts/claude-hud)
- The npm package `claude-code-statusline` belongs to xpzouying/claude-code-statusline (1.1.4, 2025-09-07), not to rz1989s or kcchien, even though both use that name in their own package.json. — [npm registry: claude-code-statusline](https://registry.npmjs.org/claude-code-statusline)

**Third-party comparisons**
- Yiğit Konur's April 16, 2026 comparison covers 24 repos. It rates ccstatusline the "category leader" and best overall default; claude-powerline best plugin-first; CCometixLine the strongest Rust product; cship the "only serious Starship bridge"; claude-hud best for tool, agent, and todo observability; claudeline best for conservative operators; claude-pace best pure-shell quota tool; daniel3303 the cross-platform reference; pyccsl the richest zero-dependency Python; kcchien a dense-design reference. Its star counts are older; for example it lists ccstatusline at 7,638. — [Konur comparison](https://yigitkonur.com/research/claude-code-statuslines-compared)
- An August 4, 2026 roundup lists the built-in `/statusline`, DIY scripts, ccstatusline, cship, and starship-claude. It notes the powerline tools "show the same fields, model, branch, context, cost, just styled." — [mcsaguru roundup](https://mcsaguru.com/top-claude-code-statusline-setups-2026)

### Inferences
- For most users, the best default is ccstatusline with a pinned global install, or claude-hud if live tools/agents/todos lines matter more than styling.
- claude-powerline's `tui` style and Powerline Studio make it the easiest route to a polished look without hand-editing JSON.
- CCometixLine has had no commits for about 7 months while Claude Code shipped native binaries (Week 16, 2026: "native binaries replacing the bundled JavaScript"; [what's new index](https://code.claude.com/docs/llms.txt)). Its "Claude Code enhancement utilities", which patch Claude Code, are therefore unverified on current versions. Treat it as rendering-only.
- Binaries in Rust, Go, or Zig avoid the Node/Bun startup cost on every repaint, which matters most on Windows and on low-power machines (see section 4).

### Gaps
- GitHub release dates for non-npm tools (cship, claudeline, TheoBrigitte, felipeelias, claudia, daniel3303) were unavailable because the GitHub API and HTML were blocked. Last-commit dates stand in for them.
- No independent benchmark compares the tools head-to-head. Performance claims are each author's own: cship "≤10ms render budget", TheoBrigitte "18,741 ns/op full pipeline", cc-statusline "45-80ms typical", kcchien "< 50ms".
- pyccsl's license was not checked, and its features come only from the Konur summary.

---

## 3. What power users show and which layouts are most popular

### Takeaway
The consensus layout is one or two lines. Line 1 has identity: model (often with effort), project or directory, and git branch with dirty state. Line 2 has health: a color-thresholded context bar plus 5h/7d plan usage with reset countdowns. Cost, burn rate, and pace come next in popularity. Activity lines (tools, agents, todos) and prompt-cache warmth are the 2026 additions. The most-copied gallery designs are multi-line "panels" and pace-colored quota meters.

### Cited Findings

**Gallery and showcase data**
- **statuslin.es** is a hand-reviewed community gallery with renders captured from live sandbox containers. As of Oct 14, 2026 it had 35 published status lines and 844 total copies. Top cards by copy count:
  - Dreambase Panel (@kyleledbetter): 220 copies. A multi-line boxed panel in a terracotta palette with context, stats, and repo sections; Python.
  - Single-line usage (@NathanAB): 138. Directory, branch, model, effort, context, 5h/7d.
  - Pace Dot Meters (@AndrewP-GH): 93. Two lines with a context bar and quarter-step dot meters colored by pace; no jq needed.
  - Dreambase Flat: 74.
  - Catppuccin Frappé (@danjdewhurst): 66. Model, branch and dirty flag, folder, block context bar, cost.
  - Activity Feed (@JungHoonGhae): 51. Burn rate plus live tool and agent activity from the transcript.
  - Color-Coded Context: 39. Context bar that accounts for the compaction buffer.
  - Powerline Dracula: 27.
  - Quota Fallback (@ohugonnot): 15. Calls the usage API only when stdin lacks `rate_limits`.
  - One Dark Triptych: 13. Three lines with weather, memory, and a rotating kaomoji.
  - Sources: [statuslin.es](https://statuslin.es/); [HN launch thread, 2026-08-17](https://news.ycombinator.com/item?id=49330285); [first Show HN, 2026-06-30](https://news.ycombinator.com/item?id=48732336)
- Cards carry tags such as Git, Tokens, Cost, Limits, Burn Rate, Multi-Line, Powerline, Themed, Weather, **Network Access**, and **Reads Token**. The last two are useful safety signals. — [statuslin.es](https://statuslin.es/)
- **claudelines.com** is a registry where you "install with a single prompt" and are told to "Review scripts before installing". Top entries by installs are Cat Walk (ASCII cat, 36), Rate Limit and Session Info (7), and Usage Bars (4). Other entries include Terminal Tamagotchi, Fortnite Dance (animated), Plasma Field XL, Captain Claude (a sparkline graph), and tickerline (market ticker). Several entries show dollar figures under a "Revenue" sort. — [claudelines.com](https://claudelines.com/); Show HN threads ([2026-07-11](https://news.ycombinator.com/item?id=48875212), [2026-07-13 "Share, install, and sell"](https://news.ycombinator.com/item?id=48892854))

**Hacker News status-line posts** (from the Algolia API)
- The most upvoted status-line Show HN found is "Claudoro, Pomodoro timer embedded in the Claude Code statusline" (2026-07-01, 50 points, 36 comments). Its line: `🍅 22:47 ▕████████░░▏ ●●○○   Opus · 34% · main`. Install: `npm install -g claudoro && pomo setup`; needs Node ≥22. — [HN](https://news.ycombinator.com/item?id=48745590); [emson/claudoro](https://github.com/emson/claudoro)
- Others:
  - "I put my Claude Code rate-limit burndown in the status line" (2026-06-08, 8 points). The author was "getting burned by rate limits". — [HN](https://news.ycombinator.com/item?id=48441132)
  - Live World Cup scores, claudinho, 30★ (2026-06-12). — [HN](https://news.ycombinator.com/item?id=48499159)
  - ZCCInfo in Zig (2026-01-12). — [HN](https://news.ycombinator.com/item?id=46585312)
  - cc-probeline: per-turn costs and Fable limits (2026-08-12). — [HN](https://news.ycombinator.com/item?id=49272636)
  - cc-costline: 7d/30d spend (2026-02-17). — [HN](https://news.ycombinator.com/item?id=47048321)
  - A Tamagotchi in the statusline (2025-08-14). — [HN](https://news.ycombinator.com/item?id=44900873)
  - WaitPerk: "sponsors in your Claude Code status line, you get paid" (2026-08-06). — [HN](https://news.ycombinator.com/item?id=49190726)
- A Korean GeekNews showcase describes a three-line bar with directory, branch, model, a context usage bar, and 5h/weekly rate limits. Another GeekNews post offers a developer-meme statusline plugin. — [GeekNews 28227](https://news.hada.io/topic?id=28227); [GeekNews 28124](https://news.hada.io/topic?id=28124)

**What experienced users argue for**
- AI Hero shows four things: repo, git branch, staged/unstaged changes, and context %. Layout: `matt/course-video-manager | main | S: 0 | U: 1 | A: 0 | 17.3%`. The goal is to avoid making Claude "spend another turn checking", and the context % tells you "when to keep going, compact, or hand off to a fresh session". (Page updated 2025-10-28.) — [AI Hero](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
- claude-pace argues that a raw "60% used" is meaningless without time-to-reset. It shows a pace delta (`⇡15%` means overspending, `⇣15%` means headroom). — [claude-pace README](https://github.com/Astro-Han/claude-pace)
- claude-hud's default two lines: `[Opus] │ my-project git:(main*)` / `Context █████░░░░░ 45% │ Usage ██░░░░░░░░ 25% (resets in 1h 30m)`. Optional lines: `◐ Edit: auth.ts | ✓ Read ×3 | ✓ Grep ×2`, `◐ explore [haiku]: Finding auth code (2m 15s)`, and `▸ Fix authentication bug (2/5)`. — [claude-hud README](https://github.com/jarrodwatts/claude-hud)
- The official multi-line example uses a context bar that is green below 70%, yellow at 70–89%, and red at 90%+, with cost and duration. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Konur's own "Ghostty layout" has a giant context row, merged usage and reset rows, a `⚡` flag for `--dangerously-skip-permissions`, and ASCII fallbacks for SSH. — [Konur comparison](https://yigitkonur.com/research/claude-code-statuslines-compared)
- **XDA's author** used ccstatusline to show usage limits and context-window usage. — [XDA, 2026-10-13](https://xda-developers.com/claude-code-just-became-moddable-like-a-video-game)

**Common data elements (summary of the sources above)**
- Context % with a bar and color thresholds.
- 5h and 7d usage with reset countdown, with or without pace.
- Session, today, or block cost and burn rate (ccusage, cc-statusline, claudia, rz1989s).
- Model with effort and thinking flags (ccusage, Awesome Statusline, daniel3303).
- Git branch, dirty, staged, and ahead/behind (ccstatusline, claude-powerline, cship via Starship).
- PR/CI status (ccstatusline; `pr.*` in the payload).
- Prompt-cache warmth or countdown (claude-powerline cacheTimer, ccstatusline Cache Timer, claudeline 🥊, claude-statusbar `cache 4m23s`).
- MCP servers (claude-hud `showMcp`, rz1989s).
- Todo progress and active agents/tools (claude-hud).
- Session duration and lines changed.
- Clock or Pomodoro (Claudoro), and novelty items (weather, scores, pets).
- Sources: [claude-powerline](https://github.com/Owloops/claude-powerline); [ccstatusline](https://github.com/sirmalloc/ccstatusline); [claude-statusbar](https://github.com/leeguooooo/claude-code-usage-bar); [claudeline](https://github.com/fredrikaverpil/claudeline); [rz1989s](https://github.com/rz1989s/claude-code-statusline); [claude-hud](https://github.com/jarrodwatts/claude-hud)

### Inferences
- The center of gravity moved in 2026 from cost (2025-era ccusage-style lines) to **plan-limit health**: 5h/7d usage, pace, and resets. This tracks the arrival of native `rate_limits` (v2.1.80) and prompt-cache data (v2.1.251).
- A practical "power" layout: Line 1 is model+effort · repo/branch with dirty and ahead/behind · PR state. Line 2 is a context bar (70/90 thresholds) · 5h with pace and reset · 7d · cache warm countdown. Line 3, only during activity, shows tools, agents, and todos (claude-hud style).

### Gaps
- No Reddit "show your status line" threads could be read (403 or fetch refused), so Reddit vote counts and most-praised designs are unknown.
- statuslin.es's "Trending" ranking method is undocumented, and claudelines' dollar figures are unexplained (likely revenue; unconfirmed).

---

## 4. Pitfalls and tips: speed and caching, dependencies, Windows/WSL/PowerShell, fonts, width, colors

### Takeaway
Treat the status line as a hot path: one stdin read, one JSON parse, cached git, no network in the render path. Avoid `npx …@latest` on every repaint, either with a pinned global install or with a compiled binary. On Windows, use forward slashes and prefer a native PowerShell or binary renderer. Nerd Font private-use glyphs can render as blanks inside Claude Code, so keep an ASCII or emoji fallback. Size output from `COLUMNS`, and expect notifications to share the row.

### Cited Findings

**Performance and caching**
- The script runs often. Cache slow commands like `git status`, keyed by `session_id`, not `$$`, `os.getpid()`, or `process.pid`, which change on every run. The official example refreshes git info every 5 s into `/tmp/statusline-git-cache-$SESSION_ID`. — [Status line docs](https://code.claude.com/docs/en/statusline)
- When a new trigger fires, a slow script is cancelled, so a consistently slow script can leave a stale or blank line. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Startup cost matters. The ZCCInfo author measured about 143 ms for a JavaScript version against about 10 ms for a Zig rewrite. — [HN: ZCCInfo](https://news.ycombinator.com/item?id=46585312)
- Per-author numbers: cc-statusline 45–80 ms typical (target under 100 ms). kcchien under 50 ms, with git refresh about 40 ms and about 0 ms on a cache hit. TheoBrigitte 18,741 ns/op for the full pipeline (in-process, excluding process spawn). cship states a "≤10ms render budget". — [cc-statusline](https://github.com/chongdashu/cc-statusline); [kcchien](https://github.com/kcchien/claude-code-statusline); [TheoBrigitte](https://github.com/TheoBrigitte/claude-statusline); [cship](https://github.com/stephenleo/cship)
- `npx -y ccstatusline@latest` re-resolves the package; ccstatusline's README recommends "Pinned global install" to avoid this on every repaint. Konur flags moving-version installs as a (theoretical) supply-chain risk too. — [ccstatusline README](https://github.com/sirmalloc/ccstatusline); [Konur comparison](https://yigitkonur.com/research/claude-code-statuslines-compared)
- Read stdin once, avoid repeated `jq` calls, and use `git --no-optional-locks`. — [AI Hero](https://www.aihero.dev/creating-the-perfect-claude-code-status-line); [kcchien README ("Single jq call + cached git")](https://github.com/kcchien/claude-code-statusline)
- Keep caches private. claude-pace keeps its git cache in `$XDG_RUNTIME_DIR/claude-pace` or `~/.cache/claude-pace` (mode 700) and never in shared `/tmp`. — [claude-pace README](https://github.com/Astro-Han/claude-pace)
- One terminito README line reads "rendered in ~83ms on Windows, where a slow status line never ren…", truncated in the source. Treat it as an anecdote that slow renderers can fail to appear on Windows. — [terminito](https://github.com/arturlimaaa/terminito)
- A leeguooooo README warning shows a hidden cost of 1-second refreshes. Older macOS onefile builds could leave an ~11 MB PyInstaller `_MEI*` directory behind on every killed one-second refresh; upgrade to v3.32.5+. — [claude-statusbar README](https://github.com/leeguooooo/claude-code-usage-bar)

**Dependencies**
- The official Bash examples need `jq`; Python and Node parse JSON natively. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Runtime needs by tool:
  - Node 18+: claude-powerline, claude-hud (claude-hud also accepts Bun on macOS/Linux; Windows needs Node 18+).
  - Bun or Node: ccstatusline, ccusage.
  - Node 16+ plus jq: cc-statusline.
  - jq only: claude-pace, kcchien.
  - jq, curl, git: kamranahmedse.
  - Nothing extra: the Go and Rust binaries, and Awesome Statusline on Windows (PowerShell only).
  - Sources: the respective READMEs: [claude-powerline](https://github.com/Owloops/claude-powerline), [claude-hud](https://github.com/jarrodwatts/claude-hud), [ccstatusline](https://github.com/sirmalloc/ccstatusline), [cc-statusline](https://github.com/chongdashu/cc-statusline), [claude-pace](https://github.com/Astro-Han/claude-pace), [nilbuild/claude-statusline](https://github.com/nilbuild/claude-statusline), [Awesome Statusline](https://github.com/awesomezun/claude-statusline)
- Data sources carry different risk. Konur rates direct API polling (credential lookup), transcript parsing (which depends on evolving internals), and hook-driven caches as medium risk, and local binaries or copied scripts as lowest. — [Konur comparison](https://yigitkonur.com/research/claude-code-statuslines-compared)
- Several tools still call the usage API: claudeline (60 s file cache at `/tmp/claudeline/usage.json`), kamranahmedse (curl), and ohugonnot (only as a fallback). — [claudeline](https://github.com/fredrikaverpil/claudeline); [nilbuild/claude-statusline](https://github.com/nilbuild/claude-statusline); [statuslin.es](https://statuslin.es/)

**Windows, WSL, PowerShell**
- Git Bash is used if present, otherwise PowerShell. Use forward slashes or `~` in the `command` path, and invoke PowerShell scripts with `powershell -NoProfile -File C:/…/statusline.ps1`. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Week 18 of 2026 reads "Claude Code on Windows runs without Git Bash". — [what's new index](https://code.claude.com/docs/llms.txt)
- ccstatusline supports PowerShell 5.1/7+, cmd, and WSL. It recommends Bun (`irm bun.sh/install.ps1 | iex`), Windows Terminal, and `winget install DEVCOM.JetBrainsMonoNerdFont`. It sets the UTF-8 code page for piped output and hides helper windows (`windowsHide`). — [ccstatusline docs/WINDOWS.md](https://github.com/sirmalloc/ccstatusline/blob/main/docs/WINDOWS.md); [README](https://github.com/sirmalloc/ccstatusline)
- Other Windows options: Awesome Statusline has a native PowerShell renderer that needs no Git Bash, jq, or Git (2026-06-02). daniel3303 ships a PowerShell twin script. cship and CCometixLine ship Windows installers or binaries. rz1989s recommends WSL with Ubuntu. — [Awesome Statusline](https://github.com/awesomezun/claude-statusline); [daniel3303](https://github.com/daniel3303/ClaudeCodeStatusLine); [cship](https://github.com/stephenleo/cship); [CCometixLine](https://github.com/Haleclipse/CCometixLine); [rz1989s](https://github.com/rz1989s/claude-code-statusline)

**Fonts and glyph rendering**
- Issue #49270, opened 2026-04-16 with labels `area:statusline` and `area:tui`: Claude Code does not render Nerd Font Private Use Area codepoints such as U+E0A0 and U+F302. They show as blanks or boxes in the statusline, chat, and file views, even with a Nerd Font, while ✓ and → render fine. It was reproduced on v2.1.141 on macOS/iTerm2. The issue was auto-closed as "not planned" by a stale bot on 2026-06-22 and then locked; no maintainer responded. — [anthropics/claude-code#49270](https://github.com/anthropics/claude-code/issues/49270)
- Tools offer fallbacks. claude-powerline has `--charset=text` (ASCII-only). kcchien makes Nerd Font icons opt-in (`CLAUDE_STATUSLINE_NERDFONT=1`). Awesome Statusline uses "standard emoji everywhere" and no Nerd Font. ccsp has Nerd Font, emoji, and text modes. CCometixLine *requires* a Nerd Font. — [claude-powerline](https://github.com/Owloops/claude-powerline); [kcchien](https://github.com/kcchien/claude-code-statusline); [Awesome Statusline](https://github.com/awesomezun/claude-statusline); [ccsp](https://github.com/Wangnov/claude-code-statusline-pro); [CCometixLine](https://github.com/Haleclipse/CCometixLine)
- Konur's list of open platform issues includes #48445 (refresh doesn't repaint), #47071 (binaries need a shell wrapper), #40279 (multi-line collapses on resize), #40287 (no refresh after `/rename`), and #37216 (OSC 8 broken in tmux). — [Konur comparison](https://yigitkonur.com/research/claude-code-statuslines-compared)

**Width, truncation, and escape sequences**
- Size output from `COLUMNS` and `LINES`. Keep output short: long lines truncate or wrap, and notifications can truncate the row on narrow terminals. — [Status line docs](https://code.claude.com/docs/en/statusline)
- Multi-line output with escape codes is more prone to glitches. Use `printf '%b'` instead of `echo -e` for escapes. SSH and tmux may strip OSC sequences. — [Status line docs](https://code.claude.com/docs/en/statusline)
- v2.1.141 fixed multi-line rows dropping when a line exceeded the terminal width. — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- ccstatusline's flex separators and right-alignment improved width detection under wrapper processes and nested PTYs, and its "Full width always" mode is the default for new configs. — [ccstatusline README](https://github.com/sirmalloc/ccstatusline)

**Colors and terminal themes**
- ccstatusline supports 16-color, 256-color, and truecolor (hex). kcchien enables its gradient only when `COLORTERM` is `truecolor` or `24bit`, falling back to ANSI 256 or ASCII. claude-powerline has dark and light themes plus custom color themes. — [ccstatusline](https://github.com/sirmalloc/ccstatusline); [kcchien](https://github.com/kcchien/claude-code-statusline); [claude-powerline](https://github.com/Owloops/claude-powerline)

**Silent-off conditions to check first**
- An untrusted folder, `disableAllHooks`, `allowManagedHooksOnly`, `--safe-mode`, a non-zero exit, output on stderr, or a non-executable script. — [Status line docs](https://code.claude.com/docs/en/statusline); [settings reference](https://code.claude.com/docs/en/settings-reference)
- The Claude Desktop app does not draw custom status lines (issue #41456); a mod-based workaround exists (section 5). — [statusline-anywhere README](https://github.com/NathanAB/statusline-anywhere)
- Cost is a client-side estimate at list price unless `modelPricing` is set, and may differ from your bill. — [Status line docs](https://code.claude.com/docs/en/statusline)

### Inferences
- Plain 16-color ANSI codes such as `\033[32m` take on the terminal's own palette, so they automatically match a Catppuccin or Gruvbox terminal theme. Hex/truecolor themes look identical everywhere but can clash with light backgrounds.
- Given #49270, powerline separators (U+E0B0-range PUA glyphs) may show as blanks for some users even with a Nerd Font. Test with ASCII and powerline variants before committing to a powerline look. The screenshots in powerline repos prove it works in their authors' setups, so the bug looks environment-dependent.
- Debug quickly by piping the docs' mock JSON into your script, then running `claude --debug`.

### Gaps
- Only #49270 was opened directly. The other issue numbers are relayed from Konur's article and were not individually verified.
- No measured data compares `npx` and pinned-install latency for ccstatusline. The penalty is inferred from the README's rationale and the ZCCInfo numbers.

---

## 5. How the mod system (Oct 2026) changed status lines

### Takeaway
Mods launched Oct 1, 2026 (terminal v2.1.287; Desktop app from v2.1.286). They did not change the `statusLine` contract. Instead they added in-process, status-like surfaces: a persistent line under the prompt (`$.ui.status`), a shared **band above the prompt** (`AbovePrompt`), toasts, log lines, and restyleable built-in "status lines" (`Spinner`, `SessionMode`, `PromptHint`, `TurnDuration`, `InfoNotice`). They also expose the same usage data through `$.session.usage()`, with no shell spawn. Mods also brought custom status lines to the Desktop app (statusline-anywhere) and enabled richer graphics (sparklines, rasters, images in panes) than a status-line script can draw.

### Cited Findings
- Mods are "small TypeScript functions that change how Claude Code works". They are distributed inside plugins, are not sandboxed, and include built-ins: `/diff` is now a mod. The announcement is dated October 1, 2026. — [Anthropic announcement](https://claude.com/resources/articles/claude-code-mods)
- Mods are on by default from v2.1.287 in the terminal (npm 2026-10-01) and from 2.1.286 in the Desktop app. `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` from early access is now ignored. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview); [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)
- Anthropic contrasts the two models: "Settings hooks, skills, status lines, and MCP servers work from outside Claude Code: each one runs a script… A mod runs inside Claude Code." — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- `"disableAllHooks": true` in `~/.claude/settings.json` turns off all your mods and also stops "your settings hooks and custom status line". — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- The mods screen map: "A mod can add a pane as a sidebar on the right, a toast at the top right of the transcript, a log line in the transcript, a band above the prompt, and a **status line under the prompt**." — [Draw in the interface (screen map alt text)](https://code.claude.com/docs/en/plugins/mods/interface)
- Mods API calls:
  - `$.ui.status(text)` shows "one line under the prompt that stays until you change it. It starts with `⚠` and the mod's name". Example: `⚠ my-mod: checks: 3 passing`.
  - `$.ui.toast(text)` shows a box at top right in fullscreen, or one line at the right under the prompt in the classic renderer.
  - `$.ui.log(text)` adds a dim transcript line.
  - The docs example polls `gh pr checks` every 60 s with `$.clock.every(60_000, …)` and updates `$.ui.status`.
  - Source: [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)
- The **band above the prompt** "is always there, and every mod shares it". A mod draws there by filtering `ui.render` on `{ component: 'AbovePrompt' }`, and a mod can keep other mods' output by nesting `await next(e)`. — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- Built-in "status lines" are now restyleable render sites: `Spinner`, `ToolProgress`, `TurnDuration`, `InfoNotice`, `SessionMode` (the mode labels in the footer), and `PromptHint` (the hint line under the prompt). For example, a mod can append `· tool calls: N` to the spinner. `Pane`, `AbovePrompt`, and `Spinner` render in both the terminal and Desktop; some status sites are terminal-only. — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface); [Mods reference: render sites](https://code.claude.com/docs/en/plugins/mods/reference)
- `$.session.usage()` returns `{ startedAt, context, rateLimits, cost }`, where `context` has `tokens`, `window`, and `percent`, and `rateLimits` is a list of `{ kind, percentUsed, resetsAt }`. That is status-line data with no stdin JSON. Terminal elements include `Raster` (colored cells up to 512×256), `Image` (PNG up to 2 MiB), `Box` borders (round, double, bold, and others), and `Button` with hotkeys. `Svg` is Desktop-only. — [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Token Weather** (Anthropic's sample mod) draws a context "forecast" in the band above the prompt: `☂  Showers  67% of context  134.4k / 200k   last turns ▁▂█  ▲ +98.3k last turn`. The forecast runs ☀ Clear (under 25%), ☁ Cloudy, ☂ Showers, ☇ Storm, and ↯ Compact soon (90%+), and includes a 12-turn block-character chart. It reads `$.session.usage()`, which matches the status line's `used_percentage`, and the call "is free". Try it with `claude --plugin-dir ./token-weather`. It needs 2.1.287+. — [token-weather README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather); [playground mods README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods)
- **statusline-anywhere** (2026-10-02, 4★) is a plugin, needing Claude Code 2.1.286+. It runs your existing `statusLine` command and draws the output, in color, *above the prompt in Claude Desktop*, which doesn't draw custom status lines (#41456). It stays out of the way in terminals and refreshes at session start, after replies, and every 60 s or every `refreshInterval`. It passes a subset of the JSON: `session_id`, `transcript_path`, `cwd`, `model`, `workspace`, `version`, cost total and duration, context fields, and `exceeds_200k_tokens`. Install: `claude plugin marketplace add NathanAB/statusline-anywhere && claude plugin install statusline-anywhere@statusline-anywhere`. — [statusline-anywhere](https://github.com/NathanAB/statusline-anywhere); [Show HN](https://news.ycombinator.com/item?id=49934608)
- Since launch, releases fixed regressions in the rows mods draw above the prompt. v2.1.288 fixed an "unrecoverable interface error" when a plugin or mod showed rows above the prompt. v2.1.289 fixed a zero-height plugin region that kept growing. v2.1.299 added `part: { plugin }` to `ui.render` trees in tests. — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Press coverage (XDA, 2026-10-13) describes a mod dashboard docked beside the conversation (tokens, cost, context, running tools). Claude's first attempt used "a status-line wrapper" with hooks, which the author rejected. The article also names community mods Code Pet and Session Wrapped (no links). — [XDA](https://xda-developers.com/claude-code-just-became-moddable-like-a-video-game)

### Inferences
- For a classic always-visible bar, the shell `statusLine` remains the right tool: it is portable, works with every community formatter, and has the richest payload (`prompt_cache`, `pr`, `worktree`, and so on). Mods are better for interactive, persistent, or graphical elements: buttons, panes, sparklines, rasters, Desktop support, and avoiding process spawns.
- The `⚠ mod-name:` prefix on `$.ui.status` lines makes them unsuitable as a styled status line replacement. The `AbovePrompt` band is the mods-era "second status bar" for richer layouts.
- Because `disableAllHooks` kills both mods and your status line, a "safe" config cannot keep one and drop the other through that switch.

### Gaps
- No community mod was found that fully replaces the terminal status line using `AbovePrompt`. Token Weather is a single-purpose band, and statusline-anywhere only acts outside terminals.
- I did not verify whether mods can read or rewrite the custom `statusLine` row itself (it is not listed as a render site).

---

## Wow / flex factor: the most visually impressive and show-off-worthy status lines

### Takeaway
For maximum flex with low effort, the strongest picks are **claude-powerline** (6 themes × 4 styles, including a bordered TUI panel, plus a web Studio) and **ccstatusline** (multi-line powerline with gradients, auto-alignment, and colors that continue across lines). **claude-hud** has the most stars of any status line and gives a live mini-dashboard of tools, agents, and todos. For pure eye candy, use Catppuccin or truecolor gradient bars (Awesome Statusline, kcchien, felipeelias presets) or a Starship Catppuccin Powerline via cship. Conversation starters include Ms. Pac-Man in the status line, Pomodoro timers, pets, and Anthropic's Token Weather mod. Every screenshot and GIF link below returned HTTP 200 on 2026-10-14.

### Cited Findings

**Top picks: polish and popularity**
1. **ccstatusline**
   - Why it impresses: Powerline flex mode right-aligns or absorbs width. Powerline auto-alignment spans lines, and built-in themes continue colors across lines. It supports per-widget and whole-line **gradient** foregrounds with hex stops, more than three powerline caps, custom Unicode separators, and unlimited lines. 13,286★; about 202.7k npm downloads/month.
   - Setup effort: **Low**. Run `npx -y ccstatusline@latest` and use the TUI with live preview; choose a pinned install.
   - Media: [demo GIF](https://raw.githubusercontent.com/sirmalloc/ccstatusline/main/screenshots/demo.gif) · [Powerline flex](https://raw.githubusercontent.com/sirmalloc/ccstatusline/main/screenshots/powerline-flex.png) · [auto-align](https://raw.githubusercontent.com/sirmalloc/ccstatusline/main/screenshots/autoAlign.png)
   - Source: [repo](https://github.com/sirmalloc/ccstatusline)
2. **claude-powerline**
   - Why it impresses: Four styles — minimal, powerline arrows, capsule rounded caps, and a **tui** bordered panel with grid templates — across 6 themes (dark, light, nord, tokyo-night, rose-pine, gruvbox). It adds a pace indicator on the 5h block and a cache-TTL countdown. **Powerline Studio** is a web visual configurator with live preview and export. Zero dependencies.
   - Setup effort: **Low**. Plugin plus the `/powerline` wizard. Unicode glyphs need a Nerd Font, or use `--charset=text`.
   - Media: [themes](https://raw.githubusercontent.com/Owloops/claude-powerline/main/images/claude-powerline-themes.png) · [styles](https://raw.githubusercontent.com/Owloops/claude-powerline/main/images/claude-powerline-styles.png) · [TUI demo GIF](https://raw.githubusercontent.com/Owloops/claude-powerline/main/images/demo-tui.gif) · [Studio GIF](https://raw.githubusercontent.com/Owloops/claude-powerline/main/images/powerline-studio.gif) · [Studio](https://powerline.owloops.com/)
   - Source: [repo](https://github.com/Owloops/claude-powerline)
3. **claude-hud**
   - Why it impresses: A HUD rather than a line. Color-shifting context and usage bars, with live activity rows for running tools, subagents with model and elapsed time, and todo progress (2/5). The optional `usagePace` turns windows amber or red with ▲ when you're on track to run out. 28,520★, the most of any project here.
   - Setup effort: **Low**. Four slash commands, then `/claude-hud:configure`.
   - Media: [preview 5:2](https://raw.githubusercontent.com/jarrodwatts/claude-hud/main/claude-hud-preview-5-2.png) · [preview 16:9](https://raw.githubusercontent.com/jarrodwatts/claude-hud/main/claude-hud-preview-16-9.png)
   - Source: [repo](https://github.com/jarrodwatts/claude-hud)

**Gradient and theme eye candy**
4. **Awesome Statusline** (awesomezun/claude-statusline)
   - Why it impresses: **Catppuccin gradient bars**, five size presets (xs–xl), and live ⚡effort and 💡thinking indicators, with no Nerd Font required. The README has a 30-second motion reel.
   - Setup effort: **Very low**. One-line `curl | bash`, or `irm | iex` on Windows.
   - Media: [reel GIF](https://raw.githubusercontent.com/awesomezun/claude-statusline/main/assets/reel.gif) · [presets](https://raw.githubusercontent.com/awesomezun/claude-statusline/main/assets/presets/presets.png)
   - Source: [repo](https://github.com/awesomezun/claude-statusline)
5. **kcchien/claude-code-statusline**
   - Why it impresses: A **24-bit gradient progress bar** from green through yellow to red, with "smart hiding" (a clean startup line), optional powerline arrows, and under 50 ms.
   - Setup effort: **Low**. Copy the script and install jq; set `CLAUDE_STATUSLINE_NERDFONT=1` for icons.
   - Media: [cover](https://raw.githubusercontent.com/kcchien/claude-code-statusline/main/docs/images/cover.jpeg)
   - Source: [repo](https://github.com/kcchien/claude-code-statusline)
6. **cship**
   - Why it impresses: Embeds real **Starship** modules, for example the Catppuccin Powerline preset with the `catppuccin_mocha` palette, next to Claude modules. Rust, with a "≤10ms render budget".
   - Setup effort: **Medium**. Installer, then TOML, and optionally Starship.
   - Media: [hero example](https://raw.githubusercontent.com/stephenleo/cship/main/docs/examples/01.png) · [minimal GIF](https://raw.githubusercontent.com/stephenleo/cship/main/docs/examples/03.gif)
   - Source: [repo](https://github.com/stephenleo/cship)
7. **felipeelias/claude-statusline**
   - Why it impresses: Starship-style presets: **pastel-powerline**, **tokyo-night** (rounded powerline with gradient), **gruvbox-rainbow**, and **catppuccin**. `claude-statusline themes` previews them all with mock data.
   - Setup effort: **Low**. `brew install`, then pick a preset.
   - Media: [screenshot](https://raw.githubusercontent.com/felipeelias/claude-statusline/main/assets/screenshot.webp)
   - Source: [repo](https://github.com/felipeelias/claude-statusline)
8. **claude-statusbar** (leeguooooo)
   - Why it impresses: **3 styles × 9 themes** (battery-bar, capsule, hairline) and a prompt-cache countdown. It can also float a HUD on the desktop app.
   - Setup effort: **Low**. Installer script.
   - Media: [hero GIF](https://raw.githubusercontent.com/leeguooooo/claude-code-usage-bar/main/docs/images/hero.gif)
   - Source: [repo](https://github.com/leeguooooo/claude-code-usage-bar)
9. **rz1989s/claude-code-statusline**
   - Why it impresses: Catppuccin Mocha, garden, and classic themes with a dense multi-segment layout: block metrics, burn rate, MCP status, prayer times.
   - Setup effort: **Medium**. Installer plus TOML.
   - Media: [demo GIF](https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/assets/screenshots/statusline-demo.gif) · [Catppuccin Mocha](https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/assets/screenshots/catppuccin-mocha-theme.png)
   - Source: [repo](https://github.com/rz1989s/claude-code-statusline)
10. **claude-code-statusline-pro (ccsp)**
    - Why it impresses: Classic, Powerline, and Capsule themes with gradient token bars, in Nerd Font, emoji, or text modes.
    - Media: [powerline](https://raw.githubusercontent.com/Wangnov/claude-code-statusline-pro/main/assets/powerline.png) · [capsule](https://raw.githubusercontent.com/Wangnov/claude-code-statusline-pro/main/assets/capsule.png)
    - Source: [repo](https://github.com/Wangnov/claude-code-statusline-pro)
11. **Other tools with screenshots:**
    - claudia-statusline (11 themes): [screenshot](https://raw.githubusercontent.com/hagan/claudia-statusline/main/statusline.png)
    - CCometixLine: [screenshot](https://raw.githubusercontent.com/Haleclipse/CCometixLine/master/assets/img1.png)
    - starship-claude: [screenshot](https://raw.githubusercontent.com/martinemde/starship-claude/main/screenshot.png)
    - TheoBrigitte (🟢🟡🔴 API status): [screenshot](https://raw.githubusercontent.com/TheoBrigitte/claude-statusline/main/assets/claude-statusline.png)
    - claude-pace (pace arrows): [GIF](https://raw.githubusercontent.com/Astro-Han/claude-pace/main/.github/claude-pace-demo.gif)
    - cc-statusline: [screenshot](https://raw.githubusercontent.com/chongdashu/cc-statusline/main/docs/images/cc-statusline.png)
    - daniel3303: [screenshot](https://raw.githubusercontent.com/daniel3303/ClaudeCodeStatusLine/main/screenshot.png)
    - kamranahmedse: [screenshot](https://raw.githubusercontent.com/nilbuild/claude-statusline/main/.github/demo.png)
    - Sources: the respective repos linked in section 2

**Gallery favorites (community-voted by copies or installs)**
- **Dreambase Panel**, a multi-line boxed terracotta panel, is the #1 copied design on statuslin.es (220 copies). **Pace Dot Meters** (93) and **Catppuccin Frappé** (66) follow, along with **Powerline Dracula** and **One Dark Triptych**, which has a rotating kaomoji. — [statuslin.es](https://statuslin.es/); Catppuccin Frappé rendered in Desktop: [image](https://raw.githubusercontent.com/NathanAB/statusline-anywhere/main/docs/desktop-status-line.png), [card](https://statuslin.es/c/catppuccin-frapp-88ba1499)
- On claudelines.com, the animated and novelty entries lead: **Cat Walk** (36 installs), **Fortnite Dance** (animated), **Plasma Field XL**, and **Captain Claude** (a sparkline graph). — [claudelines.com](https://claudelines.com/)

**Novelty and flex (conversation starters)**
- **claude-code-arcade**: "An arcade running in your Claude Code status line", with Ms. Pac-Man animated by a background daemon and a high score kept. The install script backs up your `statusLine`. 4★, 2026-08-30. — [repo](https://github.com/jystervinou/claude-code-arcade); [Ms. Pac-Man GIF](https://raw.githubusercontent.com/jystervinou/claude-code-arcade/main/docs/ms-pacman.gif); [Show HN](https://news.ycombinator.com/item?id=49514603)
- **Claudoro**: a Pomodoro countdown with a bar and session dots, the top-voted status-line Show HN (50 points). — [repo](https://github.com/emson/claudoro); [demo video](https://github.com/user-attachments/assets/cad66a27-6685-4aac-928e-a261caf0b510); [HN](https://news.ycombinator.com/item?id=48745590)
- **claude-code-tamagotchi**: a pet that "lives right in your statusline". `bunx claude-code-tamagotchi statusline`; needs Bun. — [repo](https://github.com/Ido-Levi/claude-code-tamagotchi)
- **catcode**: an ASCII cat with phrases generated by Haiku. This makes API calls, which are cached. — [repo](https://github.com/iamhenry/catcode)
- **claudinho**: live football scores, 30★. — [repo](https://github.com/arturogarrido/claudinho)
- **Token Weather** (Anthropic sample mod): weather-icon context forecast with a ▁▂█ sparkline of the last 12 turns in the band above the prompt. — [token-weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather)
- **Official building blocks for DIY flex**:
  - Multi-line output, truecolor ANSI, and OSC 8 clickable repo or PR links. — [Status line docs](https://code.claude.com/docs/en/statusline)
  - `refreshInterval` for ticking clocks and countdowns. — [Status line docs](https://code.claude.com/docs/en/statusline)
  - `prompt_cache.expires_at` and `rate_limits.*.resets_at` re-render triggers, which make cache and limit countdowns exact. — [Status line docs](https://code.claude.com/docs/en/statusline)
  - `subagentStatusLine`'s `tokenSamples`, the last 16 readings per subagent, for per-agent sparklines. — [Status line docs](https://code.claude.com/docs/en/statusline)
  - In mods: `Raster` grids (up to 512×256 colored cells), PNG `Image`, and bordered `Box` panels. — [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)

### Inferences
- Best low-effort "wow" path: claude-powerline in `tui` or `capsule` style with the tokyo-night or rose-pine theme, or ccstatusline with a 2–3 line powerline plus gradient. Add `refreshInterval: 1–10` so timers tick. For the "flex" element, add claude-hud-style activity lines or Token Weather in the band above the prompt. Keep an ASCII fallback because of the Nerd Font PUA issue.
- Animated status lines (arcade, dance, ticking timers) depend on `refreshInterval` (at least 1 s) or a daemon, so expect at most about 1 fps updates and some CPU cost. That is an inference from the documented minimum interval.

### Gaps
- Awesome Statusline's README links an "interactive live demo" at `awesomejun.github.io/CC-statusline/`. It returned 404 on 2026-10-14, as did the guessed renamed URLs, probably because the repo was renamed.
- The star count for claude-code-tamagotchi could not be retrieved (connection reset). Its description now emphasizes "behavioral enforcement… Also has a cute pet."
- No Reddit or X showcase threads were accessible, so "most praised" rests on GitHub stars, npm downloads, gallery copy counts, and HN points.
