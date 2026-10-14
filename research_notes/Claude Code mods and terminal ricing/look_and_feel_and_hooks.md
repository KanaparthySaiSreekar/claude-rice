# Claude Code look-and-feel settings and hook-based UX enhancements (as of October 14, 2026)

## Q1. Built-in appearance and UX settings: every knob that changes how Claude Code looks, feels and keeps you informed

### Takeaway
As of v2.1.299 (released 2026-10-14), Claude Code ships a large set of first-party "ricing" knobs, most of them in `settings.json`. They include 7 theme presets plus hand-editable custom JSON themes with 60+ documented color tokens, five built-in output styles plus custom Markdown styles, `spinnerVerbs` and `spinnerTipsOverride`, the `tui` renderer switch (classic vs flicker-free fullscreen), `viewMode`/`verbose` transcript views, `prefersReducedMotion`, `preferredNotifChannel`, `terminalProgressBarEnabled`, `maxProseWidth`, `timeFormat`, emoji shortcodes, spellcheck, vim mode and a full `~/.claude/keybindings.json` remapper. A few knobs live in `~/.claude.json` instead, and about 20 UX environment variables fine-tune rendering and accessibility. Most of these keys are recent (late 2025 to fall 2026), so guides from before mid-2026 are often out of date.

### Cited Findings

#### Version baseline and where settings live
- The latest Claude Code release is 2.1.299, published 2026-10-14. npm dist-tags: `latest` = 2.1.299, `stable` = 2.1.287, `next` = 2.1.300. — [npm registry metadata](https://registry.npmjs.org/@anthropic-ai/claude-code)
- Settings files by scope: user `~/.claude/settings.json`, project `.claude/settings.json`, local `.claude/settings.local.json`, plus managed settings (`managed-settings.json`, MDM, or the claude.ai console). — [Settings](https://code.claude.com/docs/en/settings)
- Some UX keys are "global config" keys. They are read only from `~/.claude.json` and ignored in `settings.json`: `copyOnSelect`, `copyFullResponse`, `externalEditorContext`, `prStatusFooterEnabled`, `diffTool`, `leftArrowOpensAgents`, `defaultToAgentsView`, `autoConnectIde`, `autoInstallIdeExtension`, `claudeInChromeDefaultEnabled`. — [Settings reference: Global config settings](https://code.claude.com/docs/en/settings-reference#global-config-settings)
- `CLAUDE_CODE_SAFE_MODE=1` starts a session with all of these turned off: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands/agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory. It is meant for troubleshooting a broken configuration, which makes it a good way to bisect a broken "rice". — [Env vars](https://code.claude.com/docs/en/env-vars)
- Mods (launched v2.1.287, 2026-10-01: "Added Claude Mods: plugins may now modify deeper behavior") can restyle or replace parts of the UI that Claude Code draws itself, including the `Spinner`, `ToolProgress` and `TurnDuration` render sites through a `ui.render` hook. Mods are out of scope for these notes beyond this interplay. — [CHANGELOG 2.1.287](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [Mods: Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)

#### Themes (`/theme`, `theme` key, custom JSON themes)
- `theme` accepts: `"auto"` (matches the terminal's light or dark background), `"dark"` (default), `"light"`, `"dark-daltonized"`, `"light-daltonized"` (colorblind-friendly), `"dark-ansi"`, `"light-ansi"` (use only the terminal's ANSI palette), and `"custom:<slug>"` or `"custom:<plugin-name>:<slug>"`. It appears in `/config` as **Theme**. — [Settings reference: theme](https://code.claude.com/docs/en/settings-reference#theme)
- Custom themes are JSON files in `~/.claude/themes/`. The filename slug becomes `custom:<slug>`. Each file has three optional fields:
  - `name`: display label.
  - `base`: one of the six presets, default `dark`.
  - `overrides`: token-to-color map.

  Colors can be `#rrggbb`, `#rgb`, `rgb(r,g,b)`, `ansi256(n)` or `ansi:<name>`, for example `ansi:cyanBright`. Unknown tokens and invalid values are ignored. — [Terminal config: Create a custom theme](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)
- Ways to create or edit a theme:
  - In `/theme`, select **New custom theme…**, or press `Ctrl+E` on a highlighted custom theme. The editor has a live preview.
  - Edit the JSON by hand. Claude Code watches `~/.claude/themes/` and reloads when files change, so no restart is needed. The exception is the first time you create the folder, which needs one restart. — [Terminal config](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)
- Official example, copy-pasteable:
  ```json
  // ~/.claude/themes/dracula.json
  { "name": "Dracula", "base": "dark",
    "overrides": { "claude": "#bd93f9", "error": "#ff5555", "success": "#50fa7b" } }
  ```
  A second example, `midnight.json`, overrides `claude`, `planMode`, `diffAdded`, `diffRemoved` and `userMessageBackground`. — [Terminal config](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)
- Theme color tokens, by group. — [Terminal config: color token reference](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)
  - **Text and accent:** `claude` (spinner and assistant label), `text`, `inverseText`, `inactive`, `subtle`, `suggestion`, `permission`, `remember`.
  - **Status:** `success`, `error`, `warning`, `merged`.
  - **Input and mode indicators:** `promptBorder`, `planMode`, `autoAccept`, `bashBorder`, `ide`, `fastMode`, `effortUltra`.
  - **Diff:** `diffAdded`, `diffRemoved`, `diffAddedDimmed`, `diffRemovedDimmed`, `diffAddedWord`, `diffRemovedWord`.
  - **Transcript backgrounds:** `userMessageBackground`, `userMessageBackgroundHover`, `bashMessageBackgroundColor`, `memoryBackgroundColor`, `selectionBg`. The hover and selection tokens apply in fullscreen only.
  - **Usage meter and speaker labels:** `rate_limit_fill`, `rate_limit_empty`, `briefLabelYou`, `briefLabelClaude`.
  - **Shimmer pairs:** `claude`/`claudeShimmer`, `warning`/`warningShimmer`, `permission`/`permissionShimmer`, `promptBorder`/`promptBorderShimmer`, `inactive`/`inactiveShimmer`, `fastMode`/`fastModeShimmer`.
  - **Subagent colors:** `<color>_FOR_SUBAGENTS_ONLY`, where `<color>` is red, blue, green, yellow, purple, orange, pink or cyan.
  - **`ultrathink` rainbow:** `rainbow_<color>` and `rainbow_<color>_shimmer`, where `<color>` is red, orange, yellow, green, blue, indigo or violet.
- Plugins can ship themes in a `themes/` directory (for example `themes/dracula.json`). Those themes appear in `/theme`. — [Terminal config](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme); [CHANGELOG 2.1.118](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Version history:
  - Custom named themes and `~/.claude/themes/` arrived in v2.1.118 (2026-04-22).
  - "Auto (match terminal)" arrived in v2.1.111 (2026-04-16).
  - `Ctrl+T` in `/theme` toggles syntax highlighting since v2.0.74 (2025-12-19).
  - The theme picker became a scrolling list in v2.1.286 (2026-09-30), and number keys no longer pick a theme.
  - Custom theme diff colors were ignored until v2.1.246 (2026-08-25).

  — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [npm dates](https://registry.npmjs.org/@anthropic-ai/claude-code)
- Claude Code does not control the terminal emulator's own color scheme. Match them with `auto` or the `*-ansi` presets. — [Terminal config: Match the color theme](https://code.claude.com/docs/en/terminal-config#match-the-color-theme)
- Syntax highlighting:
  - `syntaxHighlightingDisabled: true` turns off highlighting in diffs, code blocks and file previews.
  - `CLAUDE_CODE_SYNTAX_HIGHLIGHT=false` disables it in diffs only.

  — [Settings reference](https://code.claude.com/docs/en/settings-reference#syntaxhighlightingdisabled); [Env vars](https://code.claude.com/docs/en/env-vars)
- `/color [red|blue|green|yellow|purple|orange|pink|cyan|default]` sets the prompt-bar color for the session. With no argument it picks a random color. With Remote Control connected, the color syncs to claude.ai/code. `/color` became available to all users in v2.1.75 (2026-03-13). — [Commands](https://code.claude.com/docs/en/commands); [CHANGELOG 2.1.75 / 2.1.128](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

#### `/config` and the settings it writes
- `/config` opens the Settings UI. `/config key=value ...` sets values directly, for example `/config theme=dark` or `/config model=sonnet`. The `key=value` form also works in `-p` mode and over Remote Control. — [Commands](https://code.claude.com/docs/en/commands)
- `/config` row labels and the keys they write:

  | `/config` row | Settings key |
  | :- | :- |
  | **Theme** | `theme` |
  | **Editor mode** | `editorMode` |
  | **Reduce motion** | `prefersReducedMotion` |
  | **Show tips** | `spinnerTipsEnabled` |
  | **Show turn duration** | `showTurnDuration` |
  | **Terminal progress bar** | `terminalProgressBarEnabled` |
  | **Verbose output** | `verbose` |
  | **Local notifications** | `preferredNotifChannel` |
  | **Push when Claude decides** | `agentPushNotifEnabled` |
  | **Push when actions required** | `inputNeededNotifEnabled` |
  | **Auto-scroll** (fullscreen only) | `autoScrollEnabled` |
  | **Copy on select** | `copyOnSelect` |
  | **Skip the /copy picker** | `copyFullResponse` |
  | **Show last response in external editor** | `externalEditorContext` |
  | **Show PR status footer** | `prStatusFooterEnabled` |
  | **Respect .gitignore in file picker** | `respectGitignore` |
  | **Question auto-continue timeout** | `askUserQuestionTimeout` |
  | **Dialog expiry** | `dialogExpiry` |
  | **Continue automatically at usage limit** | `autoContinueAtUsageLimit` |
  | **← opens agents** | `leftArrowOpensAgents` |
  | **Open agents view by default** | `defaultToAgentsView` |
  | **Diff tool** | `diffTool` |
  | **Auto-compact** | `autoCompactEnabled` |
  | **Rewind code (checkpoints)** | `fileCheckpointingEnabled` |

  Other UX rows: **Output style**, **Prompt suggestions** (`promptSuggestionEnabled`), **Session recap** (`awaySummaryEnabled`), **Time format** (`timeFormat`). — [Settings reference](https://code.claude.com/docs/en/settings-reference) (extracted from every "Appears in `/config` as" line)
- Clicking a value in the `/config` panel and scrolling it with the mouse wheel works in fullscreen rendering since v2.1.271. — [Fullscreen](https://code.claude.com/docs/en/fullscreen#use-the-mouse)

#### Output styles (built-ins, custom files, collections)
- There are four built-in styles besides **Default**:
  - **Proactive**: starts work immediately, assumes routine decisions, and doesn't switch to plan mode unless asked.
  - **Concise**: leads with the result and drops preamble and recaps. Requires v2.1.237 (2026-08-19).
  - **Explanatory**: adds `★ Insight` blocks.
  - **Learning**: adds Insights and leaves `TODO(human)` spots for you to code ("● Learn by Doing").

  — [Output styles](https://code.claude.com/docs/en/output-styles); [CHANGELOG 2.1.237](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Ways to switch style:
  - `/output-style <style>` (v2.1.269+, 2026-09-11). It ignores case and also works in `-p`, the SDK and Remote Control.
  - `/config` → **Output style**. Both the command and the menu save to `.claude/settings.local.json`.
  - Set `"outputStyle": "Explanatory"` in a settings file. The value is case-sensitive, so `explanatory` silently gives you Default.
  - Put `outputStyle` in `~/.claude/settings.json` to make it the default everywhere.

  Since v2.1.251, a mid-session switch applies from your next message. Before that, it needed `/clear`. — [Output styles](https://code.claude.com/docs/en/output-styles#change-your-output-style)
- Custom style files are Markdown with YAML frontmatter, stored in one of:
  - user: `~/.claude/output-styles/`
  - project: `.claude/output-styles/` (nearest directory wins)
  - managed: `.claude/output-styles` inside the managed settings directory
  - plugins: an `output-styles/` directory

  Frontmatter fields:
  - `name`
  - `description`
  - `keep-coding-instructions` (default `false`; without it a custom style drops Claude Code's built-in software-engineering instructions)
  - `force-for-plugin` (plugin styles only: auto-applies and overrides the user's `outputStyle`)

  The terminal reads style files at startup, so restart after editing. — [Output styles: Create a custom output style](https://code.claude.com/docs/en/output-styles#create-a-custom-output-style)
- Official custom style example:
  ```markdown
  ---
  name: Diagrams first
  description: Lead every explanation with a diagram
  keep-coding-instructions: true
  ---
  When explaining code, architecture, or data flow, start with a Mermaid diagram showing the structure, then explain in prose.
  ```
  — [Output styles](https://code.claude.com/docs/en/output-styles#create-a-custom-output-style)
- Output styles apply to the main conversation and to forks. Other subagents use their own system prompts and ignore the style. Explanatory and Learning raise output-token use, and Concise lowers it. — [Output styles: How output styles work](https://code.claude.com/docs/en/output-styles#how-output-styles-work)
- History:
  - Output styles shipped in v1.0.81 (2025-08-14), with Explanatory and Learning.
  - They were deprecated in v2.0.30 (2025-10-30), then un-deprecated "based on community feedback" in v2.0.32 (2025-11-03).
  - During that window Anthropic published plugins that mimic the styles through a SessionStart hook: `explanatory-output-style` and `learning-output-style`, in `anthropics/claude-code/plugins`.

  — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [anthropics/claude-code plugins README](https://github.com/anthropics/claude-code/tree/main/plugins)
- Community collections:
  - [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) ships `genui` (generates styled HTML), `table-based`, `yaml-structured`, `bullet-points`, `ultra-concise`, `html-structured`, `markdown-focused` and `tts-summary`. Activate one with `/output-style <name>`. — [repo README](https://github.com/disler/claude-code-hooks-mastery)
  - [hesreallyhim/awesome-claude-code-output-styles-that-i-really-like](https://github.com/hesreallyhim/awesome-claude-code-output-styles-that-i-really-like) has persona styles such as Zen Master (bugs as koans), Tabloid Journalist (every commit is breaking news), Technical Evangelist and Existential Poet. It has 86 stars, MIT license, and its last commit was in Nov 2025. Its README notes that output styles "turn off" the software-engineering parts of the system prompt. — [repo README](https://github.com/hesreallyhim/awesome-claude-code-output-styles-that-i-really-like); stars and date via shields.io, 2026-10-14

#### Spinner verbs, spinner tips and the turn-duration line
- `spinnerVerbs` is `{ "mode": "append" | "replace", "verbs": [...] }`. In `replace` mode with an empty array, Claude Code keeps the built-in verbs. It was added in v2.1.23 (2026-01-29).
  ```json
  { "spinnerVerbs": { "mode": "append", "verbs": ["Pondering", "Crafting"] } }
  ```
  — [Settings reference: spinnerVerbs](https://code.claude.com/docs/en/settings-reference#spinnerverbs); [CHANGELOG 2.1.23](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Interactions with the past-tense turn-duration line:
  - v2.1.141 and v2.1.144 fixed custom verbs leaking into it. The built-in past-tense verbs, like "Worked for 5s", stay there.
  - VS Code gained `claudeCode.spinnerVerbs` validation in v2.1.296.
  - Teammate spinners honor custom verbs since v2.1.47.

  — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- The built-in list has 185 default verbs, for example "Accomplishing", "Beboppin'", "Boondoggling", "Canoodling". This count comes from a community collection. — [wynandw87/claude-code-spinner-verbs](https://github.com/wynandw87/claude-code-spinner-verbs)
- Spinner tips:
  - `spinnerTipsEnabled: false` hides them. It was added in v1.0.112 (2025-09-12) and appears in `/config` as **Show tips**.
  - `spinnerTipsOverride` takes these fields:
    - `tips`: plain strings, or objects `{id, text, cooldownSessions 0–1000, priority -10..10}`.
    - `tipsFile`: path to a JSON file, up to 256 KB.
    - `label`: the prefix, up to 40 characters, default `Tip`.
    - `excludeDefault`: set `true` to show only your own tips.
  - Claude Code reads at most 200 tips. Project and local settings may contribute plain strings only. Objects, `tipsFile` and `label` require v2.1.247 (2026-08-26). The setting itself was added in v2.1.45 (2026-02-17).

  — [Settings reference: spinnerTipsOverride](https://code.claude.com/docs/en/settings-reference#spinnertipsoverride); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
  ```json
  { "spinnerTipsOverride": { "label": "Acme tip", "tips": [
      "Run /review before opening a PR",
      { "id": "gateway-errors", "text": "Seeing 5xx errors? Check the gateway status page first", "cooldownSessions": 5, "priority": 2 } ] } }
  ```
- `showTurnDuration` (default `true`, added v2.1.7) controls the end-of-turn line, for example `✻ Sautéed for 23s · done 6:05 PM`. The completion clock was added in v2.1.246.
  - `timeFormat` accepts `"auto"`, `"12-hour"`, `"24-hour"`, `"24-hour-utc"` or a strftime pattern such as `"%H:%M"`.
  - `timeZone` takes an IANA name. Both were added in v2.1.257 (2026-09-01).

  — [Settings reference](https://code.claude.com/docs/en/settings-reference#showturnduration); [CHANGELOG 2.1.246 / 2.1.257](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- A hook's `statusMessage` field sets a custom spinner message while that hook runs. — [Hooks reference: hook handler fields](https://code.claude.com/docs/en/hooks)

#### Terminal title, progress bar and session status
- Claude Code sets the terminal tab title, generated from the conversation. Once you name the session with `/rename` or `--name`/`-n`, the tab shows that name.
  - `terminalTitleFromRename: false` keeps the generated title instead.
  - `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` stops all title updates. It also skips the small-model title request and turns off OSC 7501 status reports.

  — [Settings reference: terminalTitleFromRename](https://code.claude.com/docs/en/settings-reference#terminaltitlefromrename); [Env vars](https://code.claude.com/docs/en/env-vars)
- Title history:
  - v2.1.6: the startup title is "Claude Code".
  - v2.1.47 (2026-02-18): `/rename` updates the tab title.
  - v2.1.145 (2026-05-19): the `claude agents` tab title shows the count of sessions awaiting input.
  - v2.1.228: the busy-spinner glyphs in the title were changed to reduce jitter.
  - v2.1.236: under tmux, the title is written only when it changes.

  — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- `terminalProgressBarEnabled` (default `true`) reports an in-progress state (OSC 9;4) that shows in the tab or taskbar. Supported terminals: ConEmu, Ghostty 1.2.0+ and iTerm2 3.6.6+. It stays visible while background subagents run. It was added in v2.0.56 (2025-12-01). — [Settings reference](https://code.claude.com/docs/en/settings-reference#terminalprogressbarenabled); [CHANGELOG 2.0.56](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- OSC 7501 Program Status Protocol (v2.1.295, 2026-10-08):
  - Terminals that implement it can show whether each session is working, waiting on you or done. Nothing needs to be turned on.
  - It doesn't work under tmux, for background sessions, or with `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`.
  - A secondary write-up says Mitchell Hashimoto proposed OSC 7501, with states idle, working, blocked, done and error, and that Ghostty implements it.

  — [Terminal config: See session status](https://code.claude.com/docs/en/terminal-config#see-session-status-in-your-terminal); [CHANGELOG 2.1.295](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [zeli.app summary (secondary)](https://zeli.app/story/49984159)
- Under tmux, add the following to `~/.tmux.conf` so notifications and the progress bar reach the outer terminal and Shift+Enter works:
  ```bash
  set -g allow-passthrough on
  set -s extended-keys on
  set -as terminal-features 'xterm*:extkeys'
  ```
  Notification passthrough under tmux arrived in v2.1.78. — [Terminal config: Configure tmux](https://code.claude.com/docs/en/terminal-config#configure-tmux); [CHANGELOG 2.1.78](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

#### Built-in notifications (bell, desktop, phone)
- `preferredNotifChannel` (`/config` → **Local notifications**) accepts:
  - `"auto"` (default): desktop notification in iTerm2, Ghostty and Kitty; in Terminal.app, a bell only when Terminal's audible bell is off; nothing elsewhere.
  - `"terminal_bell"`
  - `"iterm2"`
  - `"iterm2_with_bell"`
  - `"kitty"`
  - `"ghostty"`
  - `"notifications_disabled"`

  — [Settings reference: preferredNotifChannel](https://code.claude.com/docs/en/settings-reference#preferrednotifchannel)
- The desktop notification reaches your local machine over SSH. Ghostty and Kitty forward it with no setup. iTerm2 needs Settings → Profiles → Terminal → "Notification Center Alerts" → Filter Alerts → "Send escape sequence-generated alerts". Warp and the VS Code terminal get no desktop notification; use `"terminal_bell"` or a Notification hook there. — [Terminal config: Get a terminal bell or notification](https://code.claude.com/docs/en/terminal-config#get-a-terminal-bell-or-notification)
- Phone push (built in, requires Remote Control and the Claude mobile app):
  - `agentPushNotifEnabled` (**Push when Claude decides**) sends a push, for example when a long task finishes.
  - `inputNeededNotifEnabled` (**Push when actions required**) sends a push when a permission prompt or question is waiting.
  - Pushes are skipped while you're typing in or focused on the terminal.
  - `CLAUDE_CLIENT_PRESENCE_FILE` names a marker file. While the file exists, pushes are suppressed, for example while your screen is unlocked.

  — [Remote Control: Mobile push notifications](https://code.claude.com/docs/en/remote-control#mobile-push-notifications); [Settings reference](https://code.claude.com/docs/en/settings-reference#agentpushnotifenabled)
- There is a built-in `PushNotification` tool. By default it skips the desktop notification and the mobile push while you're active; `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK=1` disables that check. — [Env vars](https://code.claude.com/docs/en/env-vars)

#### Transcript views: verbose, focus, transcript viewer, thinking
- `verbose` (`/config` → **Verbose output**, default `false`; `--verbose` per session) shows full tool input and output inline. — [Settings reference: verbose](https://code.claude.com/docs/en/settings-reference#verbose)
- `viewMode` sets the starting transcript view and overrides both `verbose` and the sticky `/focus` choice. Values:
  - `"default"`
  - `"verbose"`
  - `"focus"`: last prompt, a one-line tool summary with edit diffstats, and the final response. Needs the fullscreen renderer.

  — [Settings reference: viewMode](https://code.claude.com/docs/en/settings-reference#viewmode)
- `Ctrl+O` toggles the transcript viewer (`app:toggleTranscript`). It moved from `Ctrl+R` in v1.0.113.
  - Viewer keys: `/` search, `n`/`N`, `j`/`k`, `g`/`G`, `{`/`}` jump between prompts, `Ctrl+U`/`Ctrl+D`, `[` dump to native scrollback, `v` open in `$EDITOR`, `?` help, and `q`/`Esc` exit.
  - Some keys need fullscreen. `Ctrl+E` (show all) works in the classic renderer only.
  - `/focus` toggles focus view. It was added in v2.1.110 (2026-04-15) and works in fullscreen only.

  — [Interactive mode: Transcript viewer](https://code.claude.com/docs/en/interactive-mode#transcript-viewer); [Fullscreen: Search and review](https://code.claude.com/docs/en/fullscreen#search-and-review-the-conversation); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- `showThinkingSummaries: true` shows full thinking summaries when you expand with `Ctrl+O`. Otherwise the API redacts them to a collapsed stub. — [Settings reference](https://code.claude.com/docs/en/settings-reference#showthinkingsummaries)
- Session recap:
  - `awaySummaryEnabled` (default on; `/config` → **Session recap**) shows a one-line recap when you return after about 3 minutes or more away.
  - `/recap` generates one on demand. Output is capped at 400 characters.
  - `CLAUDE_CODE_ENABLE_AWAY_SUMMARY` overrides the setting.
  - Added in v2.1.108 (2026-04-14).

  — [Interactive mode: Session recap](https://code.claude.com/docs/en/interactive-mode#session-recap); [CHANGELOG 2.1.108](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

#### Reduced motion and accessibility
- `prefersReducedMotion: true` (`/config` → **Reduce motion**) reduces or turns off the spinner, shimmer and flash animations. It was added in v2.1.30 (2026-02-03). Animations that still moved were fixed in v2.1.161 and v2.1.287, and the VS Code indicator in v2.1.296. — [Settings reference](https://code.claude.com/docs/en/settings-reference#prefersreducedmotion); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Screen reader mode gives flat text with no borders or animations, and always uses the classic renderer. Turn it on with any of:
  - `--ax-screen-reader`
  - `CLAUDE_AX_SCREEN_READER=1`
  - `"axScreenReader": true`

  The changelog says it was added in v2.1.208 (2026-07-13). The env-var docs say `CLAUDE_AX_SCREEN_READER` "Requires Claude Code v2.1.181 or later". Related variables: `CLAUDE_AX_STARTUP_QUIET_MS`, `CLAUDE_AX_PREPARK_MS`. — [Accessibility](https://code.claude.com/docs/en/accessibility); [CHANGELOG 2.1.208](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [Env vars](https://code.claude.com/docs/en/env-vars)
- Cursor and magnifier variables:
  - `CLAUDE_CODE_ACCESSIBILITY=1` keeps the native cursor visible for magnifiers.
  - `CLAUDE_CODE_NATIVE_CURSOR=1` uses the terminal's own cursor, with its blink and shape, instead of a drawn block.

  — [Env vars](https://code.claude.com/docs/en/env-vars)

#### Rendering modes (classic vs fullscreen) and flicker knobs
- `tui`: `"default"` is the classic main-screen renderer; `"fullscreen"` is the flicker-free alt-screen renderer with virtualized scrollback and mouse support. `/tui fullscreen` or `/tui default` writes the key and relaunches with the conversation intact. `/tui` was added in v2.1.110.
  - `CLAUDE_CODE_NO_FLICKER=1` forces fullscreen. It was added in v2.1.89 (2026-03-31).
  - `CLAUDE_CODE_NO_FLICKER=0` or `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` (v2.1.132) forces classic.
  - Fullscreen is still labeled a research preview.

  — [Settings reference: tui](https://code.claude.com/docs/en/settings-reference#tui); [Fullscreen](https://code.claude.com/docs/en/fullscreen); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Default renderer: users who first used Claude Code on or after May 6, 2026 (with feature flags on) start in fullscreen. Classic is forced for iTerm2 `tmux -CC` and for SSH to Windows. Classic users may see a one-time offer to switch, shown at most 3 times. — [Fullscreen: Fullscreen by default](https://code.claude.com/docs/en/fullscreen#fullscreen-by-default)
- Fullscreen behavior:
  - The input box stays fixed at the bottom.
  - Mouse: click to place the cursor, click to expand tool output, and `Cmd`/`Ctrl`-click URLs and file paths.
  - Selection copies on mouse release (`copyOnSelect`, set in `~/.claude.json`).
  - `/diff` opens a side panel.
  - `Ctrl+L` redraws.

  — [Fullscreen](https://code.claude.com/docs/en/fullscreen#use-the-mouse)
- Fullscreen tuning:
  - `autoScrollEnabled` (follow output)
  - `wheelScrollAccelerationEnabled`
  - `/scroll-speed` (v2.1.139)
  - `CLAUDE_CODE_SCROLL_SPEED` (up to 20; `3` matches vim)
  - `CLAUDE_CODE_DISABLE_MOUSE=1`: keeps native selection
  - `CLAUDE_CODE_DISABLE_MOUSE_CLICKS=1` (v2.1.195): wheel scrolling only
  - `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT=1`: fixes stale fragments
  - `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL=1`: fixes blank regions

  — [Fullscreen](https://code.claude.com/docs/en/fullscreen); [Env vars](https://code.claude.com/docs/en/env-vars)
- If flicker is the only problem and the terminal supports synchronized output but isn't detected (for example Emacs `eat`), set `CLAUDE_CODE_FORCE_SYNC_OUTPUT=1` (v2.1.129). tmux releases through 3.6 lack synchronized output, so expect more flicker under tmux. — [Terminal config](https://code.claude.com/docs/en/terminal-config#switch-to-fullscreen-rendering); [Fullscreen: Use with tmux](https://code.claude.com/docs/en/fullscreen#use-with-tmux)
- `maxProseWidth` (whole number ≥ 40, v2.1.282, 2026-09-24) caps the width of paragraphs, headings and lists. Tables and code blocks keep the full width. — [Settings reference](https://code.claude.com/docs/en/settings-reference#maxprosewidth)
- Other rendering variables:
  - `CLAUDE_CODE_TMUX_TRUECOLOR=1`: truecolor under tmux; the default clamps to 256 colors.
  - `FORCE_HYPERLINK=1|0`: OSC 8 links.
  - `CLAUDE_CODE_FORCE_STRIKETHROUGH=1`
  - `CLAUDE_CODE_HIDE_CWD=1`: hides the path in the startup logo.
  - `IS_DEMO=1`: hides email and org, for streaming.

  — [Env vars](https://code.claude.com/docs/en/env-vars)

#### Keybindings (`~/.claude/keybindings.json`)
- `/keybindings` creates or opens `~/.claude/keybindings.json`. Changes apply live, with no restart. Keybindings were introduced in v2.1.18 (2026-01-22). — [Keybindings](https://code.claude.com/docs/en/keybindings); [CHANGELOG 2.1.18](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Format: an object with optional `$schema` and `$docs`, plus a `bindings` array of `{context, bindings: {keystroke: action|null}}`. Setting an action to `null` unbinds the key. Official example:
  ```json
  { "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
    "$docs": "https://code.claude.com/docs/en/keybindings",
    "bindings": [ { "context": "Chat", "bindings": { "ctrl+e": "chat:externalEditor", "ctrl+s": null } } ] }
  ```
  — [Keybindings](https://code.claude.com/docs/en/keybindings#configuration-file)
- Contexts: Global, Chat, Autocomplete, Settings, Confirmation, Tabs, Help, Transcript, HistorySearch, Task, ThemePicker, Attachments, Footer, MessageSelector, DiffDialog, DiffPanel, ModelPicker, EffortSlider, Select, Plugin, AbovePrompt, AbovePromptInput, AbovePromptSelect, Pane, PaneField, Agents, Scroll. — [Keybindings: Contexts](https://code.claude.com/docs/en/keybindings#contexts)
- Notable actions and their default keys:

  | Action | Default |
  | :- | :- |
  | `app:toggleTodos` | Ctrl+T |
  | `app:toggleTranscript` | Ctrl+O |
  | `app:redraw` | unbound |
  | `chat:submit` | Enter |
  | `chat:newline` | Ctrl+J |
  | `chat:externalEditor` | Ctrl+G or Ctrl+X Ctrl+E |
  | `chat:stash` | Ctrl+S |
  | `chat:modelPicker` | Meta+P |
  | `chat:thinkingToggle` | Meta+T |
  | `chat:fastMode` | Meta+O |
  | `chat:cycleMode` | Shift+Tab |
  | `chat:queueSubmit` | Ctrl+X Enter |
  | `chat:killAgents` | Ctrl+X Ctrl+K |
  | `theme:toggleSyntaxHighlighting` | Ctrl+T in ThemePicker |
  | `voice:pushToTalk` | Space |

  Chords are space-separated, for example `"ctrl+k ctrl+s"`, with a 3-second gap allowed between keys. Special keys include `wheelup` and `wheeldown`. — [Keybindings](https://code.claude.com/docs/en/keybindings#available-actions)
- Reserved, not rebindable: Ctrl+C, Ctrl+D, Ctrl+M (Enter), Ctrl+[ (Esc), Ctrl+I (Tab), Ctrl+H. Known conflicts: Ctrl+B (tmux prefix), Ctrl+A (screen), Ctrl+Z (suspend). Invalid entries only log debug warnings. — [Keybindings: Reserved shortcuts](https://code.claude.com/docs/en/keybindings#reserved-shortcuts)
- Two behavior changes to know about:
  - Since v2.1.280, a stray `y`/`n` no longer confirms or closes dialogs. The changelog says to bind `y`/`n` to `confirm:yes`/`confirm:no` to restore it.
  - `keybindingFlavor` is deprecated since v2.1.261; `Ctrl+W` always follows readline conventions now.

  — [CHANGELOG 2.1.280](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [Settings reference: keybindingFlavor](https://code.claude.com/docs/en/settings-reference#keybindingflavor)

#### Vim mode
- Turn it on with `editorMode: "vim"` or `/config` → **Editor mode**. The `/vim` command was removed in v2.1.92 (2026-04-04). Vim bindings date back to v0.2.34 (2025-03-08). — [Settings reference: editorMode](https://code.claude.com/docs/en/settings-reference#editormode); [Commands](https://code.claude.com/docs/en/commands); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- `vimInsertModeRemaps` (user or managed scope only, v2.1.208) maps two-character INSERT sequences to Esc, for example `{"jj": "<Esc>"}`. Vim motions aren't remappable through keybindings.json. — [Settings reference](https://code.claude.com/docs/en/settings-reference#viminsertmoderemaps); [Terminal config: Vim](https://code.claude.com/docs/en/terminal-config#edit-prompts-with-vim-keybindings)
- Behavior notes:
  - Enter still submits in INSERT mode. Use `o`/`O` or Ctrl+J for a newline.
  - In NORMAL mode, `/` opens history search and `?` opens help.
  - The status line can hide the built-in vim mode indicator with `statusLine.hideVimModeIndicator`.
  - Many vim fidelity fixes landed in v2.1.282–2.1.295.

  — [Keybindings: Vim mode interaction](https://code.claude.com/docs/en/keybindings#vim-mode-interaction); [Settings reference: statusLine](https://code.claude.com/docs/en/settings-reference#statusline); [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

#### `/terminal-setup`
- What `/terminal-setup` does per terminal:
  - **VS Code, Cursor, Devin Desktop, Alacritty < 0.16, Zed:** installs a Shift+Enter newline binding. Zed's `keymap.json` is merged with a backup.
  - **VS Code, Cursor, Devin Desktop:** also sets `terminal.integrated.gpuAcceleration: "off"` and a scroll sensitivity.
  - **Apple Terminal:** enables Option as Meta and turns off the audible bell (left on in screen reader mode since v2.1.211).
  - **iTerm2:** enables clipboard access so `/copy` works.

  Run it in the host terminal, not inside tmux. — [Terminal config: Enter multiline prompts](https://code.claude.com/docs/en/terminal-config#enter-multiline-prompts); [Commands](https://code.claude.com/docs/en/commands)
- Shift+Enter support:
  - Works natively in Ghostty, Kitty, iTerm2, WezTerm, Warp, Apple Terminal and Windows Terminal, and in kitty-protocol terminals (foot, Alacritty 0.16+) from v2.1.269.
  - Not available in gnome-terminal or JetBrains terminals. Use Ctrl+J, or `\` then Enter.

  — [Terminal config](https://code.claude.com/docs/en/terminal-config#enter-multiline-prompts)
- Option key on macOS:
  - iTerm2: set Left/Right Option to "Esc+".
  - VS Code: `"terminal.integrated.macOptionIsMeta": true`.
  - Windows `^H` Backspace quirk: `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE=0`.

  — [Terminal config](https://code.claude.com/docs/en/terminal-config#enable-option-key-shortcuts-on-macos)

#### Prompt input and footer features
- Emoji shortcodes: type `:heart:` and it becomes ❤️; `:hea` opens a suggestion popup. Added in v2.1.217 (2026-07-21). Turn off with `emojiCompletionEnabled: false`. — [Interactive mode: Emoji shortcodes](https://code.claude.com/docs/en/interactive-mode#emoji-shortcodes)
- Spellcheck (v2.1.235, user or managed scope). It needs aspell, hunspell or ispell installed. `color` defaults to the theme's error color.
  ```json
  { "spellcheck": { "enabled": true, "checker": "auto", "language": "en_GB", "color": "ansi:yellow" } }
  ```
  — [Settings reference: spellcheck](https://code.claude.com/docs/en/settings-reference#spellcheck)
- Prompt suggestions: grayed-out next-prompt predictions; Tab or → accepts. Turn off with `promptSuggestionEnabled: false` or `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false`. They need telemetry and a claude.ai or Console account. — [Interactive mode: Prompt suggestions](https://code.claude.com/docs/en/interactive-mode#prompt-suggestions); [Settings reference](https://code.claude.com/docs/en/settings-reference#promptsuggestionenabled)
- External editor:
  - `Ctrl+G` opens the prompt in `$EDITOR`.
  - `externalEditorContext: true` (in `~/.claude.json`) pre-fills the buffer with Claude's last response as `#` comments, which are stripped on save.

  — [Settings reference: externalEditorContext](https://code.claude.com/docs/en/settings-reference#externaleditorcontext)
- `!` shell mode:
  - `respondToBashCommands: false` adds the output to context without a reply.
  - `defaultShell: "bash"|"powershell"` picks the shell.

  — [Settings reference](https://code.claude.com/docs/en/settings-reference#respondtobashcommands)
- Pastes over 800 characters or 3 lines collapse to `[Pasted text #N +120 lines]` and are cached in `~/.claude/paste-cache/`. — [Terminal config: Paste large content](https://code.claude.com/docs/en/terminal-config#paste-large-content)
- Footer badges:
  - `footerLinksRegexes` (v2.1.176): regex → clickable badges in the footer, for example `PROJ-1234` → an issue-tracker link. At most 5 badges; labels truncate at 28 columns.
  - `prStatusFooterEnabled` (in `~/.claude.json`): a PR badge underlined by review state (green approved, yellow pending, red changes requested, gray draft).

  — [Settings reference: footerLinksRegexes](https://code.claude.com/docs/en/settings-reference#footerlinksregexes); [Interactive mode: PR review status](https://code.claude.com/docs/en/interactive-mode#pr-review-status)
- `fileSuggestion` runs your own command for `@` autocomplete. It gets JSON `{"query": ...}` on stdin, prints paths, shows at most 15, and has a 5-second timeout. — [Settings reference: fileSuggestion](https://code.claude.com/docs/en/settings-reference#filesuggestion)
- Voice dictation:
  - Enable with `/voice [hold|tap|off]` or the `voice` object, for example `{"enabled": true, "mode": "tap", "autoSubmit": ...}`. Space is the push-to-talk key and can be rebound with `voice:pushToTalk`.
  - It needs a claude.ai account and a local microphone (WSLg under WSL), and doesn't work over SSH or in cloud sessions.
  - Audio is transcribed on Anthropic servers and doesn't count toward usage.
  - `voiceEnabled` is deprecated since v2.1.92.

  — [Voice dictation](https://code.claude.com/docs/en/voice-dictation); [Settings reference: voice](https://code.claude.com/docs/en/settings-reference#voice)
- `companyAnnouncements` (array of strings, any settings file) shows a startup announcement, picking one at random each session. — [Settings reference](https://code.claude.com/docs/en/settings-reference#companyannouncements)
- `language` (any string, for example `"japanese"`) makes Claude respond in that language and sets the dictation language. — [Settings reference: language](https://code.claude.com/docs/en/settings-reference#language)

#### Interplay with status lines (scope note)
- Status line config (covered by another researcher):
  - `statusLine` takes `{type: "command", command, padding, refreshInterval ≥ 1, hideVimModeIndicator}`.
  - `subagentStatusLine` rewrites subagent rows.
  - Footer badges from `footerLinksRegexes` render alongside a custom status line; neither replaces the other.

  — [Settings reference: statusLine / footerLinksRegexes](https://code.claude.com/docs/en/settings-reference#statusline)

### Inferences
- The highest-impact, lowest-effort rice using only first-party knobs:
  1. A custom `~/.claude/themes/*.json` based on `dark-ansi` or `light-ansi` so it inherits the terminal palette, with a few accent overrides.
  2. `spinnerVerbs` and `spinnerTipsOverride`.
  3. `maxProseWidth: 100`.
  4. `tui: "fullscreen"` with `viewMode: "focus"` for a calm view.
  5. `timeFormat: "24-hour"`.
  6. `preferredNotifChannel` matched to your terminal.
- Some keys are restricted to the user or managed scope: `vimInsertModeRemaps`, `spellcheck`, `spinnerTipsOverride` objects and `askUserQuestionTimeout`. Shared rices therefore belong in `~/.claude/settings.json` or a plugin, not in a repo's `.claude/settings.json`.
- Many blog posts from 2025 to early 2026 are stale:
  - They mention `/vim`, which was removed.
  - They use Ctrl+R for the transcript, now Ctrl+O.
  - They say output styles are deprecated (reversed in v2.0.32).
  - They say a style needs `/clear` to apply (no longer true since v2.1.251).
  - They use `voiceEnabled`, now replaced by the `voice` object.
- A constructed (unverified) snippet to swap Enter and Shift+Enter, built from the documented action names `chat:newline` and `chat:submit`:
  ```json
  { "bindings": [ { "context": "Chat", "bindings": { "enter": "chat:newline", "shift+enter": "chat:submit" } } ] }
  ```
  Test it, because Shift+Enter detection depends on the terminal.
- Because `companyAnnouncements` is allowed in any settings file and picks at random per session, an individual can probably use it as a personal "message of the day" at startup. The docs only describe the organization use case, so this is untested.

### Gaps
- The docs give no complete list of every `/config` row. The list above was rebuilt from the "Appears in `/config` as" lines in the settings reference.
- The exact OSC 7501 escape syntax and the list of terminals that implement it beyond Ghostty could not be verified from a primary spec. Only Claude Code's docs and a secondary summary were reachable.
- The version that introduced `preferredNotifChannel` itself was not found in the changelog. The changelog references "Notification" hooks from v2.0.37 and earlier.
- Conflicting minimum version for screen reader mode: the changelog says v2.1.208, the env-var docs say v2.1.181.
- No screenshot gallery of built-in themes was found in the official docs.

## Q2. Hooks for UX: events and payloads, plus community recipes for notifications, sounds, voice, phone push, terminal integration and auto-format/lint

### Takeaway
Claude Code now has 33 hook events and 5 handler types (`command`, `http`, `mcp_tool`, `prompt`, `agent`). The UX workhorses are:
- `Notification`, with typed matchers such as `permission_prompt` and `idle_prompt`.
- `Stop`, which carries `last_assistant_message`, convenient for TTS and push.
- `StopFailure`, `PermissionRequest`, `PostToolUse` and `SessionStart`.
- `MessageDisplay`, which rewrites displayed text only.

Hooks now run without a TTY, so the supported way to ring the bell, set a title or post OSC 9/99/777 notifications is to return `{"terminalSequence": "..."}` (v2.1.141+). Older recipes that wrote to `/dev/tty` are broken.

The community has standardized on a few high-star projects:
- PeonPing/peon-ping (≈5.1k★): game voice lines, banners, tab titles, ntfy/Pushover/Telegram.
- disler/claude-code-hooks-mastery (≈3.9k★): TTS and LLM summaries.
- 777genius/claude-notifications-go, now "Agent Notifications" (≈817★): cross-platform toasts, click-to-focus, Slack/Discord/Telegram webhooks.
- Smaller single-purpose repos for ntfy approvals, BurntToast toasts and local TTS.

### Cited Findings

#### Hook events and handler options relevant to UX
- All 33 events: SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, Elicitation, ElicitationResult, SessionEnd. — [Hooks reference: Hook lifecycle](https://code.claude.com/docs/en/hooks#hook-lifecycle)
- Handler fields:
  - `type`: `command` | `http` | `mcp_tool` | `prompt` | `agent`
  - `if`: permission-rule filter, for example `"Edit(*.ts)"` or `"Bash(git *)"`
  - `timeout`: defaults 600 s for command, http and mcp_tool; 30 s for prompt; 60 s for agent
  - `statusMessage`: custom spinner text while the hook runs
  - `once`: skill frontmatter only
  - `async`: run in the background without blocking
  - `asyncRewake`: run in the background and wake Claude on exit 2
  - `shell`: `"bash"` | `"powershell"`
  - `args`: exec form, no shell
  - `onFailure`: `"continue"` | `"block"`, v2.1.295

  — [Hooks reference: Hook handler fields](https://code.claude.com/docs/en/hooks)
- Hooks can surface a message to the user with the JSON `systemMessage` field, though some events discard it. — [Hooks reference: Hook input and output](https://code.claude.com/docs/en/hooks)

#### Notification event: matchers, timing, payload
- Matchers:
  - `permission_prompt`: after about 6 s of no typing at a permission prompt.
  - `idle_prompt`: about 60 s after Claude finished, with no typing and no background agents running.
  - `auth_success`
  - `elicitation_dialog`, `elicitation_url_dialog` (about 6 s), `elicitation_complete`, `elicitation_response`
  - `agent_needs_input` and `agent_completed`: fire only while agent view is open.
  - `quota_auto_resume_fired`, `quota_auto_resume_stale`, `quota_auto_resume_disabled` (v2.1.234+)
- To alert immediately on a permission ask, use `PermissionRequest` instead.

  — [Hooks reference: Notification](https://code.claude.com/docs/en/hooks#notification)
- Payload: common fields plus `message`, an optional `title`, and `notification_type`. Example: `{"hook_event_name":"Notification","message":"Claude needs your permission","title":"Permission needed","notification_type":"permission_prompt"}`.
  - Notification hooks can't block.
  - `systemMessage` and `continue` are discarded, but `terminalSequence` is still emitted.
  - Hooks fire even when `preferredNotifChannel` is `notifications_disabled`.
  - They run alongside the built-in notification, not instead of it.

  — [Hooks reference](https://code.claude.com/docs/en/hooks#notification); [Terminal config](https://code.claude.com/docs/en/terminal-config#play-a-sound-with-a-notification-hook)
- In Desktop and VS Code-hosted sessions (SDK `canUseTool`), `permission_prompt` fires about 6 s after the ask and isn't deferred by typing. `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS=1` turns it off there (v2.1.233+). — [Hooks reference](https://code.claude.com/docs/en/hooks#notification); [Env vars](https://code.claude.com/docs/en/env-vars)

#### Stop, StopFailure and SubagentStop payloads
- `Stop` fires when the main agent finishes. It doesn't fire on a user interrupt; API errors fire `StopFailure` instead. Input:
  - `stop_hook_active`
  - `last_assistant_message`: the final text. The docs recommend it for "read-aloud or notification hooks" instead of parsing `transcript_path`, which may lack the final message.
  - `background_tasks` and `session_crons`: tell "done" apart from "waiting on background work".
- Claude Code caps hooks continuing the turn at 8 consecutive continuations (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`).

  — [Hooks reference: Stop](https://code.claude.com/docs/en/hooks#stop)
- `StopFailure` `error` values: `rate_limit`, `overloaded`, `authentication_failed`, `oauth_org_not_allowed`, `account_on_hold`, `billing_error`, `invalid_request`, `model_not_found`, `server_error`, `max_output_tokens`, `cloud_credential_error`, `unknown`. Output and exit code are ignored except `terminalSequence`, so these hooks are useful only for alerts. — [Hooks reference: StopFailure](https://code.claude.com/docs/en/hooks#stopfailure)

#### `terminalSequence`: the supported way to emit OSC and BEL from hooks
- Hooks run without a controlling terminal, so writing to `/dev/tty` fails. Return `{"terminalSequence": "..."}` and Claude Code writes the sequence itself. This works inside tmux and GNU screen and on Windows. Allowlist:
  - OSC 0/1/2: titles
  - OSC 9: iTerm2, ConEmu, Windows Terminal and WezTerm notifications, plus `9;4` taskbar progress
  - OSC 99: Kitty
  - OSC 777: urxvt, Ghostty, Warp
  - bare BEL

  Everything else is rejected, including CSI, OSC 8 hyperlinks, OSC 52 clipboard and OSC 1337. The sequence is written only in interactive sessions. — [Hooks reference: Emit terminal notifications](https://code.claude.com/docs/en/hooks#emit-terminal-notifications)
- Added in v2.1.141 (2026-05-13): "so hooks can emit desktop notifications, window titles, and bells without a controlling terminal". — [CHANGELOG 2.1.141](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Official script, a Notification hook that posts an OSC 777 desktop notification:
  ```bash
  #!/bin/bash
  input=$(cat)
  title="Claude Code"
  body=$(jq -r '.message // "Needs your attention"' <<<"$input")
  seq=$(printf '\033]777;notify;%s;%s\007' "$title" "$body")
  jq -nc --arg seq "$seq" '{terminalSequence: $seq}'
  ```
  — [Hooks reference](https://code.claude.com/docs/en/hooks#emit-terminal-notifications)

#### `MessageDisplay`: display-only rewriting (v2.1.152, 2026-05-26)
- The hook runs on each batch of completed lines of streaming assistant text, with fields `turn_id`, `message_id`, `index`, `final` and `delta`. It returns `hookSpecificOutput.displayContent`.
  - Display-only: the transcript and what Claude sees keep the original text.
  - No matchers. Default timeout 10 s; on failure the original text is shown.
  - Documented uses: strip markdown, redact secrets, transform SDK output.

  Official example:
  ```bash
  jq '{hookSpecificOutput: {hookEventName: "MessageDisplay", displayContent: (.delta | gsub("\\*\\*"; "") | gsub("`"; ""))}}'
  ```
  — [Hooks reference: MessageDisplay](https://code.claude.com/docs/en/hooks#messagedisplay); [CHANGELOG 2.1.152](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

#### Exit-code semantics for auto-format and lint feedback
- Exit 2 by event:

  | Event | Can exit 2 block? | Effect of exit 2 |
  | :- | :- | :- |
  | PreToolUse | Yes | Blocks the tool call |
  | UserPromptSubmit | Yes | Blocks the prompt |
  | Stop | Yes | Claude continues |
  | PostToolUse | No | stderr is shown to Claude; the tool already ran |
  | PostToolBatch | Yes | Stops the loop before the next model call |
  | Notification | No | Exit code ignored |
  | SessionStart | No | stderr shown to user only |
  | MessageDisplay | No | Original text displayed |

  — [Hooks reference: Exit code output](https://code.claude.com/docs/en/hooks)
- Official auto-format recipe for `.claude/settings.json`:
  ```json
  { "hooks": { "PostToolUse": [ { "matcher": "Edit|Write", "hooks": [
      { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" } ] } ] } }
  ```
  To reformat files that Bash rewrites, use a `FileChanged` hook. — [Hooks guide: Auto-format code after edits](https://code.claude.com/docs/en/hooks-guide#auto-format-code-after-edits)
- Async hooks (`"async": true`) run in the background, for example tests after each Write. Their output arrives on the next turn. `asyncRewake` wakes Claude on exit 2. — [Hooks reference: Run hooks in the background](https://code.claude.com/docs/en/hooks#run-hooks-in-the-background)
- Community guidance:
  - PostToolUse exit 2 feeds lint errors back to Claude to fix.
  - Append `; true` to formatter commands to avoid spurious blocking.
  - Print only the tail of the failure output.

  Secondary sources, per the search summary. — [DEV: Claude Code hooks real examples](https://dev.to/ohugonnot/claude-code-hooks-real-examples-posttooluse-stop-pretooluse-620); [codeongrass](https://codeongrass.com/blog/claude-code-hooks-done-means-tests-passed/)

#### Recipes: desktop notifications by platform
- Official per-OS Notification hooks:
  - **macOS:** `osascript -e 'display notification "Claude Code needs your attention" with title "Claude Code"'`. Script Editor must have notification permission or it fails silently.
  - **Linux:** `notify-send 'Claude Code' 'Claude Code needs your attention'`. Needs a notification daemon and `libnotify-bin`.
  - **Windows PowerShell:** a `System.Windows.Forms.MessageBox` dialog (not a toast). Under WSL, `powershell.exe` must be on `PATH`.

  — [Hooks guide: Get notified when Claude needs input](https://code.claude.com/docs/en/hooks-guide#get-notified-when-claude-needs-input)
- **macOS terminal-notifier** (richer, clickable banner): `brew install terminal-notifier`, then `terminal-notifier -title "Claude Code" -message "Needs your attention" -sound default`. The guide was updated September 2026 and says a DIY hook's click "can at best raise an app, never the exact terminal tab". — [Vibe Island guide](https://vibeisland.app/guides/claude-code-notifications-mac/)
- **Windows and WSL toasts with BurntToast:**
  - Install with `Install-Module -Name BurntToast -Force -Scope CurrentUser` via `powershell.exe`.
  - A `~/bin/toast` bash wrapper calls `New-BurntToastNotification -Text '$TITLE', '$MESSAGE' -Sound 'Default'`.
  - Register it on both `Notification` and `Stop`.

  Gist last active 2026-08-31. — [latenssi gist](https://gist.github.com/latenssi/e3a54bbdd84f6d595908c10931ac9b9f)
- A PowerShell variant is [kmio11/cc-notification](https://github.com/kmio11/cc-notification) (6★, PowerShell, last commit Sep 2026, no license shown). — shields.io 2026-10-14
- A May 2026 Japanese write-up notes that Windows Terminal under WSL2 gets no built-in desktop notification, so a hook is required. — [DevelopersIO (classmethod)](https://dev.classmethod.jp/articles/notification-claudecode-in-windows/)
- **777genius/claude-notifications-go, now branded "Agent Notifications"** (≈817★, Go 63.6%, last commit 2026-10-14):
  - Desktop notifications for Claude, Codex, OpenCode, Gemini CLI and Cursor CLI on macOS, Linux and Windows.
  - Click-to-focus on the originating terminal, custom sounds, project and branch context, focus-aware delivery.
  - Webhooks to Slack, Discord, Telegram, Lark and custom endpoints.
  - Settings wizard `/claude-notifications-go:settings`.
  - Install: `(set -o pipefail; curl -fsSL https://agent-notifications.com/install.sh | bash)`. On Windows, use Git Bash.

  — [repo README](https://github.com/777genius/claude-notifications-go); stars and date via shields.io
- **Linux and tmux:** [bupd/ccn](https://github.com/bupd/ccn) (5★, Apache-2.0, last commit Mar 2026). Desktop notifications whose click jumps to the right tmux pane; requires dunst. — search summary via [awesome.ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fbupd%2Fccn); shields.io

#### Recipes: sounds and sound packs
- Official sound recipe for macOS: a Notification hook running `afplay /System/Library/Sounds/Glass.aiff`. — [Terminal config](https://code.claude.com/docs/en/terminal-config#play-a-sound-with-a-notification-hook)
- **[PeonPing/peon-ping](https://github.com/PeonPing/peon-ping)** (≈5.1k★, MIT, Shell 52%, last commit Oct 2026):
  - Game voice lines and large on-screen overlay banners (macOS, WSL, MSYS2).
  - Tab titles such as `● project: done` and desktop notifications when the terminal isn't focused.
  - Hooks: SessionStart, SessionEnd, SubagentStart, Stop, Notification, PermissionRequest, PostToolUseFailure, PreCompact. Events map to CESP categories (`session.start`, `task.complete`, `input.required`, `task.error`, `resource.limit`, `user.spam`).
  - 165 packs: Warcraft, StarCraft, Red Alert, Portal/GLaDOS, Zelda, Dota 2, Helldivers 2, Elder Scrolls and more. Previews at [openpeon.com/packs](https://openpeon.com/packs).
  - Audio players: `afplay`, PowerShell MediaPlayer/SoundPlayer, `pw-play`/`paplay`/`ffplay`/`mpv`/`aplay`.
  - Install options:
    - `brew install PeonPing/tap/peon-ping`, then `peon-ping-setup`
    - `curl -fsSL https://raw.githubusercontent.com/PeonPing/peon-ping/main/install.sh | bash`
    - Windows `install.ps1`
    - Nix and Home Manager
  - Controls: `/peon-ping-toggle` and `peon toggle`.

  — [repo README](https://github.com/PeonPing/peon-ping); shields.io
- peon-ping's launch on Hacker News, titled "Warcraft III Peon Voice Notifications for Claude Code", got 1,006 points and 301 comments on 2026-02-12. It originally linked github.com/tonyyont/peon-ping. — [HN item 46985151 via HN API](https://news.ycombinator.com/item?id=46985151)
- WSL2 audio caveat: Windows 11 24H2+ removed legacy WMP, so peon-ping falls back to `System.Media.SoundPlayer` (WAV only; `ffmpeg` is needed for MP3). — [peon-ping README](https://github.com/PeonPing/peon-ping)
- **[ctoth/claudio](https://github.com/ctoth/claudio)** (≈117★, last commit 2026-10-11, no license shown): a hook-driven audio layer with context sounds per event. It parses Bash commands so `git commit`, `npm test` and `go build` get their own sounds. Ships a binary; run `claudio install` (`--agent claude --scope global`). awesome-claude-code describes it as "a no-frills little library that adds delightful OS-native sounds". — [repo README](https://github.com/ctoth/claudio); [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- Smaller packs: — shields.io; [search summary](https://www.claudepluginhub.com/plugins/dansoqt-peon-ping)
  - [lodev09/agent-sounds](https://github.com/lodev09/agent-sounds) (22★, MIT, Oct 2026): `claude plugin install sounds@lodev09`.
  - [boldflight/claude-code-rts-sounds](https://github.com/boldflight/claude-code-rts-sounds) (5★): Peon, SCV and Star Trek TNG.
  - [dansoqt/peon-ping](https://github.com/dansoqt/peon-ping) (2★): a plugin. Its README says the Blizzard audio is not covered by the MIT license.

#### Recipes: text-to-speech
- **[disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)** (≈3.9k★, Python 82.8%, last commit Feb 2026, license not detected by GitHub):
  - Uses uv single-file Python hooks.
  - TTS provider priority is ElevenLabs > OpenAI > pyttsx3, with a queue to prevent overlapping audio.
  - The Stop hook speaks LLM-generated completion messages (OpenAI > Anthropic > Ollama).
  - The Notification hook says "Your agent needs your input".
  - Also ships the output styles and status lines listed under Q1.
  - Its README says it covers "all 13" hook events. Current docs list 33.

  — [repo README](https://github.com/disler/claude-code-hooks-mastery); shields.io
- **[paulpreibisch/AgentVibes](https://github.com/paulpreibisch/AgentVibes)** (≈155★, Apache-2.0, JavaScript, last commit 2026-10-09):
  - Speaks each agent's task start and completion aloud.
  - Voices: Kokoro, Piper, ElevenLabs.
  - A "Remote Receiver" pipes the voice from a remote SSH box to your local speakers.
  - Install: `npx agentvibes install`, a TUI. macOS also needs `brew install bash`.
  - `/agent-vibes:mute`.

  — [repo README](https://github.com/paulpreibisch/AgentVibes); shields.io
- Small local-TTS hooks, all MIT: — shields.io; [search summary](https://tomevault.io/tome/aperepel/claude-mlx-tts)
  - [aperepel/claude-mlx-tts](https://github.com/aperepel/claude-mlx-tts) (11★, Jan 2026): speaks only after long "deep work" responses, using macOS `say` or MLX voice cloning. Install with `/plugin marketplace add aperepel/claude-mlx-tts`, then `/plugin install claude-mlx-tts`.
  - [cris-m/claude_voice](https://github.com/cris-m/claude_voice) (4★): Kokoro, Chatterbox or MLX-Audio.
  - [praneybehl/claude-code-voice-hook](https://github.com/praneybehl/claude-code-voice-hook) (1★): a Stop hook that strips markdown and sends to a local OpenAI-compatible TTS server.
  - [BestSithInEU/cc-vox](https://github.com/BestSithInEU/cc-vox) (1★): Qwen3-TTS, Kokoro or Chatterbox.
- A write-up on local Kokoro TTS reading Claude's responses through a Stop hook. — [DevelopersIO (classmethod)](https://dev.classmethod.jp/en/articles/claude-code-kokoro-tts-local-voice-response/)

#### Recipes: phone push and chat (ntfy, Pushover, Telegram, Slack)
- **Minimal ntfy recipe** (gist, last active 2026-04-21):
  - A SessionStart hook writes a start timestamp.
  - A Stop hook runs `curl -s -d "$MSG" "https://ntfy.sh/${NTFY_TOPIC}" &` only if the session lasted at least 30 s.
  - The message is "Claude done: $DIR ($BRANCH)".
  - Use a hard-to-guess hex topic.

  — [iboss-ptk gist](https://gist.github.com/iboss-ptk/3c036277237f4e483447a9f450244e58)
- **Approve or deny from your phone:**
  - [yuuichieguchi/claude-remote-approver](https://github.com/yuuichieguchi/claude-remote-approver) (≈75★, MIT, JS, Mar 2026): a `PermissionRequest` hook posts to `ntfy.sh/<topic>` with Approve / Always Approve / Deny buttons and listens over SSE on `<topic>-response`. If it fails or times out, it falls back to the CLI prompt (`{"behavior":"ask"}`). Install with `npm install -g claude-remote-approver`; setup prints a QR code.
  - [coa00/claude-push](https://github.com/coa00/claude-push) (8★, MIT) works the same way with a default 90 s timeout.

  — READMEs; shields.io
- peon-ping supports `peon mobile ntfy <topic> [--priority=max]`, `peon mobile pushover <user_key> <app_token>` and `peon mobile telegram <bot_token> <chat_id>`. On iOS, low-priority ntfy alerts can arrive silently. — [peon-ping README](https://github.com/PeonPing/peon-ping)
- **Two-way chat control:**
  - [JessyTsui/Claude-Code-Remote](https://github.com/JessyTsui/Claude-Code-Remote) (≈1.3k★, MIT, JS, last commit Dec 2025): Email, Telegram (buttons), LINE and desktop; reply to send commands. [YouTube demo](https://youtu.be/_yrNlDYOJhw).
  - [Imolatte/claude-cli-telegram](https://github.com/Imolatte/claude-cli-telegram) (36★, MIT, Sep 2026).
  - [anneschuth/claude-threads](https://github.com/anneschuth/claude-threads) (43★, Apache-2.0, Oct 2026): streams a session into a Slack or Mattermost thread.

  — READMEs; [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code); shields.io
- **Guides:**
  - Telegram bot via a Stop or SubagentStop hook. — [Medium, Dan Avila](https://medium.com/@dan.avila7/step-by-step-guide-connect-telegram-with-claude-code-hooks-1686fadcee65), from the search summary, not fetched.
  - Slack via a Notification hook and a bot token. — [Zenn](https://zenn.dev/ispec_inc/articles/claude-code-slack-notification-hooks), from the search summary.
- Built-in alternative with no hooks: Remote Control mobile push, using `agentPushNotifEnabled` and `inputNeededNotifEnabled` (see Q1). — [Remote Control](https://code.claude.com/docs/en/remote-control#mobile-push-notifications)

#### Recipes: terminal bell, OSC 9/99/777, tab titles and badges
- Built in: `preferredNotifChannel: "terminal_bell"` rings the bell in any terminal. From hooks, return BEL or OSC 9/99/777 through `terminalSequence` (allowlist above). — [Settings reference](https://code.claude.com/docs/en/settings-reference#preferrednotifchannel); [Hooks reference](https://code.claude.com/docs/en/hooks#emit-terminal-notifications)
- **[JasperSui/claude-code-iterm2-tab-status](https://github.com/JasperSui/claude-code-iterm2-tab-status)** (39★, MIT, Aug 2026): each iTerm2 tab shows ⚡ running, 💤 idle or 🔴 needs attention (flashing). It deploys an iTerm2 Python AutoLaunch adapter, and its README has a demo GIF (`assets/demo.gif`). Install:
  ```text
  /plugin marketplace add JasperSui/jaspersui-marketplace
  /plugin install iterm2-tab-status@jaspersui-marketplace
  ```
  — [repo README](https://github.com/JasperSui/claude-code-iterm2-tab-status); shields.io
- Caveat from a user report (Windows Terminal, v2.1.114, April 2026): a title set from a hook was "immediately clobbered by Claude Code's render loop". The issue was closed as a duplicate. Related open requests ask for configurable title state indicators. — [claudeissues #51459](https://claudeissues.com/issue/51459-feature-request-hook-output-for-dynamic-tab-title-prefix-session-label-overlay); [claudeissues #25307](https://claudeissues.com/issue/25307-feature-configurable-terminal-tab-title-state-indicators-including-a-distinct-wa)
- **[sorkila/lockpaw](https://github.com/sorkila/lockpaw)** (≈162★, MIT, last commit 2026-10-13), macOS: covers and input-locks the screen while agents run, and the screen glows when Claude needs permission or finishes. — [repo README](https://github.com/sorkila/lockpaw); [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)

#### Notable repos at a glance
Stars and last commit are from shields.io on 2026-10-14. Relative dates were converted, so "Oct 2026" is approximate within that month.

| Repo | What | ★ | Last commit | License | Install |
| :- | :- | :- | :- | :- | :- |
| [anthropics/claude-code](https://github.com/anthropics/claude-code) | Official repo: CHANGELOG, plugins | 151k | 2026-10-14 | n/a | — |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Curated list; has a "Remote Control, Notifications & Voice I/O" section | 56k | 2026-10-14 | not detected | — |
| [PeonPing/peon-ping](https://github.com/PeonPing/peon-ping) | Game voice lines, banners, tab titles, mobile push | 5.1k | Oct 2026 | MIT | `brew install PeonPing/tap/peon-ping` |
| [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) | Reference hooks: TTS, LLM summaries, output styles | 3.9k | Feb 2026 | not detected | clone; needs `uv` |
| [Piebald-AI/tweakcc](https://github.com/Piebald-AI/tweakcc) | Patcher: themes, spinners, input highlighters, system prompts | 2.5k | 2026-10-14 | MIT | not verified |
| [JessyTsui/Claude-Code-Remote](https://github.com/JessyTsui/Claude-Code-Remote) | Email/Telegram/LINE remote control | 1.3k | Dec 2025 | MIT | see README |
| [777genius/claude-notifications-go](https://github.com/777genius/claude-notifications-go) | Cross-platform toasts, click-to-focus, webhooks | 817 | 2026-10-14 | not detected | `curl -fsSL https://agent-notifications.com/install.sh \| bash` |
| [sorkila/lockpaw](https://github.com/sorkila/lockpaw) | macOS screen cover that glows on attention | 162 | 2026-10-13 | MIT | download app |
| [paulpreibisch/AgentVibes](https://github.com/paulpreibisch/AgentVibes) | Neural TTS voices, remote receiver | 155 | 2026-10-09 | Apache-2.0 | `npx agentvibes install` |
| [wynandw87/claude-code-spinner-verbs](https://github.com/wynandw87/claude-code-spinner-verbs) | 6,304 spinner verbs in 153 categories | 140 | Oct 2026 | not detected | paste into `spinnerVerbs` |
| [ctoth/claudio](https://github.com/ctoth/claudio) | OS-native event sounds | 117 | 2026-10-11 | not detected | `claudio install` |
| [PeonPing/peon-pet](https://github.com/PeonPing/peon-pet) | macOS desktop orc pet reacting to hooks | 103 | Oct 2026 | not detected | git clone (Electron) |
| [hesreallyhim/awesome-claude-code-output-styles-that-i-really-like](https://github.com/hesreallyhim/awesome-claude-code-output-styles-that-i-really-like) | Persona output styles | 86 | Nov 2025 | MIT | copy `.md` files |
| [yuuichieguchi/claude-remote-approver](https://github.com/yuuichieguchi/claude-remote-approver) | ntfy approve/deny from phone | 75 | Mar 2026 | MIT | `npm i -g claude-remote-approver` |
| [JasperSui/claude-code-iterm2-tab-status](https://github.com/JasperSui/claude-code-iterm2-tab-status) | iTerm2 tab status emoji | 39 | Aug 2026 | MIT | plugin marketplace |
| [DevinoSolutions/anotifier-for-claude-codex-cursor](https://github.com/DevinoSolutions/anotifier-for-claude-codex-cursor) | Toast plus ntfy push, one-command setup | 33 | 2026-10-12 | AGPL-3.0 | see README |

### Inferences
- The modern, robust notification stack has three pieces:
  1. Built-in `preferredNotifChannel` for terminals that support it.
  2. A `Notification` hook (matchers `permission_prompt` and `idle_prompt`) that returns `terminalSequence`. This survives tmux, SSH and Windows.
  3. `async: true` side-effect hooks (sound, TTS, ntfy) so they never stall Claude.

  Recipes that `printf ... > /dev/tty`, mostly from 2025 to early 2026, should be migrated to `terminalSequence` (v2.1.141+).
- Because Notification `permission_prompt` waits about 6 s and `idle_prompt` about 60 s, recipes that "beep instantly when Claude is done" should hook `Stop`, and "instantly when it asks" should hook `PermissionRequest`. Otherwise users perceive the alerts as laggy.
- A constructed TTS one-liner, untested, built from the documented `last_assistant_message` field and `async`. macOS `say`; Linux could use `spd-say` or `espeak`:
  ```json
  { "hooks": { "Stop": [ { "hooks": [ { "type": "command", "async": true,
      "command": "say \"$(jq -r '.last_assistant_message' | head -c 300)\"" } ] } ] } }
  ```
- The `terminalSequence` allowlist names OSC 9 for Windows Terminal and WezTerm, and OSC 777 for Warp. Two terminals where built-in desktop notifications don't fire could therefore get native notifications from a hook, with no external tool:
  - Windows Terminal, including WSL: no BurntToast needed.
  - Warp, which the built-in `preferredNotifChannel` skips.

  This is inferred from the allowlist and not tested here. The built-in channel list covers only iTerm2, Kitty and Ghostty.
- iTerm2 badges use OSC 1337, which is explicitly rejected by the `terminalSequence` allowlist, and hooks have no TTY. Badge and tab-color tricks therefore need the iTerm2 Python API, as in JasperSui's adapter, not plain hooks.
- Hook-set titles (OSC 0/2 via `terminalSequence`) compete with Claude Code's own title writer. A plausible but unverified approach is `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` with hooks owning the title, at the cost of losing OSC 7501 status and the generated session titles.

### Gaps
- Exact current install commands for tweakcc, Claude-Code-Remote and anotifier were not verified.
- Star counts are rounded by shields.io (for example "5.1k"). The GitHub API was blocked in this environment, so exact counts and creation dates are unavailable.
- No primary source was fetched for Pushover-specific hook recipes beyond peon-ping's built-in support.
- I couldn't confirm whether `terminalSequence` OSC 9/777 sent from a hook is subject to the same "you appear to be away" gating as built-in notifications. It probably isn't, but the docs don't say.
- The jtcressy "sound-hooks" plugin, which claims coverage of all hook events, appeared only in a plugin-directory listing and was not verified.

## Q3. Custom slash commands and skills that improve day-to-day UX

### Takeaway
Many former community favorites are now built in:
- `/recap`: session recap
- `/btw`: side question
- `/context`: colored context grid
- `/usage`: also `/cost` and `/stats`
- `/insights`: HTML usage report
- `/copy` and `/export`
- `/diff`: panel view
- `/focus`
- `/powerup`: interactive lessons

Custom commands are now skills: `.claude/commands/*.md` still works, and `.claude/skills/<name>/SKILL.md` is the newer format. For commit helpers, Anthropic's own `commit-commands` plugin (`/commit`, `/commit-push-pr`, `/clean_gone`) is the reference example.

### Cited Findings
- Built-in UX commands:
  - `/recap`: a one-line session summary on demand.
  - `/btw [question]`: a side question that doesn't enter the conversation.
  - `/context [all]`: context usage as a colored grid with optimization suggestions.
  - `/usage`: cost, plan limits and stats; `/cost` and `/stats` are aliases.
  - `/insights`: an HTML report analyzing your recent sessions.
  - `/copy [N]`: picker for code blocks; `w` writes to a file, useful over SSH.
  - `/export [filename]`
  - `/diff`
  - `/focus`
  - `/powerup`: "quick interactive lessons with animated demos".
  - `/release-notes`: interactive changelog picker.
  - `/rename`, `/color`
  - `/statusline`: describe what you want or auto-configure from your shell prompt.
  - `/doctor`, alias `/checkup`.

  — [Commands](https://code.claude.com/docs/en/commands)
- "Custom commands have been merged into skills." `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`, and existing command files keep working. When names collide, the skill wins. — [Skills](https://code.claude.com/docs/en/skills)
- Official plugins in `anthropics/claude-code/plugins`:
  - `commit-commands`: `/commit`, `/commit-push-pr`, `/clean_gone`.
  - `hookify`: `/hookify`, `/hookify:list`, `/hookify:configure`, `/hookify:help`; creates hooks from conversation patterns.
  - `code-review`: `/code-review`.
  - `feature-dev`: `/feature-dev`.
  - `explanatory-output-style` and `learning-output-style`: SessionStart hooks.
  - `security-guidance`: a PreToolUse hook that watches 9 patterns.

  — [anthropics/claude-code plugins README](https://github.com/anthropics/claude-code/tree/main/plugins)
- Plugin-provided UX commands from the notification and sound tools:
  - `/peon-ping-toggle` (peon-ping)
  - `/agent-vibes:mute` and `/agent-vibes:unmute` (AgentVibes)
  - `/claude-notifications-go:settings` (Agent Notifications)
  - `/iterm2-tab-status:setup`

  — [peon-ping](https://github.com/PeonPing/peon-ping); [AgentVibes](https://github.com/paulpreibisch/AgentVibes); [claude-notifications-go](https://github.com/777genius/claude-notifications-go); [iterm2-tab-status](https://github.com/JasperSui/claude-code-iterm2-tab-status)
- Discovery: awesome-claude-code (≈56k★) curates skills, slash commands, hooks, status lines and notifiers. — [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)

### Inferences
- Before installing a community "session summary" or "context summary" command, check whether `/recap`, `/context`, `/usage` or `/insights` already covers it. The built-ins are cache-aware and maintained.
- For "commit helpers", the official `commit-commands` plugin is the safest baseline. A personal `/commit` skill adds value only for house conventions, such as conventional-commit scopes or ticket IDs, which can also be surfaced with `footerLinksRegexes`.

### Gaps
- I didn't evaluate individual community slash-command packs, such as large command collections, for quality or maintenance. Only official and plugin-bundled commands were verified.

## Wow / flex factor

### Takeaway
The biggest "how did you do that?" moments, ordered roughly by impact per minute of setup:
1. Game voice lines plus giant overlay banners (peon-ping), optionally with a desktop orc pet.
2. Neural-voice TTS narrating what each agent did, even from a remote server (AgentVibes, disler's hooks).
3. A fully custom live-reloading color theme with themed spinner verbs and custom-labeled spinner tips.
4. Persona output styles.
5. Approving permission prompts from your phone (ntfy approver).
6. Flashing per-tab status emoji or a glowing lock screen.
7. Native taskbar progress and OSC 7501 status in Ghostty or iTerm2.

All except the native features are third-party and have the version caveats noted in Q2.

### Cited Findings
- **peon-ping voice lines, banners and pet.** Setup effort: low, a one-line install.
  - Plays "Work, work." / "Job's done!" / GLaDOS "You monster." on task events and shows large overlay banners on every screen. The overlay works on macOS, WSL and MSYS2.
  - Has 165 packs and an MCP server that lets the agent pick sounds, for example `duke_nukem/...` on a failed build.
  - "Peon Trainer" nags you to do pushups every ~20 minutes of coding.
  - Demo video: https://github.com/user-attachments/assets/149b6d15-65c2-41f2-9b56-13575ff8364b and [peonping.com](https://peonping.com/).
  - The launch post hit 1,006 points on HN (2026-02-12).
  - Add-on [PeonPing/peon-pet](https://github.com/PeonPing/peon-pet) (103★): a macOS Electron + Three.js orc sprite that floats over all windows and reacts to Claude Code events. Video: https://github.com/user-attachments/assets/7fd9a2cb-d227-49ad-8ccc-7953ec392a2d.

  — [peon-ping README](https://github.com/PeonPing/peon-ping); [HN](https://news.ycombinator.com/item?id=46985151); [peon-pet README](https://github.com/PeonPing/peon-pet)
- **Agents that talk.** Setup effort: low to medium; API keys are optional.
  - AgentVibes speaks task start and finish in neural voices (Kokoro, Piper, ElevenLabs) and can pipe audio from a remote SSH box to laptop speakers. Setup TUI screenshot: https://raw.githubusercontent.com/paulpreibisch/AgentVibes/master/docs/installation-screenshots/screenshot-setup.png.
  - disler's hooks-mastery has an LLM write a one-sentence completion message that is then spoken (ElevenLabs > OpenAI > pyttsx3).

  — [AgentVibes](https://github.com/paulpreibisch/AgentVibes); [claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)
- **Themed spinner verbs.** Setup effort: about 2 minutes, in `settings.json`.
  - Daniel Miessler replaced the verbs with 635 of his own (Dune "Folding space", "Making it so", "Kwisatz-haderaching", "Yak-shaving") using `"mode": "replace"`, published 2026-02-11.
  - alexop.dev made a 25-verb One Piece set ("Stretching like Luffy...", "Activating Gear Fifth...") on 2026-02-12.
  - wynandw87's collection has 6,304 verbs in 153 themed categories (140★).

  — [danielmiessler.com](https://danielmiessler.com/drafts/customized-spinner-verbs-in-claude-code); [alexop.dev](https://alexop.dev/posts/claude-code-spinner-verbs-one-piece/); [wynandw87/claude-code-spinner-verbs](https://github.com/wynandw87/claude-code-spinner-verbs)
- **Custom spinner-tip prefix.** Setup effort: about 5 minutes. `spinnerTipsOverride` with `label`, `excludeDefault: true` and your own tips (in-jokes, team lore, keyboard shortcuts) replaces "Tip:" with your own prefix. Hook `statusMessage` puts custom text on the spinner while a hook runs. — [Settings reference](https://code.claude.com/docs/en/settings-reference#spinnertipsoverride); [Hooks reference](https://code.claude.com/docs/en/hooks)
- **Live-reloading custom theme.** Setup effort: about 10 minutes.
  - A `~/.claude/themes/<name>.json` reloads while you edit, so you can demo color changes live.
  - You can recolor the spinner shimmer (`claudeShimmer`), the eight subagent colors (`*_FOR_SUBAGENTS_ONLY`), the `ultrathink` rainbow (`rainbow_*`), diff backgrounds and your message background.
  - `/color` adds a per-session prompt-bar color that syncs to claude.ai/code.

  — [Terminal config: custom theme](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme); [Commands](https://code.claude.com/docs/en/commands)
- **Persona output styles.** Setup effort: about 5 minutes: drop a `.md` file in `~/.claude/output-styles/` and run `/output-style <name>`.
  - Persona styles: Zen Master, Tabloid Journalist, Technical Evangelist, Existential Poet.
  - disler's `genui` style makes Claude answer with styled HTML pages (screenshot `images/genui.png` in the repo).
  - The built-in Learning style leaves `TODO(human)` spots for you to code.

  — [awesome output styles](https://github.com/hesreallyhim/awesome-claude-code-output-styles-that-i-really-like); [claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery); [Output styles](https://code.claude.com/docs/en/output-styles#learning)
- **Approve from your phone.** Setup effort: about 10 minutes. A permission prompt arrives as an ntfy push with Approve, Always Approve and Deny buttons, and Claude continues immediately after the tap. — [claude-remote-approver](https://github.com/yuuichieguchi/claude-remote-approver)
- **Tab status and glowing screen.** Setup effort: about 10 minutes, macOS.
  - iTerm2 tabs flash 🔴 when a session needs you (demo GIF in the repo).
  - Lockpaw covers the screen and glows when the agent needs you.

  — [iterm2-tab-status](https://github.com/JasperSui/claude-code-iterm2-tab-status); [Lockpaw](https://github.com/sorkila/lockpaw)
- **Native terminal integration, zero setup.**
  - Taskbar or tab progress (OSC 9;4) in Ghostty 1.2+, iTerm2 3.6.6+ and ConEmu.
  - OSC 7501 working/waiting/done status in implementing terminals (v2.1.295+).
  - Clickable footer badges (`footerLinksRegexes`), PR review-state underline.
  - `/insights` HTML usage report, `/powerup` animated lessons.

  — [Settings reference](https://code.claude.com/docs/en/settings-reference#terminalprogressbarenabled); [Terminal config](https://code.claude.com/docs/en/terminal-config#see-session-status-in-your-terminal); [Commands](https://code.claude.com/docs/en/commands)
- **Display-time text transforms.** Setup effort: medium; needs a script. A `MessageDisplay` hook rewrites what appears on screen as Claude streams, while Claude and the transcript keep the original. — [Hooks reference: MessageDisplay](https://code.claude.com/docs/en/hooks#messagedisplay)
- **Deep patching (power users; unsupported).** [Piebald-AI/tweakcc](https://github.com/Piebald-AI/tweakcc) (≈2.5k★, MIT, last commit 2026-10-14) patches the Claude Code install to add custom themes, input-box pattern highlighters "like how `ultrathink` used to be rainbow-highlighted", toolsets and system-prompt edits. — [tweakcc README](https://github.com/Piebald-AI/tweakcc); [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)

### Inferences
- **Best "onlooker" demo for the least effort:** peon-ping (sound and banner), a themed `spinnerVerbs` set, and a custom theme JSON edited live. All three are visible within one prompt, and they use only first-party settings plus one install script.
- **Fun but untested MessageDisplay trick:** because `MessageDisplay` is display-only, a "pirate-speak" or emoji-decorating filter could make the screen look stylized without changing what Claude reasons over or what's saved. Keep it fast, since output is held until the hook returns and the default timeout is 10 s.
- **Flex value versus maintenance:** binary patchers like tweakcc and title hacks are the most fragile across Claude Code's near-daily releases (2.1.287 to 2.1.299 shipped within two weeks). Settings-based and `terminalSequence`-based tricks are the most durable.
- **Etiquette and safety:** sound and voice packs should respect Focus/Do Not Disturb. peon-ping's `focus_detect` (macOS Focus / Do Not Disturb) and `headphones_only` options are good examples; it has a meeting-related option too, whose name was truncated in the extract. Public ntfy topics should be unguessable, because anyone who knows the topic name can read the messages.

### Gaps
- I found no official Anthropic gallery or showcase of community themes or output styles, and no catalog of user-made custom theme JSON files.
- I didn't watch the demo videos and GIFs, so these notes don't verify their claims about visual quality. The links come from the repos' READMEs.
- I couldn't verify a third-party "pirate" output style. None appeared in the searches.
