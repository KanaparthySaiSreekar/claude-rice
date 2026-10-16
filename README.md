# Claude Code mods and terminal ricing

Deep-dive research into **Claude Code mods** and everything the community does to customize ("rice") the Claude Code terminal so it looks great, keeps you informed, and has some wow factor. It is compiled from the official docs, GitHub, Reddit, Hacker News, YouTube, X and blogs, and is current as of **October 14, 2026** (Claude Code v2.1.299).

**Start here → [Mods Turn Claude Code Into a Canvas](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md)**, the full report (about 7,850 words, about 250 inline citations).

- **Second report:** [Ricing Claude Code in October 2026](reports/Ricing%20Claude%20Code%20in%20October%202026.md) is an independent write-up of the same topic (about 40 KB, 67 numbered sources). It is shorter, leans on catalogs and secondary coverage, and ends with a curated **Linux** setup (Ghostty or kitty). Read it as a cross-check on the first.
- **Applied:** [`v1-win/`](v1-win/) is the first setup actually built from these reports, on Windows 11 with Windows Terminal. It has the config files, the two local patches to pinned mods, and a note on where the build deliberately departs from the reports, and why. It is also tagged `v1-win`.

## TL;DR

- **Mods are the new extension type that can draw on Claude Code itself.** They launched on October 1, 2026 in v2.1.287, on by default. A mod is a plugin whose JavaScript or TypeScript "hooks module" runs inside Claude Code's process. It can draw panes, a band above the prompt, toasts and a status line, restyle the spinner, tool rows and messages, draw pixel graphics and real images (kitty or Ghostty), play audio, and rewrite or answer events such as tool calls and prompts.
- **The ecosystem exploded but is immature.** An independent scanner catalogued 3,836 mods within two weeks. 1,203 of the 1,909 repos hosting them have zero stars, 1,566 mods can run host processes, and 50 fail validation.
- **Verdict: worth using now for visibility and ambience, not for anything you'd trust to guard production.**
  - Mods are not sandboxed.
  - Mod UI appears only in the terminal and the Desktop app (not the VS Code chat panel, `claude -p` or cloud sessions).
  - The best visuals need Ghostty or kitty, the fullscreen renderer, a wide window, and no tmux.
  - Install one mod per surface, and read `claude plugin validate` output before installing.
- **Ricing is a layered stack.** Build it in this order:
  1. Ghostty or kitty.
  2. One shared palette (`auto`/`dark-ansi`, or a custom `~/.claude/themes/*.json`).
  3. The built-in fullscreen renderer, spinner verbs, tips and output styles.
  4. A two-line status line: model, effort and branch on one line; context and 5-hour/7-day quota on the other.
  5. Sound or notification hooks on `Stop` and `PermissionRequest`.
  6. One band mod, one pane mod and one transcript skin.
  7. Companion tools for history and multi-session state.
- **Biggest wow and flex:** intermission (multiplayer Doom while Claude works), claude-show-your-work (inline screenshots and video of Claude testing your app), terminal-browser, transcript skins (skins, claudinator, prismantis), flightdeck and filetree panes, band companions (naruto, pokemon, galactic-battle), peon-ping voice lines, Ghostty shaders, polished status lines, and pixel-office companions.
- **What lasts:** flourishes that carry a real signal, such as quota and context burn, which session needs you, what the agent is doing, and repo state. Pure decoration gets mocked.

## What's in the report

1. [Mods run inside Claude Code, so only they can draw on it](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#mods-run-inside-claude-code-so-only-they-can-draw-on-it): surfaces, element kit, data, authoring, install, where mods show up, trust model, official samples.
2. [The community shipped 3,836 mods in two weeks, few with any track record](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#the-community-shipped-3836-mods-in-two-weeks-few-with-any-track-record): the awesome-claude-code-mods scan, featured mods, categories, other catalogs, reception, breakage, security findings, verdict.
3. [Ghostty or kitty, one palette and the built-in settings do most of the look](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#ghostty-or-kitty-one-palette-and-the-built-in-settings-do-most-of-the-look): terminal comparison, fullscreen renderer, themes, fonts, spinner verbs and tips, output styles, tmux, shell.
4. [Status lines, hooks and companion tools carry the information](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#status-lines-hooks-and-companion-tools-carry-the-information): status line payload and tool comparison, hook recipes, built-in `/usage`, `/context` and `/insights`, trackers, dashboards, session viewers.
5. [The biggest flexes put pixels, people or a voice in the terminal](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#the-biggest-flexes-put-pixels-people-or-a-voice-in-the-terminal): a ranked table of 12 showpieces with what each costs you.
6. [Three setups to adopt, from zero-risk to full demo mode](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#three-setups-to-adopt-from-zero-risk-to-full-demo-mode): copy-paste Ghostty, `settings.json`, mod install and tmux configs.
7. [Conclusion](reports/Claude%20Code%20mods%20and%20terminal%20ricing.md#conclusion): what lasts, and the gaps where a personal mod would be both useful and new.

## Five-minute wins

Each of these is covered with sources in the report.

1. Run `/tui fullscreen` for flicker-free output and room for mod panes.
2. Add `spinnerVerbs` (and `spinnerTipsOverride`) to `~/.claude/settings.json` to give the spinner some personality.
3. Type `/statusline show model name and context percentage with a progress bar` and Claude writes the script.
4. Hook `Stop` and `PermissionRequest` (not `Notification`, which waits 6 to 60 seconds) to a sound or a notification.
5. Ask Claude: *"make a mod that shows the current git branch above the prompt"*. The built-in `plugin-authoring` skill builds it with hot reload. Copy it out of `~/.claude/dev-mods/` to keep it.

## Research notes

The report is synthesized from eight source-cited notes in [`research_notes/Claude Code mods and terminal ricing/`](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/). Each note has Takeaway, Cited Findings, Inferences and Gaps for every question, plus a **Wow / flex factor** section. They hold far more detail than the report, such as per-mod install commands and wow ratings, a 21-tool status line table, and full hook recipes.

| Notes | What they cover |
|---|---|
| [official_mod_system.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/official_mod_system.md) | Official mod docs: surfaces, API, file layout, install and management, security model, launch timeline, built-in and sample mods |
| [community_mods_catalog.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/community_mods_catalog.md) | Analysis of the awesome-claude-code-mods scan; about 135 mods profiled across 14 categories with install commands and 1–5 wow ratings; other catalogs; gaps |
| [status_lines.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/status_lines.md) | `statusLine` settings and full payload, a comparison of 21 community tools, popular designs, pitfalls, what mods changed |
| [look_and_feel_and_hooks.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/look_and_feel_and_hooks.md) | Themes, output styles, spinner and tips, rendering, keybindings, notifications; 33 hook events; sound, TTS and push recipes |
| [terminal_ricing_stack.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/terminal_ricing_stack.md) | Terminal emulators compared, flicker fixes, fonts, color schemes, tmux and Zellij, shell integration, Ghostty shaders |
| [insight_and_companion_tools.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/insight_and_companion_tools.md) | Built-in insight commands, usage and cost trackers, OpenTelemetry dashboards, session viewers, multi-session managers, pixel-office visualizers |
| [community_reddit_hn_github.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/community_reddit_hn_github.md) | Reddit, Hacker News and GitHub issue discussion: notable threads, pain points, most-wanted information, an idea bank, flex posts |
| [community_youtube_x_blogs.md](research_notes/Claude%20Code%20mods%20and%20terminal%20ricing/community_youtube_x_blogs.md) | YouTube, X and blog coverage: launch posts, tutorials, "my setup" write-ups, a 72-idea bank, viral demos |

## How this was researched, and its limits

- **Method:** eight parallel research tracks were synthesized into one report:
  1. The official mod system
  2. Community mods
  3. Status lines
  4. Built-in look and feel and hooks
  5. Terminal ricing
  6. Insight and companion tools
  7. Reddit, Hacker News and GitHub discussion
  8. YouTube, X and blogs

  Every claim in the report links to its source.
- **Nothing was installed or run.** Visual quality rests on each project's own demos and community reactions. A few config details are inferences, not tested, and the report says so where it matters: the `background-blur` value, the macOS `Ping.aiff` sound, and OSC 9 notifications on Windows Terminal and WezTerm.
- **Access limits:**
  - Reddit, X and YouTube pages couldn't be fetched directly. Reddit scores come from archived snapshots and probably undercount October posts.
  - X posts come from search results and secondary articles.
  - YouTube takeaways lean on a published review of 34 videos.
  - GitHub star counts come from badge and mirror services, so some are rounded.
- **Things move fast.** Claude Code ships near-daily. The mods API reference describes v2.1.290 while v2.1.299 is current, so trust the types Claude Code generates locally in `.claude-plugin/types/` over any page.

## Before you install any mod

Mods aren't sandboxed. They run inside Claude Code with your permissions, can see every prompt and tool call, and can approve tool calls.

- Read the `calls:` line from `claude plugin validate`. A cosmetic mod shouldn't need network, process, environment or file access.
- Pin versions, and prefer a personal local marketplace.
- `claude --safe-mode` gives you a vanilla session whenever you need one.

## Repo layout

```
README.md                                         ← you are here
reports/Claude Code mods and terminal ricing.md   ← the full report
reports/Ricing Claude Code in October 2026.md     ← second, independent report (Linux-focused setup)
v1-win/                                           ← checkpoint of the setup applied on Windows 11
  ├── README.md                                   what runs, deviations from the reports, rebuild steps
  ├── config/                                     Claude Code, claude-hud, skin, Windows Terminal, Rio
  ├── patches/                                    the two local patches to pinned mods
  ├── marketplace/                                the pinned-marketplace manifest and provenance table
  └── scripts/setup-rio.ps1
research_notes/Claude Code mods and terminal ricing/
  ├── official_mod_system.md
  ├── community_mods_catalog.md
  ├── status_lines.md
  ├── look_and_feel_and_hooks.md
  ├── terminal_ricing_stack.md
  ├── insight_and_companion_tools.md
  ├── community_reddit_hn_github.md
  └── community_youtube_x_blogs.md
```
