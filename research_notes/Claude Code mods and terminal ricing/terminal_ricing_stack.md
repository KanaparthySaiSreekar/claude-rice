# Terminal ricing stack around Claude Code (as of 2026-10-14)

Context for the report writer: Claude Code's newest build is v2.1.299 (published 2026-10-14). The npm `stable` tag points at v2.1.287 and `next` at v2.1.300 ([npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)). Mods launched in v2.1.287 ("Added Claude Mods: plugins may now modify deeper behavior"), published 2026-10-01 ([CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)). All version dates below come from the npm registry's `time` field. GitHub stats come from shields.io badge JSON (for example `https://img.shields.io/github/stars/<owner>/<repo>.json`) fetched on 2026-10-14. That workaround was needed because this session's proxy blocked api.github.com and github.com pages, while raw.githubusercontent.com (READMEs) worked. Shields.io reports "last commit" as relative dates such as "august" or "last thursday", which are converted to 2026 dates here. Reddit was fully blocked (WebFetch refused, WebSearch rejected the reddit.com domain, curl returned 403), so no Reddit post is verified (see Gaps under Q4).

## Q1. Which terminal emulators work best with Claude Code in 2026?

### Takeaway
Ghostty and kitty get the most built-in support. Both handle Shift+Enter natively, send desktop notifications by default (over SSH too), and are the only two terminals where Claude Code draws mod `Image` elements as real pictures. Ghostty also shows the tab/dock progress bar. iTerm2 is a close macOS alternative: notifications need a one-time setup, the progress bar needs v3.6.6+, and it is the only non-tmux route to agent-team split panes. WezTerm, Alacritty 0.16+ and foot handle keyboard input well but have no built-in notification channel. Warp needs its official plugin. VS Code/Cursor, JetBrains, Windows Terminal and tmux are where flicker and rendering bugs concentrate. The general fix for those is Claude Code's fullscreen (alt-screen) renderer, which has been the default for new users since May 6, 2026.

### Cited Findings

**Official baseline (code.claude.com, current for v2.1.299)**
- "Claude Code works in any terminal without configuration". The terminal-config page is organized by symptom: Shift+Enter, Option key, bell/notification, tmux, Windows Backspace, flicker, Vim — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Shift+Enter support table, verbatim: "Ghostty, Kitty, iTerm2, WezTerm, Warp, Apple Terminal, Windows Terminal — Works without setup"; "Other terminals that support the kitty keyboard protocol, such as foot and Alacritty 0.16 or later — Works without setup. Requires Claude Code v2.1.269 or later"; "VS Code, Cursor, Devin Desktop, Alacritty before 0.16, Zed — Run `/terminal-setup` once"; "gnome-terminal, JetBrains IDEs such as PyCharm and Android Studio — Not available; use Ctrl+J or `\` then Enter" — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Ctrl+J, or `\` then Enter, inserts a newline in every terminal with no setup. Run `/terminal-setup` in the host terminal, not inside tmux/screen, because it writes the host terminal's config — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- In VS Code, Cursor and Devin Desktop, `/terminal-setup` also sets `terminal.integrated.gpuAcceleration` to `"off"` ("to prevent garbled text") and sets `terminal.integrated.mouseWheelScrollSensitivity`. Set GPU acceleration back to `"auto"` to undo — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Notifications: "By default Claude Code sends a desktop notification only in Ghostty, Kitty, and iTerm2." Elsewhere, set `"preferredNotifChannel": "terminal_bell"` or use a Notification hook. "The desktop notification reaches your local machine over SSH". Ghostty and Kitty forward it with no extra setup. iTerm2 needs Settings → Profiles → Terminal → "Notification Center Alerts" → "Filter Alerts" → "Send escape sequence-generated alerts" — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- `preferredNotifChannel` values: `auto` (desktop notification in iTerm2, Ghostty and Kitty; rings the bell in Terminal.app only when its audible bell is off; does nothing elsewhere), `terminal_bell`, `iterm2`, `iterm2_with_bell`, `kitty`, `ghostty`, `notifications_disabled` — [Settings reference](https://code.claude.com/docs/en/settings-reference)
- The terminal progress bar (`terminalProgressBarEnabled`, default true) is reported "only in terminals that support the indicator: ConEmu, Ghostty 1.2.0 or later, and iTerm2 3.6.6 or later". It stays visible while background subagents or workflows run — [Settings reference](https://code.claude.com/docs/en/settings-reference)
- Session status via OSC 7501 (Program Status Protocol): "There is nothing to turn on in Claude Code." Requires v2.1.295 or later. Inside tmux, Claude Code checks tmux for support instead of the outer terminal. Background sessions don't report. `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` turns it off — [Terminal config docs](https://code.claude.com/docs/en/terminal-config). v2.1.295 shipped 2026-10-08 ("Added Program Status Protocol (OSC 7501) support") — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- OSC 7501 spec: published 2026-10-06 by Mitchell Hashimoto. Format is `ESC ] 7501 ; state=…:kind=…:app=…:msg=<base64> ESC \`. States are `idle`, `working`, `done`, `blocked` (kinds `permission`, `question`, `auth`), `error` and `clear`, with optional `progress`. Implementations are libghostty (a PR) and Rex; proofs of concept exist for Terraform, Claude Code, Codex and Homebrew. "the terminal decides what to show". Spec: https://www.superlogical.com/rex/docs/build/program-status — [mitchellh.com](https://mitchellh.com/writing/program-status-osc7501)
- A GitHub issue dated 2026-10-06 reportedly describes the spec as draft revision 0.2, libghostty #14560 as an open draft, and the Ghostty app as still ignoring the reports. This comes from a search snippet only; the page was not opened — [omarchy-kettle #23](https://github.com/zzwong/omarchy-kettle/issues/23)

**Rendering, flicker and the fullscreen renderer**
- Fullscreen rendering draws on the alternate screen buffer, renders only visible messages, and keeps memory flat. The gain is "most noticeable in terminal emulators where rendering throughput is the bottleneck, such as the VS Code integrated terminal, tmux, and iTerm2" — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Enable with `/tui fullscreen`, which saves the `tui` setting and relaunches with the conversation intact, or with `CLAUDE_CODE_NO_FLICKER=1`. Revert with `/tui default` or `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen); [Settings reference](https://code.claude.com/docs/en/settings-reference)
- Default renderer: new users whose sessions fetch feature flags and who "first used Claude Code on or after May 6, 2026" start in fullscreen. Without feature flags, a machine whose first launch ran v2.1.239+ also gets fullscreen. iTerm2 `tmux -CC` and SSH-to-Windows sessions get classic — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Fullscreen trade-off: the terminal's `Cmd+f` and tmux search don't see the conversation. In-app alternatives are `Ctrl+o` then `/` to search, `[` to dump the whole conversation into native scrollback, and `v` to open it in `$EDITOR`. Mouse selection copies on release — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- If flicker is the only problem and the terminal supports synchronized output without being auto-detected (e.g. Emacs `eat`), use `CLAUDE_CODE_FORCE_SYNC_OUTPUT=1`. This forces DEC mode 2026 without changing renderer and "Has no effect under tmux" — [Terminal config docs](https://code.claude.com/docs/en/terminal-config); [Env vars](https://code.claude.com/docs/en/env-vars)
- Other rendering knobs:
  - `CLAUDE_CODE_DISABLE_MOUSE=1`: keep native selection.
  - `CLAUDE_CODE_DISABLE_MOUSE_CLICKS=1`: keep wheel scrolling, drop clicks (v2.1.195+).
  - `CLAUDE_CODE_SCROLL_SPEED`: 1–20; `3` matches vim.
  - `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT=1`: for "Windows Terminal and other ConPTY-backed hosts" that leave stale fragments.
  - `CLAUDE_CODE_NONBLOCKING_STDOUT=1`: v2.1.261+, for stalled SSH or paused tmux control-mode panes.

  Sources: [Fullscreen docs](https://code.claude.com/docs/en/fullscreen); [Env vars](https://code.claude.com/docs/en/env-vars)
- `maxProseWidth` (v2.1.282+, minimum 40) wraps prose at N columns in wide terminals. Tables and code keep full width — [Settings reference](https://code.claude.com/docs/en/settings-reference)
- History: `CLAUDE_CODE_NO_FLICKER` was added in v2.1.89 (2026-03-31). `/tui` and the `tui` setting were added in v2.1.110 (2026-04-15) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Images, hyperlinks, true color**
- A mod's `Image` element is drawn as a picture only when Claude Code detects kitty graphics with Unicode placeholders. "it succeeds in kitty 0.28 or later and in Ghostty". It fails in other terminals, inside tmux or screen ("kitty and Ghostty included"), and in background sessions. `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` skips detection — [Mods gallery docs](https://code.claude.com/docs/en/plugins/mods/gallery)
- OSC 8 hyperlinks are on only when support is detected. `FORCE_HYPERLINK=1` forces them on. The value is parsed as a number, so `false` turns them **on** — [Env vars](https://code.claude.com/docs/en/env-vars). File-path hyperlinks arrived in v2.1.2 (2026-01-08). Wrapped long URLs stay clickable since v2.1.113. Warp markdown links were fixed in v2.1.283 (2026-09-25). Hovered links are underlined in fullscreen since v2.1.296 (2026-10-09) — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- True color: "By default, Claude Code clamps to 256 colors when `$TMUX` is set." Fix it with `set -ga terminal-overrides ',*:Tc'` plus `CLAUDE_CODE_TMUX_TRUECOLOR=1`. Even `0` or `false` enables truecolor; unset the variable to disable — [Env vars](https://code.claude.com/docs/en/env-vars)
- v2.1.105 (2026-04-13) "Fixed washed-out 16-color palette when using Ghostty, Kitty, Alacritty, WezTerm, foot, rio, or Contour over SSH/mosh" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Ghostty** (62k★, MIT, Zig — [repo](https://github.com/ghostty-org/ghostty))
- Shift+Enter works without setup. Desktop notifications are on by default and forwarded from SSH sessions — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Progress bar requires Ghostty 1.2.0+ — [Settings reference](https://code.claude.com/docs/en/settings-reference)
- Images: yes, mod `Image` elements are drawn — [Mods gallery docs](https://code.claude.com/docs/en/plugins/mods/gallery)
- In fullscreen, a plain click on a link opens it. Claude Code detects that Ghostty forwards Cmd+click — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Ghostty options relevant to Claude Code:
  - `desktop-notifications` (default true): handles OSC 9 and OSC 777.
  - `progress-style` (default true): handles ConEmu OSC 9;4 progress bars.
  - `macos-option-as-alt`: needed for Claude's Option shortcuts.
  - `bell-features`: `system`, `audio` (macOS 1.3.0+), `attention`, `title`, and `border` (1.2.0 GTK / 1.2.1 macOS).

  Source: [Ghostty config reference](https://ghostty.org/docs/config/reference)
- Fix history:
  - v2.1.69 (2026-03-04): Shift+Enter printing `[27;2;13~` over SSH.
  - v2.1.85 (2026-03-26): terminal left in enhanced keyboard mode after exit.
  - v2.1.181 (2026-06-17): spinner glyph size.
  - v2.1.187 (date not checked) and v2.1.191 (2026-06-24): Cmd+click in fullscreen, including over ssh/tmux.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Limitation: agent-team split panes are "not supported in VS Code's integrated terminal, Windows Terminal, or Ghostty" — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Community comparison table (one blogger, no benchmarks), from Andrew Baker's 2026-06-05 post:
  - Ghostty: notifications "Yes, by default"; the only one with a global quick terminal.
  - Kitty: notifications "Yes".
  - WezTerm and Alacritty: notifications "Manual setup".
  - Alacritty: no native splits or tabs.

  Source: [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)

**kitty** (35k★, GPL-3.0, latest v0.49.2, released October 2026 — [repo](https://github.com/kovidgoyal/kitty))
- Shift+Enter works without setup. Desktop notifications by default — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Mod images work in kitty 0.28+ — [Mods gallery docs](https://code.claude.com/docs/en/plugins/mods/gallery)
- kitty 0.47.0 (2026-05-19): "Draw a progress bar at the top of the window when a program reports progress using the OSC 9;4 escape sequence". kitty 0.49.0 (2026-09-21) added custom shaders. 0.49.2 (2026-10-01) added a `cursor-trail-motion-blur` shader — [kitty changelog](https://sw.kovidgoyal.net/kitty/changelog/)
- Claude Code's docs list progress-bar support only for ConEmu, Ghostty and iTerm2 — [Settings reference](https://code.claude.com/docs/en/settings-reference). v2.1.128 (2026-05-04) "Fixed stray "4;0;" desktop notification on every `/exit` in Kitty and other terminals that interpret OSC 9 as a notification" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Agent-state tab titles: a June 2026 guide (updated 2026-09-02) wires Claude hooks to `kitten @ set-tab-title`. Needs `allow_remote_control socket-only` and `listen_on unix:@kitty`. Markers: 🌱 start, 💭 thinking, ⚙ tool, ❓ permission, ✔ done, 🧹 compacting — [flurdy.com](https://flurdy.com/docs/kitty-ai-tabs/)

**iTerm2** (macOS)
- Shift+Enter is native. For Option shortcuts, set Settings → Profiles → Keys → General → Left/Right Option = "Esc+". `/terminal-setup` turns on "Applications in terminal may access clipboard" so `/copy` works, and detects iTerm2 even from inside tmux — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Fullscreen needs "Enable mouse reporting" per profile. Fullscreen is incompatible with `tmux -CC` integration mode (the wheel does nothing and double-click can corrupt terminal state); plain tmux inside iTerm2 is fine — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Native agent-team split panes require the `it2` CLI and iTerm2 → Settings → General → Magic → Enable Python API (`teammateMode: "iterm2"`) — [Agent teams docs](https://code.claude.com/docs/en/agent-teams). it2: 290★, GPL-2.0, Python, v0.2.3 — [mkusaka/it2](https://github.com/mkusaka/it2)
- Fixes:
  - v2.1.89 (2026-03-31): streaming jitter in iTerm2 inside tmux.
  - v2.1.111 (2026-04-16): tearing in iTerm2 + tmux when notifications are sent.
  - v2.1.292 (2026-10-06): "Fixed fullscreen mode sending a full-screen clear on every window resize and Ctrl+L when iTerm2 is detected, which may be what filled iTerm2's scrollback with stale pages".

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**WezTerm** (29k★; the last stable release is still 20240203 (Feb 2024), so recent fixes reach users only through nightly builds — [repo](https://github.com/wezterm/wezterm), shields.io release-date)
- Official docs say Shift+Enter works without setup — [Terminal config docs](https://code.claude.com/docs/en/terminal-config). **Contradicted** by issue #52683, opened 2026-04-24: on Windows 11 with WSL2 and WezTerm `20240203`, WezTerm's default Shift+Enter sends a plain `\r`, so the message submits. Suggested fix: `config.keys = { { key = "Enter", mods = "SHIFT", action = wezterm.action.SendString("\x1b\r") } }`. The bot closed it as "not planned" on 2026-05-28 with no maintainer reply — [GitHub #52683](https://github.com/anthropics/claude-code/issues/52683)
- Kitty-keyboard regressions affected WezTerm: v2.1.166 (2026-06-05) fixed Shift+non-ASCII being dropped, and v2.1.269 (2026-09-11) fixed "Shift+punctuation typing the unshifted key in WezTerm (regression in 2.1.247)" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- `preferredNotifChannel` has no WezTerm option, so use `terminal_bell` or a hook — [Settings reference](https://code.claude.com/docs/en/settings-reference)

**Alacritty** (66k★, Apache-2.0, latest v0.17.0, released April 2026 — [repo](https://github.com/alacritty/alacritty))
- 0.16+ gets Shift+Enter through the kitty keyboard protocol on Claude Code ≥ v2.1.269. Older versions need `/terminal-setup` — [Terminal config docs](https://code.claude.com/docs/en/terminal-config). v2.1.269 (2026-09-11): "terminals that answer the kitty keyboard query (such as foot and Alacritty 0.16+) now get Shift+Enter and Ctrl+Shift shortcuts" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Earlier, kitty-protocol use was "gated on terminal name allow list". This was reported as a bug — [issue mirror #71700](https://claudeissues.com/issue/71700-bug-kitty-keyboard-protocol-gated-on-terminal-name-allow-list-instead-of-csi-u-c)

**Warp**
- Shift+Enter works without setup — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Warp does not receive Claude's desktop notification, so use a hook or the bell — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Warp's own integration (docs updated 2026-10-12):
  - Auto-detects Claude Code and offers a plugin install chip (requires `jq`).
  - Manual install: `/plugin marketplace add warpdotdev/claude-code-warp` then `/plugin install warp@claude-code-warp`.
  - Features: in-app and desktop notifications, `Ctrl-G` rich input editor, vertical-tab status indicators, inline code-review comments, Tab Configs and Remote Control.
  - Limitation: Claude sessions don't appear in Warp's Conversation and Agent Management panels.

  Source: [Warp docs](https://docs.warp.dev/agent-platform/third-party-agents/claude-code)
- The plugin sends structured JSON over OSC 777 to `warp://cli-agent` from Stop and Notification hooks. 233★, MIT, Shell, last commit ~2026-10-08 — [warpdotdev/claude-code-warp](https://github.com/warpdotdev/claude-code-warp)
- Fixes:
  - v2.1.47 (2026-02-18): Warp wrongly prompting for Shift+Enter setup.
  - v2.1.97 (2026-04-08): Shift+Enter in NO_FLICKER mode.
  - v2.1.198 (2026-07-01): Cmd+click in fullscreen.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Windows Terminal / WSL**
- Shift+Enter is native — [Terminal config docs](https://code.claude.com/docs/en/terminal-config). v2.1.89 (2026-03-31) fixed Shift+Enter on Windows Terminal Preview 1.25. v2.1.282 (2026-09-24) shows `ctrl+x ctrl+s` as the send-now hint on Windows Terminal before 1.25 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- If Backspace deletes whole words, the terminal is sending `^H`. Set `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE=0` — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Stale fragments in fullscreen: use `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT=1`, which is enabled automatically for background sessions and agent view on Windows — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Fixes:
  - v2.1.81 (2026-03-20): disabled line-by-line streaming on Windows, including WSL in Windows Terminal.
  - v2.1.179 (2026-06-16): WSL2 mouse-wheel regression.
  - v2.1.183 (2026-06-19): fullscreen corruption under heavy nested-subagent load.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Community flicker and corruption reports on WSL: v2.1.19 era, closed Jan 2026 — [mirror #20784](https://claudeissues.com/issue/20784-screen-flickering-persists-in-v2-1-19-on-wsl2-ubuntu-22-and-windows-10-cmd); June 2026, where resizing the window helps temporarily — [mirror #68667](https://claudeissues.com/issue/68667-bug-terminal-display-corruption-in-wsl-requiring-window-resize-to-recover)
- No agent-team split panes on Windows Terminal — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)

**VS Code / Cursor integrated terminal (xterm.js)**
- Needs `/terminal-setup` for Shift+Enter, which also disables GPU acceleration. On macOS, add `"terminal.integrated.macOptionIsMeta": true`. Large pastes can drop characters, so use a file. No desktop notification; use a hook or the bell — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Flicker is most visible here. The terminal sends one wheel event per notch, so `CLAUDE_CODE_SCROLL_SPEED=3` is suggested. Hold Shift (or Option with `macOptionClickForcesSelection`) for native selection — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Fixes:
  - v2.1.116 (2026-04-20): scattered blank cells while scrolling.
  - v2.1.126 (2026-04-30): too-fast trackpad scrolling in VS Code 1.92–1.104 and Cursor.
  - v2.1.157 (2026-05-29): `/terminal-setup` now disables GPU acceleration, and right-click paste no longer duplicates.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- No agent-team split panes — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)

**JetBrains IDE terminal**
- No Shift+Enter; use Ctrl+J or `\`+Enter — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Claude Code applies its own scroll handling there and ignores `CLAUDE_CODE_SCROLL_SPEED`. It auto-mitigates 2025.2 wheel bugs ("upgrade to 2025.3 or later"), and `/scroll-speed` is unavailable — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Fixes:
  - v2.1.166 (2026-06-05): "Fixed flickering in JetBrains IDE terminals … on 2026.1+ by enabling synchronized output".
  - v2.1.239 (2026-08-21): fixed ~5s pauses on Edit/Write when the plugin is connected.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Apple Terminal and others**
- Apple Terminal: Shift+Enter works. Accepting the first-run setup prompt runs `/terminal-setup`, which enables Option-as-Meta and turns off the audible bell (since v2.1.211 it keeps the bell in screen-reader mode) — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Apple Terminal fixes:
  - v2.1.110 (2026-04-15): garbled startup in Terminal.app and other terminals without synchronized output.
  - v2.1.142 (2026-05-14): background-color bleed in Apple Terminal and other 256-color-only terminals.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- gnome-terminal has no Shift+Enter. foot works via the kitty keyboard protocol. Zed is handled by `/terminal-setup` (it merges into `keymap.json` with a backup). Emacs `eat` needs `CLAUDE_CODE_FORCE_SYNC_OUTPUT=1` — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- v2.1.269 fixed synchronized output being assumed from the terminal name in GNOME Terminal and Konsole versions that lack it. v2.1.296 fixed a stray `52;c;…` sequence after copying in older VTE terminals such as MATE Terminal — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**cmux** (agent-focused terminal emulator; multi-session management itself is covered elsewhere)
- "A Ghostty-based macOS terminal with vertical tabs and notifications for AI coding agents". Panes get a blue "notification ring" and tabs light up when an agent needs attention. It reads `~/.config/ghostty/config`. `cmux claude-teams` "runs Claude Code's teammate mode… Teammates spawn as native splits… No tmux required". Install with `brew tap manaflow-ai/cmux` or the DMG. 28k★, Swift, last commit 2026-10-14, license "not identifiable" per shields.io — [manaflow-ai/cmux](https://github.com/manaflow-ai/cmux)

### Inferences
- Synthesized matrix (from the findings above; ✓ = built in, ~ = needs setup or a plugin, ✗ = not available):

| Terminal | Shift+Enter | Desktop notif. (default) | Progress bar | Mod images | Agent-team split panes | Main caveat |
|---|---|---|---|---|---|---|
| Ghostty | ✓ | ✓ (also over SSH) | ✓ (1.2.0+) | ✓ | ✗ (use tmux inside) | OSC 7501 not yet shown by the Ghostty app (snippet-level) |
| kitty | ✓ | ✓ | unclear (kitty draws OSC 9;4; Claude docs don't list kitty) | ✓ (0.28+) | ✗ (use tmux) | — |
| iTerm2 | ✓ | ~ (enable alerts filter) | ✓ (3.6.6+) | ✗ | ✓ (`it2` + Python API) | No fullscreen in `tmux -CC`; needs mouse reporting |
| WezTerm | ✓ officially / disputed on WSL2 | ~ (bell/hook) | ✗ | ✗ | ✗ (use tmux) | Stable build from 2024 |
| Alacritty | ✓ (0.16+, CC ≥2.1.269) | ~ | ✗ | ✗ | ✗ | No tabs/splits |
| Warp | ✓ | ~ (official plugin) | ✗ | ✗ | ✗ | Sessions not in Warp agent panels |
| Windows Terminal | ✓ | ~ | ✗ | ✗ | ✗ | ConPTY repaint, `^H` Backspace |
| VS Code/Cursor | ~ (`/terminal-setup`) | ~ | ✗ | ✗ | ✗ | Flicker; GPU accel off |
| JetBrains | ✗ (Ctrl+J) | ~ | ✗ | ✗ | ✗ | Upgrade to 2025.3+/2026.1+ |

- Best picks by platform: on macOS, Ghostty (or cmux if you want agent-aware chrome), with iTerm2 if you want native agent-team splits without tmux. On Linux, Ghostty or kitty, with foot or Alacritty 0.16+ as minimal options. On Windows, Windows Terminal running WSL, plus `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT=1` if you see artifacts. This follows from which terminals the docs whitelist for notifications, images and progress, and from where the changelog concentrates fixes.
- Because many 2026 users now default to the alt-screen renderer, "native scrollback" ricing (tmux copy-mode, Cmd+F, Kitty hints) needs either `/tui default` or the `Ctrl+o` → `[` dump habit. This affects how people should judge terminal search features.
- Observation from the v2.1.299 binary's strings (reverse-engineered, minified, so treat as unverified): an OSC table names `SEMANTIC_PROMPT:133`, `GHOSTTY:777`, `ITERM2_PROPRIETARY:1337`, `KITTY:99`, `PROGRAM_STATUS:7501` and `TAB_STATUS:21337`. Hyperlink-style version gating appears for iTerm.app ≥3.1, WezTerm ≥20200620 and VS Code ≥1.72, with Ghostty always enabled. Startup probes include "kittyKeyboard", "programStatus" and "kittyGraphics" (local `strings` on /opt/claude-code/bin/claude).

### Gaps
- No independent, measured rendering or latency benchmarks of Claude Code across terminals were found; the community comparisons are qualitative.
- Whether Claude Code currently sends OSC 9;4 progress to kitty 0.47+ is unverified. The docs list only ConEmu, Ghostty and iTerm2.
- Which terminals visibly display OSC 7501 status today is unconfirmed. A search snippet says Mitchell Hashimoto's Mastodon post claims kitty shows it in the tab title, but the post returned HTTP 502 when fetched. The Ghostty app reportedly ignores it so far.
- WezTerm Shift+Enter: the official docs and issue #52683 conflict, and it is unclear whether nightly WezTerm on macOS/Linux behaves differently from the WSL2 report.
- `TAB_STATUS` (OSC 21337) appears in the binary, but its purpose and target terminal are unknown.
- Reddit sentiment (r/ClaudeAI, r/ClaudeCode, r/commandline) on "best terminal" could not be read because reddit.com was blocked.

## Q2. Fonts and color schemes, and how they interact with Claude Code's own themes

### Takeaway
Claude Code never changes the terminal's palette. For an automatically matched rice, pick `dark-ansi`/`light-ansi` so Claude Code draws only with your terminal's 16 ANSI colors (Catppuccin, Tokyo Night, Gruvbox and so on). Alternatively, use `"theme": "auto"` to follow light/dark switching. For exact matching, write a custom theme JSON in `~/.claude/themes/` (available since v2.1.118, 2026-04-22). Inside tmux, hex colors get clamped to 256 colors unless you enable truecolor. Claude Code's own UI does not need a Nerd Font; icon-heavy status bars and tmux plugins do, and several Nerd-Font/Private-Use-Area glyph bugs have been reported.

### Cited Findings
- "Claude Code does not control the terminal's own color scheme". `/theme` "auto" detects a light or dark background and follows OS appearance changes when the terminal does — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- `theme` values:
  - `auto`, `dark` (default), `light`
  - `dark-daltonized`, `light-daltonized`
  - `dark-ansi` and `light-ansi`: "the dark/light theme using only your terminal's ANSI color palette"
  - `custom:<slug>` or `custom:<plugin>:<slug>`

  Source: [Settings reference](https://code.claude.com/docs/en/settings-reference)
- Custom themes:
  - Each is `~/.claude/themes/<slug>.json` with optional `name`, `base` (any built-in preset, including `dark-ansi`/`light-ansi`) and `overrides`.
  - Colors accept `#rrggbb`, `#rgb`, `rgb(r,g,b)`, `ansi256(n)` or `ansi:<name>` (e.g. `ansi:cyanBright`).
  - Files hot-reload. Invalid values are ignored.
  - Tokens: `claude`, `text`, `promptBorder`, `planMode`, `diffAdded`/`diffRemoved` and their word/dimmed variants, `userMessageBackground`, `selectionBg`, the `*Shimmer` pairs, `<color>_FOR_SUBAGENTS_ONLY`, and `rainbow_<color>` for the `ultrathink` gradient.

  Source: [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Official Dracula example, verbatim: `{"name": "Dracula", "base": "dark", "overrides": {"claude": "#bd93f9", "error": "#ff5555", "success": "#50fa7b"}}` — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
- Custom themes were introduced in v2.1.118 (2026-04-22): "Create and switch between named custom themes from `/theme`, or hand-edit JSON files in `~/.claude/themes/`; plugins can also ship themes via a `themes/` directory" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- tmux truecolor clamp: Claude Code clamps to 256 colors when `$TMUX` is set, unless `CLAUDE_CODE_TMUX_TRUECOLOR` is set and tmux has `set -ga terminal-overrides ',*:Tc'` — [Env vars](https://code.claude.com/docs/en/env-vars)
- ANSI and palette fixes:
  - v2.1.105 (2026-04-13): washed-out 16-color palette over SSH/mosh in Ghostty, Kitty, Alacritty, WezTerm, foot, rio and Contour.
  - v2.1.139 (2026-05-11): hyperlinks were "unreadable dark navy on dark themes"; they now adapt.
  - v2.1.141 (2026-05-13): light-ansi used invisible white for diff context lines.
  - v2.1.280 (2026-09-22): no hover highlight on light and ANSI themes.
  - v2.1.287 (2026-10-01): better prompt-border contrast in light themes.
  - v2.1.299 (2026-10-14): a mod's `dimColor` looked like plain text "under the dark ANSI theme and on 16-color terminals".

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Community claim: the terminal profile's palette "only takes effect when Claude Code is set to `dark-ansi`"; other themes use hardcoded RGB — [blog.vincentqiao.com](https://blog.vincentqiao.com/en/posts/claude-code-theme/). An older report (Claude Code 2.1.76) found prompts, selection highlights and permission dialogs using hardcoded 24-bit RGB that bypassed the ANSI palette — [GitHub #39369](https://github.com/anthropics/claude-code/issues/39369)
- To turn off syntax colors that clash: `CLAUDE_CODE_SYNTAX_HIGHLIGHT=false` (diffs) or the `syntaxHighlightingDisabled` setting (code blocks too) — [Env vars](https://code.claude.com/docs/en/env-vars)
- Recommended combo from one 2026 setup (Andrew Baker, 2026-06-05):
  - Ghostty font: `font-family = JetBrainsMonoNerdFont`, `font-size = 14`, `font-thicken = true`, `adjust-cell-height = 2`.
  - Ghostty theme: `theme = light:Catppuccin Latte,dark:Catppuccin Mocha` with `window-theme = auto`.
  - Claude Code: `"theme": "auto"` in `~/.claude/settings.json` "so it tracks Ghostty's mode".
  - Font install on macOS: `brew install --cask font-jetbrains-mono-nerd-font`.

  Source: [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)
- Ligatures: in Ghostty, `font-feature = -calt` disables programming ligatures, and `-calt, -liga, -dlig` disables most ligatures — [Ghostty config reference](https://ghostty.org/docs/config/reference)
- kitty can borrow Nerd glyphs without a patched font: `symbol_map U+E725 Symbols Nerd Font Mono` (used for a git-branch icon in tab titles) — [flurdy.com](https://flurdy.com/docs/kitty-ai-tabs/)
- Nerd Fonts in the plugin ecosystem: claude-tmux-status's `nerd-font` icon theme "Requires a patched font", while its `minimal` theme is plain text — [mitchmalone/claude-tmux-status](https://github.com/mitchmalone/claude-tmux-status). Nerd Fonts: 65k★, v3.5.1 — [ryanoasis/nerd-fonts](https://github.com/ryanoasis/nerd-fonts)
- Reported glyph problems (issue mirrors of anthropics/claude-code):
  - v2.1.150 drew some UI letters as Nerd Font icons, suspected to be new Private Use Area code points; workaround was rolling back to 2.1.147 — [mirror #62177](https://claudeissues.com/issue/62177-v2-1-150-ui-renders-nerd-font-icons-instead-of-text-characters-in-terminals-usin)
  - Nerd Font PUA glyphs blank in statusline and chat — [mirror #49270](https://claudeissues.com/issue/49270-nerd-font-unicode-characters-not-rendered-in-claude-code-ui-statusline-chat-file)
  - Windows statusline PUA glyphs shown as "?" after 2.1.23 — [mirror #22457](https://claudeissues.com/issue/22457-bug-custom-statusline-nerd-font-powerline-characters-render-as-after-v2-1-23-win)
  - Spinner `✳` (U+2733) double-width on Windows, July 2026 — [mirror #76424](https://claudeissues.com/issue/76424-spinner-glyph-u-2733-renders-double-width-on-windows-shifting-the-whole-status-l)
  - Spinner small-caps glyphs show as tofu in many fonts, including VS Code defaults — [mirror #59123](https://claudeissues.com/issue/59123-spinner-uses-small-caps-unicode-codepoints-that-render-as-tofu-in-many-fonts)
- Font fixes in the changelog:
  - v2.1.181 (2026-06-17): spinner pulse on the wrong glyph size in Ghostty.
  - v2.1.236 (2026-08-19): the Clawd mascot rendered unevenly in iTerm2 at some font sizes.
  - v2.1.299 (2026-10-14): several CJK and emoji width and wrapping bugs.

  Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Themed multiplexer bars:
  - tmux-claude-monitor uses catppuccin/tmux's `@thm_red`, `@thm_maroon` and `@thm_peach` to animate the "working" dot, with fallbacks to `colour1/3/2/8/208` — [FlavianMF/tmux-claude-monitor](https://github.com/FlavianMF/tmux-claude-monitor). catppuccin/tmux: 3.2k★, MIT, v2.3.1 — [catppuccin/tmux](https://github.com/catppuccin/tmux)
  - zjbar is "A Zellij status bar plugin with a Tokyo Night powerline theme" — [imroc/zjbar](https://github.com/imroc/zjbar)
  - Omarchy 3.4 (2026-02-26) added the Miasma, Vantablack and White themes and refreshed the default Tokyo Night wallpaper — [Linuxiac](https://linuxiac.com/arch-based-omarchy-linux-3-4-released/)
- `maxProseWidth` (v2.1.282+) keeps prose readable on ultrawide or tiled windows — [Settings reference](https://code.claude.com/docs/en/settings-reference)

### Inferences
- Two recipes, synthesized from the docs:
  1. **Zero-maintenance match.** Set your terminal scheme (Catppuccin, Tokyo Night, Dracula, Gruvbox, Rosé Pine, Nord, etc.) and run `/theme` → `dark-ansi` (or `light-ansi`). Claude's accents then come from your palette, it works over SSH and in 256-color tmux without truecolor tweaks, and a scheme switch recolors Claude automatically. Some elements may still use hardcoded RGB per #39369, so check permission dialogs.
  2. **Pixel-perfect match.** Write `~/.claude/themes/<scheme>.json` with `base: "dark"` and override `claude`, `promptBorder`, `planMode`, `diffAdded`, `diffRemoved` and `userMessageBackground` with your scheme's hex values. Inside tmux, also set `CLAUDE_CODE_TMUX_TRUECOLOR=1` and the `Tc` override, or the hex values get quantized to 256 colors.
  - Illustrative Catppuccin Mocha theme. **The hex values come from memory of Catppuccin's published palette and were not re-verified in this session; check them at catppuccin.com/palette.** `{"name":"Catppuccin Mocha","base":"dark","overrides":{"claude":"#cba6f7","promptBorder":"#89b4fa","planMode":"#94e2d5","error":"#f38ba8","success":"#a6e3a1","warning":"#f9e2af","userMessageBackground":"#313244"}}`
- Fonts: any good monospace font works for Claude Code itself. Choose a Nerd Font (JetBrains Mono, FiraCode, etc.) only when your statusline, tmux or Zellij bar, or prompt uses icons. On Windows, prefer `minimal`/plain-text icon themes given the PUA "?" and double-width reports. Ligature fonts are purely cosmetic and no Claude-specific ligature bugs were found.
- On Windows, the spinner-width and tofu reports suggest a font with good coverage of Dingbats (U+2733) and small-caps code points.

### Gaps
- No official or community "Claude Code theme pack" repos for popular schemes were verified. `catppuccin/claude-code` does not exist per shields.io on 2026-10-14. Plugin-shipped themes are covered by other researchers.
- Whether every UI element follows the ANSI palette in `dark-ansi` as of v2.1.299 is not confirmed. #39369 predates later fixes.
- No sourced "most popular font with Claude Code" data. Reddit polls could not be accessed.

## Q3. tmux and Zellij setups for Claude Code

### Takeaway
tmux has an official config baseline: passthrough, extended keys, and mouse for fullscreen. Add `Tc` plus `CLAUDE_CODE_TMUX_TRUECOLOR` for true color, and upgrade to tmux 3.7+, which added synchronized output (less flicker) and OSC 9;4 progress forwarding. tmux 3.8 (Sept 2026) adds floating and modal panes, which suit scratchpad Claude popups. The status-bar plugin ecosystem is lively but young; the most-starred is tmux-agent-indicator with 99★. Claude Code itself can tile agent-team teammates into tmux panes. Zellij gets no official guidance; a few small Claude status plugins exist, and Claude Code's images, OSC 7501 and synchronized-output features don't pass through multiplexers.

### Cited Findings

**Official tmux baseline**
- Verbatim, with `tmux source-file ~/.tmux.conf` to apply. "allow-passthrough" lets notifications and progress reach the outer terminal; the "extended-keys" lines let tmux distinguish Shift+Enter — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
  ```
  set -g allow-passthrough on
  set -s extended-keys on
  set -as terminal-features 'xterm*:extkeys'
  ```
- Fullscreen mouse wheel needs `set -g mouse on`, and Claude prints a one-time hint if mouse mode is off. "tmux releases through the 3.6 series don't implement synchronized output… If you see flicker under tmux, upgrade to the newest tmux or run Claude Code in its own terminal tab outside tmux" — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- v2.1.200 (2026-07-03) claimed a flicker fix under tmux 3.4+. v2.1.212 (2026-07-16) "Corrected… tmux through the 3.6 series lacks synchronized output; newer tmux with support is detected automatically" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- tmux 3.7 CHANGES: "Add support for applications to use synchronized output mode (DECSET 2026) to prevent screen tearing during rapid updates", "Respond to DECRQM 2026", "Handle OSC 9;4 progress bar sequence and store in format variables", and "Add ability to forward progress bar to outside terminal" — [tmux CHANGES](https://github.com/tmux/tmux/blob/master/CHANGES)
- tmux 3.8 CHANGES:
  - "Many improvements to floating panes", including modal panes via `new-pane -O`, with `-C` to close on outside click, `-K` to send all keys and `-D` to close on Escape/C-c.
  - `new-pane -A` floats above zoomed panes.
  - break/join floating panes.
  - OSC 133 now triggers `pane-command-started`/`-finished` hooks.
  - New `switch-mode` fast switcher.

  Source: [tmux CHANGES](https://github.com/tmux/tmux/blob/master/CHANGES). tmux v3.8 was released September 2026 (shields.io release-date); 50k★, ISC — [tmux/tmux](https://github.com/tmux/tmux)
- True color in tmux: `set -ga terminal-overrides ',*:Tc'` plus `CLAUDE_CODE_TMUX_TRUECOLOR=1`. Otherwise Claude clamps to 256 colors — [Env vars](https://code.claude.com/docs/en/env-vars). v2.1.77 (2026-03-16) fixed background colors rendering as terminal-default inside tmux with the default configuration — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Passthrough history: v2.1.78 (2026-03-17) "Terminal notifications (iTerm2/Kitty/Ghostty popups, progress bar) now reach the outer terminal when running inside tmux with `set -g allow-passthrough on`" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- What doesn't pass through tmux: OSC 7501 status (Claude checks tmux itself) — [Terminal config docs](https://code.claude.com/docs/en/terminal-config); mod `Image` pictures ("inside tmux or screen… doesn't help") — [Mods gallery docs](https://code.claude.com/docs/en/plugins/mods/gallery); forced sync output ("Has no effect under tmux") — [Env vars](https://code.claude.com/docs/en/env-vars)
- Copy and scrollback: in fullscreen, selection copies to the system clipboard and, inside tmux, "also writes to the tmux paste buffer". Over SSH it falls back to OSC 52. In fullscreen, tmux search can't see the conversation; use `Ctrl+o` then `[` to write it into native scrollback for tmux copy-mode. `/tui default` keeps native scrollback and copy-mode working "as usual" — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
- Clipboard fixes: v2.1.157 (2026-05-29) fixed copy-on-select inside tmux with `set-clipboard on`. v2.1.176 (2026-06-12) fixed `/copy` and selection copy over SSH inside tmux, and loading the tmux paste buffer on tmux older than 3.2 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Key timing: v2.1.265 (2026-09-08) changed two-key shortcuts that were "cancelling silently when the second key arrived more than a second later, as happens inside tmux"; they now wait 3 seconds — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- tmux `-CC` and iTerm integration: fullscreen is incompatible with `tmux -CC` — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen). v2.1.236 (2026-08-19) stopped tab titles "jumping in tmux (iTerm tmux integration)"; the title is now written only when its text changes. v2.1.122 fixed idle-status redraws flooding `tmux -CC` control pipes — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Claude Code's own tmux features (built in)**
- Agent teams (experimental; `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):
  - Split-pane display mode: "each teammate gets its own pane… Requires tmux, or iTerm2".
  - `teammateMode`: `"in-process"` (default), `"auto"` (split panes when already inside tmux or iTerm2 with `it2`), `"tmux"`, `"iterm2"`, or the experimental `--teammate-mode auto` flag.
  - Clean up orphans with `tmux ls` and `tmux kill-session -t <name>`.
  - Docs note "`tmux` has known limitations on certain operating systems and traditionally works best on macOS. Using `tmux -CC` in iTerm2 is the suggested entrypoint".

  Source: [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- `claude --worktree <name>` starts an isolated worktree session, and running it again in another terminal starts a second one — [Worktrees docs](https://code.claude.com/docs/en/worktrees). A `--worktree --tmux` combination exists per changelog entries v2.1.157, v2.1.251 and v2.1.281 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md). The worktrees page doesn't document `--tmux`.
- v2.1.145 (2026-05-19) "Added `claude agents --json` to list live Claude sessions as JSON for scripting (tmux-resurrect, status bars, session pickers)" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Terminal title as a state signal: Claude Code prefixes the OSC title with a braille spinner (U+2800–U+28FF) while working and `✳` (U+2733) when idle. herdr (an agent-aware multiplexer) matches these with regex rules. A 2026-06-15 regression report was closed the same day as herdr's problem to fix — [GitHub #68643](https://github.com/anthropics/claude-code/issues/68643). v2.1.228 (2026-08-11) "Updated terminal title busy-spinner glyphs to reduce tab-bar jitter" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**tmux status-bar plugins for Claude Code** (stats from shields.io on 2026-10-14; repo links are the sources)
- **accessd/tmux-agent-indicator**: 99★, MIT, Shell, last commit Aug 2026.
  - Tracks `running`, `needs-input` and `done` from Claude/Codex hooks (`UserPromptSubmit`, `PermissionRequest`, `Stop`) and OpenCode.
  - Surfaces state through pane borders, window-title colors, status-bar icons and an optional "Knight Rider animation during `running` state", with a process-detection fallback.
  - Install: `curl -fsSL https://raw.githubusercontent.com/accessd/tmux-agent-indicator/main/install.sh | bash`, which edits `~/.claude/settings.json` hooks, or TPM `set -g @plugin 'accessd/tmux-agent-indicator'`.
  - Demo screenshots at `docs/images/needs-input.png`, `done.png` and `done-pane-bg.png`.

  Source: [repo](https://github.com/accessd/tmux-agent-indicator)
- **FlavianMF/tmux-claude-monitor**: 0★, MIT, Shell, last commit Sep 2026.
  - Status-line dots: "pulsing red while working, yellow waiting, green done, grey idle". Clickable or menu-pickable to jump to a pane.
  - Uses hooks plus the Claude daemon's `~/.claude/jobs/<id>/state.json`; "no polling, no transcript parsing".
  - TPM install `set -g @plugin 'FlavianMF/tmux-claude-monitor'`, then merge `hooks/settings-snippet.json`. Options such as `@claude_monitor_show_elapsed`.

  Source: [repo](https://github.com/FlavianMF/tmux-claude-monitor)
- **mitchmalone/claude-tmux-status**: 0★, no license, Shell, last commit Oct 2026.
  - A Claude Code plugin that suffixes the tmux window name with 😴 idle, 🤖 processing or 👀 needs attention.
  - Install: `/plugin marketplace add https://github.com/mitchmalone/claude-tmux-status.git` then `/plugin install tmux-status`.
  - `/tmux-icons nerd-font` switches to Nerd Font icons.

  Source: [repo](https://github.com/mitchmalone/claude-tmux-status)
- **long-910/tmux-claude-status**: 6★, MIT, Python, last commit May 2026.
  - Shows usage and rate limits rather than state.
  - TPM `set -g @plugin 'long-910/tmux-claude-status'` with `@claude-tmux-dashboard-key "B"`.
  - Manual: `set -g status-right "#(claude-usage short) | %H:%M %Y-%m-%d"` and `bind B display-popup -E -w 82 -h 90% "claude-usage dashboard"`. The popup needs tmux 3.2+.

  Source: [repo](https://github.com/long-910/tmux-claude-status)
- **mikeydotio/tmux-status**: 0★, MIT, Python, last commit Sep 2026.
  - A "3-line tmux status bar" with model, effort, context % (via an installed Claude `statusLine` hook bridge), quota bars and git.
  - Install: `curl -fsSL https://raw.githubusercontent.com/mikeydotio/tmux-status/main/install.sh | bash`.

  Source: [repo](https://github.com/mikeydotio/tmux-status)
- A search result listed "XavierYounan/tmux-status"; shields.io reports **repo not found**, so it is unverified and probably misattributed — [search result page](https://claudemods.dev/en/builds/tmux-status-109acf)
- Supporting tools: TPM has 15k★, MIT — [tmux-plugins/tpm](https://github.com/tmux-plugins/tpm). catppuccin/tmux has 3.2k★ — [repo](https://github.com/catppuccin/tmux)

**Layouts and launch patterns**
- Two-pane split: Claude Code left (~70%), shell right (~30%). Three-pane: Claude plus editor on top, test shell below. One tab per repo, restored with `window-save-state = always` (macOS only, per Ghostty docs). Also a `~/ghostty-tmux-claude.sh` script that "Creates or attaches a tmux session with Claude on the left and a shell on the right" — [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/); [Ghostty config reference](https://ghostty.org/docs/config/reference)
- Omarchy 3.4 (2026-02-26): "Tmux is installed by default… via a simple t alias". The helpers `tdl`, `tdlm` and `tsl` give "predefined layouts for agent-assisted and multi-pane development". Claude Code is included by default, with a `cx` alias "in accept-all mode" — [Linuxiac](https://linuxiac.com/arch-based-omarchy-linux-3-4-released/)

**Zellij** (36k★, MIT, v0.45.1 released Aug 2026 — [zellij-org/zellij](https://github.com/zellij-org/zellij))
- Claude Code's docs give no Zellij configuration guidance (the terminal-config page covers tmux only) — [Terminal config docs](https://code.claude.com/docs/en/terminal-config). The only Zellij changelog entry found is v2.1.97 (2026-04-08), "Fixed scroll rendering artifacts in `NO_FLICKER` mode when running inside zellij" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **thoo/claude-code-zellij-status** (cc-zjstatus): 43★, no license, Shell, last commit Jan 2026.
  - "Monitor Claude Code activity across multiple Zellij panes in real-time via zjstatus". zjstatus notifications for done, asking and permission-needed events. Yellow `●` (`#ffdc00`) means working.
  - Install: `claude plugin marketplace add https://github.com/thoo/claude-code-zellij-status.git`, `claude plugin install cc-zjstatus`, then `cp default.kdl $HOME/.config/zellij/layouts/default.kdl`.

  Source: [repo](https://github.com/thoo/claude-code-zellij-status)
- **imroc/zjbar**: 2★, MIT, Rust, v1.2.0, last commit Mar 2026.
  - A Tokyo Night powerline status bar with clickable tabs and optional agent activity indicators, "permission flash", desktop notifications and click-to-focus.
  - Agents bridge to it via `zellij pipe`. Launch with `zellij --layout zjbar`.

  Source: [repo](https://github.com/imroc/zjbar)
- **Yceforp/cc-zellij-tab-status**: 0★, MIT, Shell, last commit Apr 2026. Suffixes tab names with `●` working, `✓` done or `⚠` permission. Requires Zellij ≥ 0.42 (`rename-tab-by-id`). Install via `claude plugin marketplace add …` and `claude plugin install cc-zellij-tab-status` — [repo](https://github.com/Yceforp/cc-zellij-tab-status)
- **delorenj/claude-notifications**: 6★, JavaScript, last commit May 2026. Has a Zellij integration that pipes events into a `zellij_visual_notifications` plugin: animated pane borders, a status-bar widget, tab badges, and Ctrl+N to clear — [repo](https://github.com/delorenj/claude-notifications); [integration doc on unpkg](https://unpkg.com/@delorenj/claude-notifications@2.2.1/worktrees/doctor-von-code-audio-bounds/INTEGRATION.md)
- zjstatus itself: 1.1k★, MIT, Rust, v0.25.0 released Aug 2026 — [dj95/zjstatus](https://github.com/dj95/zjstatus)
- Gentleman.Dots' installer offers "Tmux, Zellij, Herdr" as multiplexers alongside Claude Code — [Gentleman.Dots](https://github.com/Gentleman-Programming/Gentleman.Dots)

### Inferences
- Recommended `~/.tmux.conf` block for Claude Code, synthesized. The first four lines are official. The `Tc` line comes from the env-var docs. `set-clipboard on` is referenced in the changelog. **The popup and pane-title lines are untested suggestions.**
  ```
  set -g allow-passthrough on                 # notifications + progress bar reach outer terminal
  set -s extended-keys on                     # Shift+Enter newline
  set -as terminal-features 'xterm*:extkeys'
  set -g mouse on                             # wheel scrolling in fullscreen renderer
  set -ga terminal-overrides ',*:Tc'          # + export CLAUDE_CODE_TMUX_TRUECOLOR=1
  set -g set-clipboard on
  # untested: scratchpad Claude in a popup at the current path
  bind C display-popup -E -w 85% -h 85% -d "#{pane_current_path}" "claude"
  # untested: show Claude's OSC title (braille spinner = working, ✳ = idle) on each pane border
  set -g pane-border-status top
  set -g pane-border-format " #{pane_index} #{pane_title} "
  ```
- Use tmux ≥ 3.7, and ideally 3.8 for floating or modal scratch panes, to reduce flicker under the classic renderer. Claude only uses synchronized output when tmux reports it.
- For "is Claude done?" signals, a free option is reading the pane title, since Claude already emits state glyphs. The hook-based plugins add colors and animation, and the daemon-state-based one (tmux-claude-monitor) avoids hook parsing. All are young (≤99★); choose by how much they write to `~/.claude/settings.json`.
- Zellij users lose the iTerm2/tmux-only agent-team split panes, mod images, and OSC 7501. Run Claude in a plain pane, test Shift+Enter (fall back to Ctrl+J), and use cc-zjstatus or zjbar for state.

### Gaps
- Shift+Enter, kitty-keyboard and notification passthrough behaviour inside Zellij is undocumented. Searches found nothing Zellij-specific.
- tmux 3.7's exact release date was not verified; only 3.8's month (Sept 2026) was.
- `--worktree --tmux` behaviour isn't documented on the worktrees page, which was fetched in full; the CLI reference page was not fetched.
- herdr (an agent-aware multiplexer) was seen only through #68643 and Gentleman.Dots. Its repo stats and features were not verified.

## Q4. Showcase setups worth copying

### Takeaway
No r/unixporn-style Claude Code showcase could be verified because Reddit was entirely blocked from this environment. The verifiable showcases are blog posts with full configs (a Ghostty+Catppuccin+Nerd Font setup and a kitty agent-tab-title setup), a whole-OS rice that ships Claude Code (Omarchy, 45k★), a dotfiles installer that includes Claude Code (Gentleman.Dots, 2k★), and plugin or terminal repos with polished screenshots (cmux, tmux-agent-indicator, Ghostty cursor shaders). What makes them look good is one palette everywhere (terminal, tmux or Zellij bar, Claude theme), Nerd Font icons in the bars, padding with translucency and blur, and colored agent-state signals in tabs and pane borders.

### Cited Findings
- **Andrew Baker, "Ghostty… for Claude Code: Config, Splits, and Scripts" (2026-06-05).** Full Ghostty config:
  - JetBrains Mono Nerd Font 14 and `font-thicken`.
  - Catppuccin Latte/Mocha auto theme.
  - `background-opacity = 0.9`, `background-blur-radius = 20` and `window-padding-x = 10` / `-y = 8`.
  - Bar cursor, `copy-on-select = clipboard` and `scrollback-limit = 100000`.
  - A top quick terminal with a global `super+grave_accent` toggle.
  - Split keybinds (`super+d`, `super+shift+d`, `ctrl+h/j/k/l`).
  - Claude settings with `"preferredNotifChannel": "ghostty"` and an `afplay` (macOS) or `paplay` (Linux) Notification hook.
  - Bootstrap scripts (`~/ghostty-bootstrap.sh`, `setup-ghostty-claude.sh` Finder Quick Action, `~/ghostty-tmux-claude.sh`).

  Source: [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)
- The same author has a 2026-05-12 iTerm2-focused piece, "Claude Code Terminal Setup: iTerm2, CLAUDE.md, and the Configuration Most Guides Skip". Seen in search results only, not read — [andrewbaker.ninja](https://andrewbaker.ninja/2026/05/12/claude-code-terminal-setup-iterm2-claude-md-and-the-configuration-most-guides-skip/)
- **flurdy "kitty AI tabs" (June 2026, updated 2026-09-02).** Emoji state markers in kitty tab titles driven by Claude hooks through kitty remote control, with a `printf '\e]30;%s\a'` fallback, plus a Nerd-glyph `symbol_map` — [flurdy.com](https://flurdy.com/docs/kitty-ai-tabs/)
- **Omarchy** ("a beautiful, fun & agentic Linux distribution by DHH"): 45k★, MIT, v4.0.4, last commit 2026-10-14 — [basecamp/omarchy](https://github.com/basecamp/omarchy). Ships Claude Code by default with a `cx` alias, tmux layout helpers, and themes such as Tokyo Night, Miasma and Vantablack — [Linuxiac](https://linuxiac.com/arch-based-omarchy-linux-3-4-released/)
- **Gentleman.Dots**: 2k★, Apache-2.0, Shell, last commit ~2026-10-11.
  - A TUI installer (screenshot in README) for Ghostty, WezTerm, Kitty or Alacritty; Tmux, Zellij or Herdr; Fish, Zsh or Nushell; Neovim; and Claude Code or OpenCode.
  - AI configs ("persona, skills, themes, MCP") moved to a separate `gentle-ai` installer.
  - Install: `brew install Gentleman-Programming/tap/gentleman-dots`.

  Source: [repo](https://github.com/Gentleman-Programming/Gentleman.Dots)
- **cmux screenshots**: `docs/assets/notification-rings.png`, `vertical-horizontal-tabs-and-splits.png` and `claude-code-teams.png` in [manaflow-ai/cmux](https://github.com/manaflow-ai/cmux)
- **Official terminal screenshots** of Claude Code panes drawn by mods (text, markdown, diff, raster grids; light and dark) are in the mods gallery, hosted on mintcdn — [Mods gallery docs](https://code.claude.com/docs/en/plugins/mods/gallery)
- Small Ghostty+Claude setup repos (low adoption):
  - ShaneZhong/ghostty-claude-setup: 5★, TypeScript, last commit Mar 2026 — [repo](https://github.com/ShaneZhong/ghostty-claude-setup)
  - helloayushisharma/ghostty-claude-code-setup: 4★, MIT, a Claude Code plugin — [repo](https://github.com/helloayushisharma/ghostty-claude-code-setup)
  - luoxikang/ghostty-for-claude-code: 1★. It claims to follow "Boris Cherny's workflow", which is unverified — [repo](https://github.com/luoxikang/ghostty-for-claude-code)
  - mjonyh/config: 1★, Catppuccin across Zsh, Tmux and Neovim, with screenshots — [repo](https://github.com/mjonyh/config)
- A search surfaced "thepushkarp/dotfiles" (Ghostty + Catppuccin Mocha tmux + Claude Code settings) via a mirror, but shields.io reports **repo not found**, so it is unverified — [mirror](https://backiee.wasmer.app/https_github_com/thepushkarp/dotfiles)

### Inferences
- The most copyable "complete look" is Andrew Baker's Ghostty config, plus catppuccin/tmux and tmux-agent-indicator or tmux-claude-monitor, plus Claude `theme: auto` (or `dark-ansi`). Each piece is documented with exact lines above.
- For people who want an OS-level rice rather than a terminal one, Omarchy is the highest-adoption option that bundles Claude Code (45k★).

### Gaps
- r/unixporn, r/ClaudeAI, r/ClaudeCode, r/tmux and r/commandline posts could not be read. WebFetch refused reddit.com and old.reddit.com, WebSearch rejected the domain, and curl got 403 or 302. Upvote counts, screenshot links and comment sentiment remain unverified.
- No first-party description of Boris Cherny's (Claude Code creator) personal terminal setup was found.
- No widely starred (>100★) dotfiles repo specifically showcasing a Claude Code rice was verifiable, since GitHub search was blocked by the session proxy.

## Q5. Shell integration: prompts, aliases, wrappers and launch scripts

### Takeaway
No established Starship module or Powerlevel10k segment for Claude Code was found. Claude-specific info lives in Claude Code's own status line (covered by other researchers) or in tmux and Zellij bars. The useful shell-level hook is `CLAUDECODE=1`, which Claude Code sets in the processes it spawns. Use it to keep heavy interactive prompt or plugin init (p10k instant prompt, zoxide `cd` overrides) out of the Bash tool's shell. For launching, the patterns that circulate are worktree-per-session (`claude --worktree`), tmux launch scripts, and Omarchy's `cx` alias.

### Cited Findings
- `CLAUDECODE=1` is set in child-process environments: the v2.1.299 binary builds child env with `CLAUDECODE:"1"`, `CLAUDE_CODE_SESSION_ID` and `CLAUDE_CODE_CHILD_SESSION` (local `strings` inspection). v2.1.154 (2026-05-28) "Stdio MCP server subprocesses now receive `CLAUDE_CODE_SESSION_ID` and `CLAUDECODE=1`" — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- A NixOS config patch notes "Claude Code sets CLAUDECODE=1 in all subprocesses it spawns" and uses it to skip a zoxide `cd` override that broke the Bash tool — [patch](https://gitea.hillion.co.uk/JakeHillion/nixos/pulls/1157.patch)
- Shell snapshot: v2.1.51 made the Bash tool skip login shells (`-l`) when a snapshot is available. v2.1.147 (2026-05-21) fixed snapshots dropping functions whose names start with `_`, which broke aliases referencing them — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- A user reported Claude Code using `/bin/zsh` despite a bash login shell and fixed it with `CLAUDE_CODE_SHELL` in settings (per search snippet) — [GitHub #24573](https://github.com/anthropics/claude-code/issues/24573)
- Starship: 60k★, ISC, v1.26.0. Powerlevel10k: 55k★, MIT, v1.20.0 — [starship/starship](https://github.com/starship/starship); [romkatv/powerlevel10k](https://github.com/romkatv/powerlevel10k). Searches for a Claude Code module or segment returned only generic custom-module guides — [search: claude-plugins.dev starship skill](https://claude-plugins.dev/skills/@majiayu000/claude-skill-registry/starship-config)
- Terminal title and session naming: Claude updates the terminal title from conversation context. `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` disables that, the background request that names the session, and OSC 7501 status — [Env vars](https://code.claude.com/docs/en/env-vars)
- Screenshot hygiene: `CLAUDE_CODE_HIDE_CWD=1` hides the working directory in the startup logo, "useful for screenshares or recordings where the path exposes your OS username" — [Env vars](https://code.claude.com/docs/en/env-vars)
- Notification hook commands: macOS `afplay /System/Library/Sounds/Glass.aiff` — [Terminal config docs](https://code.claude.com/docs/en/terminal-config). Linux `paplay /usr/share/sounds/freedesktop/stereo/complete.oga` — [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)
- Ghostty shell integration: `shell-integration-features = cursor,sudo,title` in Baker's config — [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/). Ghostty docs add `ssh-env` and `ssh-terminfo` (1.2.0), which give remote hosts proper terminfo — [Ghostty config reference](https://ghostty.org/docs/config/reference)
- Over SSH without `TERM_PROGRAM` forwarded, `CLAUDE_CODE_FORCE_STRIKETHROUGH=1` and `FORCE_HYPERLINK=1` restore strikethrough and links — [Env vars](https://code.claude.com/docs/en/env-vars)
- Launch patterns:
  - `claude --worktree feature-auth`, one per terminal tab, or `claude --worktree "#1234"` for a PR — [Worktrees docs](https://code.claude.com/docs/en/worktrees)
  - `CLAUDE_CODE_NO_FLICKER=1 claude`, or persist it via `"env"` in settings — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
  - Omarchy `cx` (accept-all mode) — [Linuxiac](https://linuxiac.com/arch-based-omarchy-linux-3-4-released/)
  - Baker's `ghostty-tmux-claude.sh` and a Finder Quick Action that opens Claude in Ghostty for a folder — [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/)
- Deep links: Claude Code can be launched from `claude-cli://` URLs, e.g. from dashboards or runbooks. Only the page title was seen in the docs index; the page was not read — [Deep links docs](https://code.claude.com/docs/en/deep-links)

### Inferences
- `.zshrc` guard (**untested; adapt rather than blindly `return`**, since aliases defined later would be lost from Claude's snapshot):
  ```zsh
  if [[ -z "$CLAUDECODE" ]]; then
    # interactive-only extras: p10k instant prompt, zoxide's cd override, fancy plugins
    source ~/.p10k.zsh            # example
    eval "$(zoxide init zsh)"     # example
  fi
  ```
- Starship custom module (**untested**). It would only be visible in shells spawned under Claude, so its real use is debugging. For "Claude info in my prompt", a tmux or Zellij status segment is the more reliable place.
  ```toml
  [custom.claude]
  when = '[ -n "$CLAUDECODE" ]'
  symbol = "✻ "
  style = "bold #d97757"
  format = "[$symbol]($style)"
  ```
- Handy aliases (**suggestions, not sourced practice**): `alias cl='claude'`, `alias clw='claude --worktree'`, and `alias clf='CLAUDE_CODE_NO_FLICKER=1 claude'` (or `claude` with `/tui fullscreen` persisted).

### Gaps
- No verified Starship or p10k plugin showing Claude session state, cost or context. If any exist, they weren't indexed.
- p10k instant-prompt interactions with Claude's Bash tool are inferred from the zoxide case, not directly reported.
- Fish and Nushell specifics weren't researched beyond Gentleman.Dots supporting them.

## Wow / flex factor

### Takeaway
The most show-off-worthy setups combine:
- GPU post-processing in the terminal: Ghostty `custom-shader` GLSL (CRT, bloom, starfield, Matrix, cursor trails), and since kitty 0.49.0 (2026-09-21) kitty custom shaders and cursor trails.
- Translucency, blur and background images (Ghostty 1.2.0+).
- One palette shared by the terminal, tmux or Zellij bar and Claude theme.
- A tiled wall of agents whose panes and tabs change color by state.
- Claude Code's own fullscreen UI: diff panel, mod sidebars, mod `Image` elements drawn as real pictures in kitty and Ghostty.

Setup effort is mostly minutes (clone, then one config line). The costs are GPU/CPU per focused surface, VRAM per terminal for background images, and readability.

### Cited Findings
- **Ghostty cursor shaders (sahaj-b/ghostty-cursor-shaders)**: 1.2k★, MIT, GLSL, last commit Oct 2026.
  - Trails: `cursor_warp` ("Neovide-like… most customizable"), `cursor_sweep` and `cursor_tail` ("mimicing kitty terminal's cursor_trail").
  - Pulse/boom: `sonic_boom_cursor`, `ripple_cursor`, `rectangle_boom_cursor` and `ripple_rectangle_cursor` (Ghostty only).
  - Kitty ports of the trails need kitty ≥ 0.49.
  - Install: `git clone https://github.com/sahaj-b/ghostty-cursor-shaders ~/.config/ghostty/shaders`, then `custom-shader = shaders/ghostty/<name>.glsl` (stackable). With the default line cursor, effects "freeze on unfocus", so add `custom-shader-animation = always`.
  - Demo GIFs are embedded in the README.

  Source: [repo](https://github.com/sahaj-b/ghostty-cursor-shaders)
- **Full-screen effect collection (hackr-sh/ghostty-shaders, formerly 0xhckr)**: 1.5k★, no license specified, GLSL, last commit Jul 2026.
  - Verified files: `bloom`, `crt`, `bettercrt`, `retro-terminal`, `in-game-crt`, `starfield`, `starfield-colors`, `matrix-hallway`, `inside-the-matrix`, `cursor_blaze`, `galaxy`, `underwater`, `water`, `glitchy`, `glow-rgbsplit-twitchy`, `tft`, `dither`, `just-snow`, `fireworks`, `animated-gradient-shader`, `gradient-background`, `spotlight`, `drunkard`, `negative` and `sparks-from-fire`. All are `.glsl` and were checked via raw.githubusercontent.com (HTTP 200).
  - Install: `git clone --depth 1 https://github.com/hackr-sh/ghostty-shaders`, copy `<choice>.glsl` to `~/.config/ghostty/shaders/shader.glsl`, then `custom-shader = ~/.config/ghostty/shaders/shader.glsl`.

  Source: [repo](https://github.com/hackr-sh/ghostty-shaders)
- **Shader preview tool**: KroneCorylus/ghostty-shader-playground, 501★, MIT — [repo](https://github.com/KroneCorylus/ghostty-shader-playground)
- **A layered personal stack (Vulpes)**: cursor trail, then a "red-selective bloom" that "makes error messages and warnings subtly glow", then vignette, then an LCD texture. Order matters, and shaders hot-reload with Cmd+Shift+, — [archive.ejfox.com](https://archive.ejfox.com/wiki/Vulpes_Shader_System)
- **Ghostty shader costs, verbatim**:
  - `custom-shader-animation` "uses slightly more CPU (generally less than 10%)… Note that this will use more CPU per terminal surface and can become quite expensive".
  - "Invalid shaders can cause Ghostty to become unusable such as by causing the window to be completely black."
  - Shaders can be changed at runtime.

  Source: [Ghostty config reference](https://ghostty.org/docs/config/reference)
- **kitty**: custom shaders since 0.49.0 (2026-09-21). A new `cursor-trail-motion-blur` shader in 0.49.2 (2026-10-01). Cursor-trail tuning (`cursor_trail_start_threshold`) in 0.48.0 (2026-07-18) — [kitty changelog](https://sw.kovidgoyal.net/kitty/changelog/)
- **Translucency, blur and padding**:
  - Baker uses `background-opacity = 0.9`, `background-blur-radius = 20` and window padding — [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/).
  - Current Ghostty docs document `background-blur` (an intensity value) and the fetched reference shows no `background-blur-radius`, so the article's key name may be outdated. Docs warn "Higher blur intensities may cause strange rendering and performance issues". Only some Linux desktop environments are supported ("All other Linux desktop environments are as of now unsupported"). On macOS, opacity is disabled in native fullscreen and changing it requires a full restart.

  Source: [Ghostty config reference](https://ghostty.org/docs/config/reference)
- **Background images**: Ghostty 1.2.0+ `background-image` (PNG or JPEG) with `-opacity`, `-position`, `-fit` and `-repeat`. Warning: "Background images are currently duplicated in VRAM per-terminal" — [Ghostty config reference](https://ghostty.org/docs/config/reference)
- **Drop-down "quake" Claude**: `quick-terminal-position = top` plus `keybind = global:super+grave_accent=toggle_quick_terminal` — [andrewbaker.ninja](https://andrewbaker.ninja/2026/06/05/ghostty-is-the-terminal-claude-code-deserves/). "There is no default keybind for toggling the quick terminal", and on macOS changing the position requires a restart — [Ghostty config reference](https://ghostty.org/docs/config/reference)
- **Tiled multi-agent walls**:
  - Agent-team split panes put each teammate in its own pane under tmux or iTerm2 — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
  - `cmux claude-teams` spawns teammates "as native splits with sidebar metadata and notifications", with blue notification rings — [manaflow-ai/cmux](https://github.com/manaflow-ai/cmux)
  - tmux-agent-indicator colors pane borders and backgrounds by state and has a "Knight Rider animation during `running` state" — [accessd/tmux-agent-indicator](https://github.com/accessd/tmux-agent-indicator)
  - tmux-claude-monitor's working dot pulses through Catppuccin shades — [FlavianMF/tmux-claude-monitor](https://github.com/FlavianMF/tmux-claude-monitor)
  - Warp shows per-tab Claude status in vertical tabs — [Warp docs](https://docs.warp.dev/agent-platform/third-party-agents/claude-code)
  - tmux 3.8 floating and modal panes — [tmux CHANGES](https://github.com/tmux/tmux/blob/master/CHANGES)
- **Claude Code-native visual flex**:
  - Fullscreen renderer: mouse, clickable expand, `/diff` panel "beside the conversation", transcript search — [Fullscreen docs](https://code.claude.com/docs/en/fullscreen)
  - A mod pane is "a sidebar beside the transcript in a wide fullscreen terminal". `Raster` draws colored cell grids "for a heat map, a sparkline, or a game board". `Image` draws PNG or raw pixels in kitty 0.28+ and Ghostty — [Mods gallery docs](https://code.claude.com/docs/en/plugins/mods/gallery)
  - Theme tokens include the `ultrathink` "seven-color rainbow gradient" (`rainbow_<color>` and `_shimmer`) and eight subagent colors — [Terminal config docs](https://code.claude.com/docs/en/terminal-config)
  - Tab and dock progress bars appear in Ghostty 1.2.0+ and iTerm2 3.6.6+ — [Settings reference](https://code.claude.com/docs/en/settings-reference)
- **Cursor interplay**: `CLAUDE_CODE_NATIVE_CURSOR=1` shows "the terminal's own cursor at the input caret instead of a drawn block" and "respects the terminal's blink, shape, and focus settings" — [Env vars](https://code.claude.com/docs/en/env-vars). A Ghostty discussion reported that a cursor shader "only works with block cursor" — [ghostty discussion #7865](https://github.com/ghostty-org/ghostty/discussions/7865)
- **Whole-desktop rice with Claude built in**: Omarchy, a Hyprland-based Arch distro: 45k★, v4.0.4, default Tokyo Night look plus Miasma, Vantablack and White themes, Claude Code preinstalled with tmux layouts — [basecamp/omarchy](https://github.com/basecamp/omarchy); [Linuxiac](https://linuxiac.com/arch-based-omarchy-linux-3-4-released/)

### Inferences
- Effort, payoff and cost for each technique (synthesized; the costs come from the cited docs):

| Technique | Why it impresses | Effort | Cost / risk |
|---|---|---|---|
| Ghostty cursor trail (`cursor_warp` + ripple) | Motion on every keystroke; reads instantly in GIFs | ~5 min | <10% CPU per focused surface (Ghostty docs); set `custom-shader-animation = always` for line cursor |
| Ghostty CRT/bloom/retro-terminal | Instantly "unixporn"; bloom makes Claude's red error text glow | ~5 min | Readability; per-surface GPU/CPU; a bad shader can black-screen the window |
| Starfield/galaxy/matrix animated backgrounds | High wow in screenshots and recordings | ~5 min | Continuous animation cost; distracting for long sessions |
| kitty 0.49 custom shaders / cursor trail | Same flex without leaving kitty | ~5 min | Requires kitty ≥0.49 (Sept 2026) |
| Opacity 0.85–0.9 + blur + padding | The classic macOS/KDE glass look | 2 min | Blur perf warning; Linux DE limits; disabled in macOS native fullscreen |
| Background image | Personalized wallpaper behind Claude | 2 min | VRAM duplicated per terminal |
| One palette everywhere (`theme = light:…,dark:…` + Claude `auto`/`dark-ansi` + catppuccin/tmux) | Coherent look that auto-switches day/night | 15–30 min | Inside tmux, set truecolor or hex themes clamp to 256 |
| Agent wall: tmux + agent-team split panes + state-colored borders | Several Claudes visibly working in parallel | 30–60 min | Experimental agent teams; token cost scales per teammate |
| cmux notification rings | Polished, native-looking agent cockpit | 5 min (install) | macOS only |
| Fullscreen Claude + `/diff` panel + mod sidebar or `Image` | Dashboard-like Claude in one window | 5–10 min | Alt-screen hides native scrollback; images only in kitty/Ghostty outside tmux |
| Quake-style drop-down Claude | Summon Claude over any app | 2 min | macOS restart needed to change position |

- For cursor shaders to follow the Claude prompt caret, `CLAUDE_CODE_NATIVE_CURSOR=1` is probably needed, because by default Claude draws its own block cursor. Combined with a block `cursor-style`, this should make trails track typing in the input box. **Untested.**
- The best screenshot recipe: hide the path (`CLAUDE_CODE_HIDE_CWD=1`), cap prose width (`maxProseWidth: 80–100`) so text blocks look composed on wide displays, use fullscreen so the input box stays anchored, and show a tiled agent wall with colored state borders.
- Keep the flex reversible. Shaders and blur can be toggled at runtime in Ghostty (reload), so a common pattern is a "presentation" config include versus a "work" config. This is an inference; config-include mechanics weren't researched here.

### Gaps
- No measured FPS, CPU or battery numbers for specific shaders while Claude streams output, beyond Ghostty's "<10% CPU" guidance.
- Whether Ghostty or kitty cursor shaders track Claude Code's caret with `CLAUDE_CODE_NATIVE_CURSOR=1` (or the default drawn block) is unverified.
- Reddit could not be accessed, so the actual r/unixporn "Claude Code" posts and their screenshot links are unknown.
- Whether a cursor trail has shipped in Ghostty core (a maintainer said they'd look into it in [discussion #6901](https://github.com/ghostty-org/ghostty/discussions/6901)) is unknown.
