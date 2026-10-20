# Mod shortlist, 2026-10-20: what is worth adding to v7-mac

Seventeen mods, plugins and skill sets asked about after v7 ran on macOS. They are judged for this setup: Claude Code 2.1.304
on an M1 MacBook Pro, Ghostty, the six-tab v7 sidebar, prismantis drawing the chat, the v2 status line, and the
preferences in [`preferences.md`](../../preferences.md) (each reading shown once, no clutter, pin and review every mod).

**Decisions taken the same day:** Secret Box installed (v7-mac). For risky shell commands, Cockpit's guard stays and Blast
Radius is not installed. Nothing else installed yet.

## Method

- Each repository cloned at the commit in the tables below into an isolated folder; nothing installed, nothing run except
  the mods' own test suites for the one that was installed.
- `claude plugin validate` on every mod: a static read that lists each hook and each `$.` call, without running the code.
  The reach columns come from it: `$.http` is network, `$.process` runs programs, `$.model` spends your usage.
- READMEs, manifests and, where it mattered, the hook code read in full (Secret Box: all of `register.jsx` and `redact.ts`).
- GitHub stars, pushes and open issues from the GitHub API on 2026-10-20; reception from the web (most reviews of
  mattpocock/skills read as promotional, so the one hands-on account is weighted).

## mattpocock/skills (Matt Pocock): worth it, selectively

[mattpocock/skills](https://github.com/mattpocock/skills) at `5beb35b` (v1.3.1); docs at
[aihero.dev/skills](https://www.aihero.dev/skills) (the `aihero.dev/s/4arzG4` link redirects there). MIT, free; the site's only
ask is a newsletter. 298k stars, 25k forks, versioned with changesets, in Anthropic's official marketplace
(`claude plugin install mattpocock-skills@claude-plugins-official`), also for Codex, Copilot and Gemini.

- **What it is:** 38 skills (27 in the Claude Code plugin) that encode an engineering flow: grill a plan (`/grill-me`,
  `/grill-with-docs`), a glossary and decision records (`domain-modeling`), a spec and tracer-bullet tickets published to
  GitHub or GitLab issues or local markdown (`/to-spec`, `/to-tickets`, `/triage`, `/wayfinder`), `/implement`, `tdd`,
  `diagnosing-bugs`, `code-review`, `pr`, `/retro`, plus `/handoff`, `/teach` and `/wait-what` (re-pitch a reply that did not land).
- **Safe and light:** markdown only (three bash templates the skills hand you); no hooks, MCP servers or code that runs on
  its own. 16 of the 27 are slash-command only (`disable-model-invocation`); the other 11 put about 565 tokens of names and
  descriptions in every session.
- **Opinionated:** `setup-matt-pocock-skills` writes `docs/agents/*.md`, triage labels and a glossary layout into the repo; the
  spec/ticket flow assumes an issue tracker. Its `code-review` and `research` sit beside Claude Code's own skills of that kind.
- **Evidence:** one week of hands-on use ([Devtalk](https://forum.devtalk.com/t/anyone-tried-mattpocock-skills-for-claude-code-here-is-what-i-found-after-a-week/244771)):
  grilling and diagnosing helped every later session, `tdd` slowed complex UI work, most skills can wait.
- **Verdict:** for code projects (trading-terminal, StockSignal), not for this rice repo. Start with `/grill-me`,
  `/diagnosing-bugs`, `tdd`, `/wait-what` and `/handoff`; the issue-tracker flow only for projects run through GitHub Issues.
  The official plugin updates itself, which breaks the pin rule; pin it in `kasasree-mods`, or copy single skills with
  `npx skills add mattpocock/skills`.

## Ray Amjad's mods

[ray-amjad/claude-code-mods](https://github.com/ray-amjad/claude-code-mods) at `6db48a3`: 80 stars, MIT, ten mods, active
(headless-safety and native-Windows fixes 15-18 Oct). The names asked for map as DreamPath = `dream-pass`, Jev Skills =
`jev-skill-suggestion`.

| Mod | Version | What it does | Reach and cost | Verdict |
|---|---|---|---|---|
| **secret-box** | 0.5.3 | Claude calls `request_secret`, you paste into a masked box, it goes to `.env`, Claude gets a placeholder that turns into the real value only when a local tool runs; about 70 key shapes, entropy and every `.env` secret hidden in tool output and prompts; `git add .env` and commits carrying `.env` refused | fs (only the env file and `.gitignore`), `sleep` and read-only `git`; no network, no model calls | **Installed** (below) |
| diagram-pane | 0.2.6 | Pins every mermaid or ASCII diagram in a pane, keeps a live map of the work, number keys go into boxes, edits through `diagram_get`/`diagram_set` tools | Haiku gate every 3 turns, a session fork when the work changes shape | Try later: the most original; prismantis already draws mermaid in the chat, and it would be a 7th tab (opens unasked from 144 columns) |
| dream-pass | 0.2.1 | Consolidates the memory folder: merges, rewrites stale notes, removes dead ones, `/dream undo` | Haiku gate every 20 turns and before compaction, a fork per dream; its writes skip permission prompts (its README says so) | Skip for now: Claude Code's own auto-dream (`autoDreamEnabled`) covers it and the memory folder is tiny |
| jev-skill-suggestion | 0.2.1 | Ranks your skills against each prompt with TypeSafe's Jev; observe, block or steer skill loading | `$.http`: every prompt draft (600 ms after you stop typing) plus skill descriptions to `api.typesafe.ai`; needs a TypeSafe key | Skip: privacy cost, little gain with few skills |
| prompt-bouncer | 0.1.2 | Bounces vague prompts ("the thing") before Claude sees them | quick mode free (regexes); project mode one Haiku call and a few seconds per prompt | Skip: friction for a solo developer, still 0.1 |
| decision-tree | 0.2.3 | Explains Claude's closing question in a pane, explore options in forks | regex, then Haiku, then a fork | Skip for now |
| cache-clock | 0.5.4 | Band: cache countdown and context | none extra | Skip: the v2 status line shows the cache clock (one reading, once) |
| memory-fork | 0.3.3 | Keeps auto-memory current from a fork | Haiku after every turn | Skip: usage on every turn |
| transcript-redactor | 0.5.1 | The redaction core of secret-box | none extra | Covered: secret-box includes it; never run both |
| vercel-deploy-status | 1.0.4 | Vercel deploy queue under the prompt | polls the `vercel` CLI | Only with Vercel |

**SwarmPane** is not a published mod under that name (GitHub repos and code searched). The closest is `swarm` in
[OneWave-AI/claude-code-mods](https://github.com/OneWave-AI/claude-code-mods) at `e6da26c`: a live map of subagents and agent
teams, read-only (no network, processes, files or model calls), 19 stars, untouched since 3 Oct. `ruflo-swarm` in
[ruvnet/ruflo](https://github.com/ruvnet/ruflo) is an orchestration system with an MCP server, not a pane. Skip: Bridge,
Flightdeck, Session, cctop and Cockpit already show subagents.

## The nine

| Mod | Reviewed at | Reach (validate) | Verdict |
|---|---|---|---|
| **You Should Know** (built in, `cc-plugin-you-should-know@builtin`) | Claude Code 2.1.304 | a side request to the session's model, no tools; each check bills several thousand tokens of instructions | Try first: official, one command (`/plugin enable cc-plugin-you-should-know@builtin`), off as easily; `CLAUDE_CODE_YOU_SHOULD_KNOW_DEBUG=1` shows how often it checks |
| **Terminal Browser** ([zenbu-labs](https://github.com/zenbu-labs/terminal-browser), 4k stars) | `660ec51`, Homebrew 0.13.4 | `$.http`, `$.process`, a tool; Chromium (Electron offscreen) drawn as kitty-graphics pixels | Try on the Mac: impossible on Windows, Ghostty draws it; heavy on memory, plugin marked experimental; `brew install terminal-browser`, not `curl \| bash`; its README's `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` line is obsolete |
| **Blast Radius** (Anthropic sample) | playground `569c528` | `$.process` | Not installed: Cockpit's guard is kept (below) |
| **Cache Tax** ([karanb192](https://github.com/karanb192/cache-tax), 218 stars) | `432a08d` (2.3.0) | `$.model.fork` | Maybe: `/keepwarm` spends usage to avoid a cold rewrite of a large context, and the guard stops one cold send with its estimated cost; worth it in long 1M-context sessions with breaks |
| **Reflect** ([BayramAnnakov](https://github.com/BayramAnnakov/claude-reflect), 1.8k stars) | `b6c4232` (3.3.1) | plugin: Python hooks, background `claude -p --model sonnet`; mod: `$.model.complete`, a `prompt.submit` hook without `.catch` | Maybe later: corrections to CLAUDE.md after review, `/reflect-skills` finds repeated tasks |
| **Filetree** | `7a86b0e` (0.3.0) | already installed at 0.2.26 | Installed (the Files tab); 0.3.0 adds `d` to diff files and folders: worth a re-pin |
| **Savvy Progress** ([JohnnyVizz/claude-kit](https://github.com/JohnnyVizz/claude-kit)) | `c871c15` (1.2.1) | a tool, env reads | Skip: made for its `savvy-flow` skill; subagents are already covered |
| **Claude Skins** ([hellosverre](https://github.com/hellosverre/claude-skins)) | `db6834f` (0.5.13) | `$.http` (the update check v1 patched out), `$.process` | Skip: prismantis replaced it in v7; two transcript renderers fight |
| **Replay Theater** (Anthropic sample) | playground `569c528` | `$.fs` read | Skip: `/diff`, prismantis's diff cards, filetree's `d` and `/rewind` cover it |

## Secret Box, as installed

- **Pinned** unmodified in `kasasree-mods` at `6db48a3` (0.5.3), with its own README, provenance and the reason it loads last.
- **Loads last.** On a tool call it turns placeholders into real values and passes the call down the chain, and hides
  secrets in the result on the way back up. Claude Code chains user mods in `enabledPlugins` order, first outermost (the
  debug log's `hooks module A, B, ...` lines), so mods before it see only placeholders and any mod after it would see real
  keys in commands and output, which the panes draw and store. v7-mac's `version.json` lists it in `last`, a new field of
  the shared kit that keeps it at the end even after later installs. Claude Code's built-in mods chain after all user mods.
- **Tests:** `claude plugin test`: 46/46. Its detector contract (`tests/detect.test.mts`): every must-hide and must-keep string
  passes; three 8 MB adversarial inputs take 7.9 to 10.4 s against a 5 s budget on the M1. Claude Code truncates long tool
  output far below that, and a scan that overran the hook's limit would withhold the result, not pass it.
- **Live:** loads 8th of 8 user mods and is admitted, `request_secret` registered, the six tabs unchanged. One Haiku turn
  (`claude -p`, about $0.003) in a throwaway repo ran `cat config.json` on a fake `sk_live_` key: Claude answered with
  `[REDACTED-SECRET-…]`, and the saved transcript held the placeholder twice and the key zero times.
- **Limits:** it hides what Claude sees, not what is on disk (the `.env` holds the real value, as it must); high-entropy
  ids can be hidden by mistake (the `allow*` options fix that); a key whose characters are shell-active is refused in Bash
  and must go through a file.

## Cockpit's guard over Blast Radius

Both hold a risky Bash command before it runs. Cockpit's guard (on by default, `/cockpit-guard off`) asks Run it / Block it
for `rm -rf`, force pushes, `reset --hard`, `sudo`, and `.env` and key files, and counts what it blocked in its panel.
Blast Radius shows more (the files, commits or migrations at stake) but is Anthropic's unsupported sample, a script that runs
`rm` itself gets past it, and two guards would ask twice for one command. Cockpit's guard is already in v7, so it stays.
With `skipDangerousModePermissionPrompt` on, this guard is the one question before a destructive command.

## Sources

[ray-amjad/claude-code-mods](https://github.com/ray-amjad/claude-code-mods) ·
[OneWave-AI/claude-code-mods](https://github.com/OneWave-AI/claude-code-mods) · [ruvnet/ruflo](https://github.com/ruvnet/ruflo) ·
[mattpocock/skills](https://github.com/mattpocock/skills) · [AI Skills for Real Engineers](https://www.aihero.dev/skills) ·
[Matt Pocock's Skills (marketplace)](https://claude.com/marketplace/plugins/mattpocock-skills) ·
[Devtalk, a week with the skills](https://forum.devtalk.com/t/anyone-tried-mattpocock-skills-for-claude-code-here-is-what-i-found-after-a-week/244771) ·
[andrew.ooo review](https://andrew.ooo/posts/matt-pocock-skills-claude-code-review/) ·
[Mods overview](https://code.claude.com/docs/en/plugins/mods/overview) ·
[You should know suggestions](https://code.claude.com/docs/en/interactive-mode) ·
[karanb192/cache-tax](https://github.com/karanb192/cache-tax) · [zenbu-labs/terminal-browser](https://github.com/zenbu-labs/terminal-browser) ·
[BayramAnnakov/claude-reflect](https://github.com/BayramAnnakov/claude-reflect) · [JohnnyVizz/claude-kit](https://github.com/JohnnyVizz/claude-kit) ·
[hellosverre/claude-skins](https://github.com/hellosverre/claude-skins) · [data-goblin/claude-code-filetree](https://github.com/data-goblin/claude-code-filetree) ·
[anthropics/claude-code-playground mods](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods)
