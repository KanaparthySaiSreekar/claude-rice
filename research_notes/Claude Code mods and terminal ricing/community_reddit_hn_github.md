# Claude Code mods and terminal ricing: community discussion on Reddit, Hacker News and GitHub (as of Oct 14, 2026)

**How the data was gathered (read first):**

- **Reddit.** reddit.com JSON and HTML were blocked from this environment (403 errors and a login redirect on old.reddit.com). I collected posts through Reddit's search RSS feeds (`sort=top`, `t=year`) for r/ClaudeAI, r/ClaudeCode, r/Anthropic, r/commandline, r/unixporn, r/tmux and r/neovim. That gave about 2,150 unique posts, of which about 870 matched relevant keywords. Scores, comment counts and top comments come from the **Arctic Shift** Reddit archive API.
  - Every Reddit figure is written as "pts/comments" and is an **archived snapshot**. Live scores could not be checked and may be higher, especially for October 2026 posts.
  - Comment scores appear in [brackets] and are also archived.
- **Hacker News.** Stories and comments come from the hn.algolia.com search API. Points and the ranked order of top comments come from the official Firebase API. These are live values as of Oct 14, 2026.
- **GitHub.** The session proxy blocked the GitHub API for anthropics/claude-code, so the GitHub data comes from GitHub's HTML issue search pages, read through WebFetch (which summarizes pages with a small model). Each search was sorted by 👍 reactions.
  - The number shown next to each issue on those list pages looks like the **comment count**, not the reaction count. Under a reactions sort the numbers are not in descending order, and #45596 shows "258 remaining items" against a displayed 281. Exact reaction totals were not visible.
  - **Closed does not mean shipped.** Many UI issues were closed on Aug 17, 2026, which looks like a bulk closure (not verified).
  - GitHub Discussions are not enabled on the repo (the page returns 404).
- **Mods timeline.**
  - **Sep 3, 2026:** Proposal opened ([#91870](https://github.com/anthropics/claude-code/issues/91870)).
  - **Sep 9:** Named "Claude Mods", with early access through `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`.
  - **Oct 1, 2026:** Mods went live.
  - **Versions:** CLI 2.1.287 or later (desktop app from 2.1.286); "decorations" were added in 2.1.293.

  Anything older than about 2.1.287 predates mods.

## Reddit: the most relevant 2026 threads on mods, status lines, setups, tips, hooks, themes and companion tools

### Takeaway
On Reddit, mods are the biggest customization story of 2026. r/ClaudeCode's "Introducing Claude Mods" (Oct 1, 1,118 pts) set off two weeks of mod showcases: usage and quota bands above the prompt, git and file panes, pets and animations, sounds, and model/effort routers. Before mods, customization energy went into status lines (many competing scripts and recurring "show me your statusline" threads), tmux agent dashboards, sound and notification hooks, and physical desk displays. Status lines were first a status line, then a status bar, and by Oct 2026 a full desktop of mods.

### Cited Findings

#### Mods: launch, early access and the first two weeks
- **The launch summary.** You can now mod Claude Code to change how it behaves, customize the UI or swap in your own features. A mod is a few lines of TypeScript, or Claude can build it for you. Mods ship inside plugins and are installed with `/plugin` in the CLI or the desktop app (18/12, Oct 1). The post links to the ClaudeDevs X post and the claude.dev "Getting started with Claude Code mods" blog. — [Reddit r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1wv8glc/)
- **"Introducing Claude Mods" (Oct 1; 1,118/206) is the most-upvoted mods thread.** Top replies:
  - Claude suggested the built-in "You should know" mod on its own. The mod tracks decisions and changes in a session and gives an overview, and the commenter likes it [6].
  - One user spent days down the tooling rabbit hole and found themselves "more focused on the workflow and tools than my actual work". The only tool they kept using daily is herdr [9].
  - Others now write their own mod instead of installing a suggested one.

  — [Reddit r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/comments/1wvc7vc/)
- **Early access, before launch (Sep 15).** A post explained that a mod is TypeScript that Claude Code loads into its own process. It can draw UI above the prompt, react to events or run a process. The tracking issue calls the feature "function hooks", enabled with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`. The author demoed cc-arcade's Tetris (`/arcade`) and "scanned 31 Claude Mods to see what they can access" (3/1). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wh4avy/)
- **Pre-launch mod: "Use any subscription in Claude Code!" (Sep 16; 134/52).** The Multi-CLI mod streams Antigravity (headless) and Cursor SDK sessions into Claude Code alongside Claude models. Commenters called it a ToS grey area. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1whw82q/)
- **Where mods can draw.**
  - A commenter found UI only in certain places: the band above the input, an extra panel, and the response itself. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wv8glc/)
  - Builders say the mods API arrived in 2.1.287 and that mods work in both the desktop app and the terminal. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wwsryi/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wy5h58/)
- **"Did you know Claude Code has mods? They're awesome" (Oct 6; 251/37).** It cites a catalog of almost 100 mods, with the link in the comments (not captured). Favorites:
  - **cost-meter:** session cost so far, above the prompt
  - **guard-essentials:** asks before `rm -rf`, force-push or `DROP TABLE`
  - **git-pane:** live side pane with branch, changed files and recent commits
  - **/standup:** writes a standup from the git log
  - **sounds-retro:** 8-bit coin when tests pass, buzz when they fail
  - **yoda-mode**

  Each mod "shows what it can access before you install". Replies were wary of the poster ("Didn't you just post about this yesterday?"; "Dude has a mod to post about his mods"). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyojh6/)
- **A usage band is the typical first mod.**
  - pixel-buddy shows usage meters, a cache timer and a cartoon Claude (61/12). A reply: "creating a usage band is a natural first mod". — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvz855/)
  - The usage-quota mod shows 5-hour and weekly usage matching the app's Plan usage panel, a reset forecast that learns your pace, context %, optional auto-compact and a manual compact button. It works in both desktop and terminal. The author later reported that:
    - It was renamed because names starting with "claude-" are reserved for Anthropic.
    - It passed the official plugin directory's security scan and is in review with Anthropic.

    — [Reddit r/ClaudeAI 8/16](https://www.reddit.com/r/ClaudeAI/comments/1wxntoy/); [r/ClaudeCode 22/24](https://www.reddit.com/r/ClaudeCode/comments/1wxnm5i/)
  - Another builder says the built-in usage circle is "basically useless", because it shows whichever limit is highest (11/8). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1ww4aqj/)
- **Sharing a prompt instead of a repo.** "mods are really powerfull" (16/6) shared a build prompt rather than code: "Build a Claude Code mod (load the plugin-authoring skill first) named `hud`: a band above the prompt plus a pane with charts for prompt-cache warmth and plan quota". The mod reads the desktop app's `plan-usage-history.json` via `$.fs.read`. The author later moved the calculations into a Python daemon so the plugin only renders. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wzcz0q/)
- **Model/effort routers: "effortless" (r/ClaudeAI 255/73; r/ClaudeCode 128/48).** A bar above the prompt. Haiku 5.5 (or the Jev decision model) picks the model and effort for each prompt, warns when the prompt cache goes cold, and offers a handoff when the topic changes. Pushback:
  - Haiku is a poor judge and underestimates tasks.
  - Caches are per model, so escalating to Opus re-reads the whole context.
  - "just use opus 5.5 for everything"
  - Requests for benchmark data.

  — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1x1nnkn/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x19b2c/)
- **Context and cache control.**
  - handoff-compact does the handoff + `/clear` routine whenever autocompact fires. Its author measured half of their tokens going to turns past 200k context. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wwk4y5/)
  - Project Sentinel is a "control room" mod. It tracks work, context and cache health separately, with autopilot handoffs, guardrails and an optional companion. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x0yh6k/)
- **Pane mods.**
  - **VS Code-style Source Control panel.** The band shows branch, ↓ pull, ↑ push and changed files, with one button for whatever is due. The side panel has staging, a history graph, branches, worktrees and stashes, and hands merge conflicts to Claude. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wy5h58/)
  - **File-explorer and file-tree panes.** — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wxcnzs/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x11bkn/)
  - **`/pin`** keeps a response in a side pane. It is about 90 lines, and pinning a selection only works in the fullscreen layout. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wxo51x/)
  - **agent-quick-menu** opens a `/menu` pane that shows every plugin's commands as buttons and its settings as toggles, plus Claude Code's own `/config`. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wwsryi/)
- **Pets and animation mods.**
  - **pixelband:** seven animated scenes that react to Claude, or your own GIF. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wvgw2n/)
  - **Clawdman:** Clawd, the Claude desktop mascot, sits above the prompt. Each subagent gets a desk, and a village is built from uncommitted files. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1ww19kl/)
  - **Subagent pixel critters:** progress, ETA and tokens per subagent, with no model calls. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x1rci2/)
  - **glowup:** restyles colors, message and tool-call drawing, borders and spinners. It adds a side pane with changes, subagents and context left, plus a pet Clawd that reacts to edits, tests and idleness. A reply asked about token cost; the author said "Literally none". — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wz4d0e/)
  - **claude-pokemon-mod.** — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyi34j/)
- **Some demos fell flat.** "Testing of the new Claude Mods system and wow!!!" (14/32) drew the top reply "you put a pink bunny on your screen? That's what mods do? I'll pass" [17], plus complaints that the post gave no context. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wx88w2/)
- **Discovery is a gap.** A user asked where to find mod showcases with GIF or video previews; the only catalog they found, https://mods.aidojo.si/, is text-only. Replies:
  - One wanted to know "which mods are still in people's workflow after a week or two".
  - Others listed an RTL-layout mod (Arabic/Hebrew/Persian/Urdu), a GitHub PR watcher and a session launcher.

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyi34j/)
- **Other mods.**
  - A mid-session account switcher (`/account`, then 1–9; CLI, Windows only). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x2asls/)
  - attention-sound. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x50xme/)
- **Modding before mods.**
  - tweakcc v4.0.0 (Feb 9) patched Claude Code installs: statusline throttling/pacing and unlocks for preview features. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1r0awu7/)
  - An Apr 1 post (1,444/127) rebuilt a runnable Claude Code from a leaked sourcemap, saying "modding claude code has never been easier". This raises legal, ToS and security concerns and is not something to adopt. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1s98srg/)

#### Status line threads
- **"Show me your /statusline" (Feb 7; 199/73).**
  - Top reply: "This is statusparagraph, instead of statusline" [68].
  - The OP gave a Windows setup: a `settings.json` `statusLine` command that runs `powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\<user>\.claude\statusline.ps1`.
  - One user added weather plus a line for weather advisories that appears only when one is active.
  - Another's tip: "Just ask CC to build it and input the screenshot" [14].

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qycvdu/)
- **"I published a nice compact status line that you will probably like" (Mar 2; 440/72).** It shows model, folder, context used and weekly limits, and later added git branch and reasoning effort (daniel3303/ClaudeCodeStatusLine). Replies:
  - "bets on how long before Boris puts this into the official build?" [20]
  - A comparison with ccstatusline, with auto-updating named as a must-have.

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rj85f5/)
- **"Yet another statusline" (May 24; 224/59).** Replies included "More like status-essay" [34] and "over kill?" [10]. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1tmdxu9/)
- **"My minimal Claude Code statusline config" (Feb 27; 178/27).** Shows model, folder + branch, 5h/7d usage % with reset countdown, and context. Usage is fetched by PreToolUse + Stop hooks and cached in `/tmp`, so the status line itself renders instantly. Two shell scripts, no dependencies. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rg3nmt/)
- **"What does your statusline look like? Drop a screenshot" (Aug 1; 116/61).** The OP's status line answers one question: am I OK on the weekly limit, and how hard can I push (claude-statusline-burnrate)? Replies:
  - ctxline.js.org [24]
  - "Finally a cool post sharing funny workflows. I had enough of complain post" [13]

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vcjjbp/)
- **"Customized status line is an extremely underrated feature" (Mar 29; 45/18).**
  - Use `/statusline` and Claude sets it up.
  - Show 5h/7d rate-limit % plus a reset countdown, so abnormal burn shows up immediately.
  - claude-lens adds a "pace delta" (⇡ over budget, ⇣ under budget; bash + jq; installs from the plugin marketplace).
  - claude-coach runs a Sonnet "advisor" that gives live tips.

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1s7ay6n/)
- **coralline, a Powerlevel10k-style status line (Jun 13; 70/15).**
  - You install it by pasting one prompt and letting Claude ask you about colors and layout.
  - It shows context and tokens, 5h/7d gauges, cost and git state.
  - Zero tokens: one `jq` and one `git` call per refresh.
  - It can import p10k settings, and themes are small `.conf` files.

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u4yegy/)
- **statuslin.es gallery (Jul 16; 47/9).** Each entry is rendered from its real script in a live environment and manually reviewed. You copy its prompt into Claude Code. A reply valued it because it runs the real config rather than reverse-engineering a screenshot. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1uy4le4/)
- **Popular named tools.**
  - **CShip** (status line with Starship passthrough): r/ClaudeCode 101/17 and r/Anthropic 97/7. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rsnetb/); [Reddit](https://www.reddit.com/r/Anthropic/comments/1rthrup/)
  - **claude-powerline** v1.12, "a secure, zero-dependency statusline" (Dec 12, 2025; 117/26). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1pkntwf/)
  - **ccstatusline** (sirmalloc), recommended as a TUI configurator in several threads. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rg3nmt/)
- **Version milestones.**
  - 2.1.6 let the status line show actual context (Jan 13; 144/32). The thread also has an attribution dispute over a copied script [52]. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1qbmrc7/)
  - 2.1.80 put rate limits in the status line (Mar 25). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1s3eouz/)
- **Security PSA (Apr 9; 21/4).** The popular `npx -y ccstatusline@latest` setup downloads and runs whatever npm currently tags as latest, at every status-line render, with no approval. The fix is to install a pinned version.
  - The maintainer replied that pin/auto-update options are planned.
  - A commenter suggested package-manager cooldowns (cooldowns.dev).

  — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1sh0x1r/)
- **Terminal-only commands.** `/statusline` and `/add-dir` are terminal-only, so the desktop app lacked a configurable status line, according to a highly upvoted reply in a 1,002-pt tips thread. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1tbwwel/)
  - Mods now bring status-style bands to desktop. One commenter said the mods "bring the statusline to shame" (their typo corrected). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wv8glc/)

#### Setup showcases and tips
- **"Claude Code tips for terminal users (from a senior dev)" (May 13; 1,002/89).** The tips were `@` (file references), `!` (bash), `/btw`, `/statusline` and `/add-dir`; the auto-generated thread summary called the consensus "hell yeah". — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1tbwwel/)
- **"Am I using Claude Code wrong? My setup is dead simple" (Mar 9; 181/95).** Top replies: people only post elaborate setups to show off [19], and "Some people love sharpening their axe more than chopping trees" [12]. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rovknm/)
- **"I removed 63% of my Claude Code setup and it got 10x faster" (Mar 8; 209/103).** The OP had 20 MCP servers, 80+ skills, 86 slash commands, 25+ agents, 10 plugins and 7 hooks. Replies estimated 100–150 tokens per skill description, reported skills loading when not needed, and called MCP servers the bigger cost. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rnxm5c/)
- **"Show & Tell: I want to see your Claude code Setup" (Feb 17; 147/99).** Top answer [63]: keep it simple, one session, plugins from claude-plugins-official. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1r79ipp/)
- **"When Claude is down.. post your setup" (Jun 23; 154/53).** Mostly desk and hardware photos, including Stream Decks. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1udla1a/)
- **Open-sourced personal setups.**
  - Maestro (378/95). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qq2lur/)
  - VoiceTree, combining Obsidian, Claude Code, Gas Town and Whispr Flow (353/102). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qwcg0g/)
- **Small visual settings.**
  - Custom spinner verbs arrived in v2.1.23: `"spinnerVerbs": {"mode": "replace", "verbs": [...]}`. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1qq2b3i/)
  - The ULTRATHINK rainbow returned in v2.1.68 (217/25). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1rkmqb1/)

#### Hooks, notifications and companion tools
- **Hooks guides.**
  - "Two Claude Code features I slept on… Stop Hooks + Memory files" (496/95). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1rqxzlp/)
  - "Claude Code Hooks – all 23 explained and implemented" (240/27). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1rxu41b/)
- **Recon (691/76; Mar 15).** A tmux-native Rust/Ratatui dashboard with a "Tamagotchi" view of your agents.
  - A reply argued that dashboards with 50 charts are useless when four agents run overnight; you just need to glance and know whether something needs attention [21].
  - Another commenter runs a Stop hook that logs a session summary to JSONL and has Haiku write a short "what just happened" note [5].

  — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ru9yda/)
- **Waiting signals.**
  - Warcraft III peon voice notifications (r/ClaudeCode 60/12). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1r2y7hu/)
  - A Windows mouse cursor that sprouts a Claude logo whenever Claude is waiting on you (209/31). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u6cc24/)
- **Clutter complaint: "Is there any way to hide the Fable 5 notification?" (334/66).** A persistent "Fable 5 is temporarily unavailable" banner annoyed users. One reply says someone "finally vibecoded an X button to close it". — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1u6zp8p/)
- **The Buddy companion was removed in v2.1.97 (Apr 9).** A fan rebuilt it as claude-buddy using MCP + Skills + Hooks + Status Line, with "zero binary patching": 18 species, rarity tiers and animated ASCII art. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1sgfjss/)

#### Themes
- **"Smart Watch Theme" (r/ClaudeCode, Aug 16; 910/110).** An image post; the OP says it is great at night and other people can't read it. Top replies mocked it: "Rage bait imo" [80], "this is ugly" [24]. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vpyfta/)
- **"Final Fantasy theme for Claude" (Jul 27; 204/58), plus an update with a download link (153/18).** It is unclear whether this targets claude.ai or Claude Code (image posts). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1v847vv/); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1va93pj/)
- **The "Your Name"-inspired theme** is a browser-extension theme for the Claude website, not the terminal. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1v7bbi2/)
- **Neovim:** "Token", a colorscheme inspired by Claude's look (43/9). — [Reddit](https://www.reddit.com/r/neovim/comments/1sd52qd/)

#### Terminal vs desktop app (affects where ricing happens)
- "Why is everyone using the Claude terminal?" (Aug 25; 629/653). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vxtrot/)
- "How many of you still use Claude code from terminal vs the claude desktop app?" (Oct 5; 386/662). Replies:
  - "CLI because I can use herdr"
  - Neovim plus multiple CLI sessions, using `/desktop` for visualizations.

  — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wy9mju/)
- "blessed terminal or barbarous desktop?" (Jun 22; 265/73). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1ucrlyu/)
- A commenter says the CLI and the desktop app share `settings.json` (not verified). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vxtrot/)

#### Niche subreddits
- **r/tmux.**
  - Backlash post: "So is this subreddit just claude code tmux plugins now?" (110/20). Replies say they are "all identical", lack variety, and everyone "slopcodes their own version" instead of contributing to existing projects. — [Reddit](https://www.reddit.com/r/tmux/comments/1saciat/)
  - **opensessions** (172/43): a tmux sidebar with agent status across projects, forwarded ports and live threads for amp, Claude Code, Codex and opencode. "no electron. no blank panes." — [Reddit](https://www.reddit.com/r/tmux/comments/1s6oze9/)
  - **tmux-agent-status** (30/10): shows nothing while agents work; a glyph appears when one needs permission, asks a question or finishes. `prefix+a` opens a picker with a live pane preview. Pure tmux hooks + Bash. — [Reddit](https://www.reddit.com/r/tmux/comments/1wy5wg7/)
  - **A usage plugin for the tmux status bar** (39/2): one place for usage instead of repeating the same number in every pane's status line. It reads the data Claude already passes to its status line, so no API calls or login. — [Reddit](https://www.reddit.com/r/tmux/comments/1uedjn8/)
  - **ccmux** (56/21). — [Reddit](https://www.reddit.com/r/tmux/comments/1upqzua/)
  - **A sidebar tree with live agent badges** (25/10). — [Reddit](https://www.reddit.com/r/tmux/comments/1ruapcm/)
- **r/commandline: agtop (45/11).** A top-style TUI with sparklines and six panels, including Cost and Tool Activity. Zero dependencies, raw ANSI. — [Reddit](https://www.reddit.com/r/commandline/comments/1sgysmw/)
- **r/neovim.**
  - claude-preview.nvim shows a diff before Claude changes files (87/18; later renamed code-preview.nvim) and added live change indicators in neo-tree. — [Reddit](https://www.reddit.com/r/neovim/comments/1ri7891/); [Reddit](https://www.reddit.com/r/neovim/comments/1rodm0e/)
  - Agentic.nvim (101/55). — [Reddit](https://www.reddit.com/r/neovim/comments/1pqpo8h/)
- **r/unixporn:** none of the year's top results for "claude" was a Claude Code rice; they were general desktop rices. — [Reddit search RSS](https://www.reddit.com/r/unixporn/search.rss?q=claude&restrict_sr=1&sort=top&t=year)

### Inferences
- Quota anxiety drives most status-line and mod creation. The most common first mod or status line is a 5h/weekly usage band with a reset countdown or pace forecast.
- Mods moved showcase energy away from shell-script status lines toward bands and panes. A big draw is that the same mod runs in the desktop app, which had no `/statusline`.
- Reaction splits into two camps. "Look at my cute pet" posts get upvotes but also "I'll pass" and "no real use case". Minimalists ("sharpen the axe", "statusparagraph") push back on clutter and bloat.
- There is a curation gap: no gallery with live previews, and nothing showing which mods people still use after two weeks. statuslin.es is the closest model, but it covers only status lines.

### Gaps
- Live Reddit scores and comment counts could not be verified because Reddit blocked JSON and HTML. The figures above are Arctic Shift snapshots, and October posts are probably under-counted.
- The "almost 100 mods" catalog link in the comments of 1wyojh6 was not captured, and I couldn't confirm it is mods.aidojo.si.
- Image and video posts (Smart Watch Theme, Final Fantasy theme, many setups) could not be viewed, so descriptions rely on titles and comments.
- Some fetches of r/ClaudeAI, r/ClaudeCode, r/Anthropic and r/neovim searches hit HTTP 429 rate limits. r/neovim was backfilled through Arctic Shift, but some relevant threads may still be missing.

## Hacker News: stories, Show HNs and notable comments

### Takeaway
On HN, the biggest 2026 customization hits were audio notifications (peon-ping, 1,006 pts) and flicker fixes (Claude Chill, 192). They drew a notable reply from a Claude Code TUI engineer. The mods launch itself got almost no attention on HN: the official blog link scored 6 pts with 0 comments, and mod Show HNs scored 1–4 pts. HN commenters tend to question the value of yet another tmux agent manager and of setup showcases.

### Cited Findings

#### Mods on HN (Sep–Oct 2026)
- **Official links got little traction.**
  - "Claude Code Mods", the claude.com blog post (Oct 1): 6 pts, 0 comments. — [HN](https://news.ycombinator.com/item?id=49925102)
  - The docs page "Claude Code Mods: plugins may now modify deeper behavior": 3 pts. — [HN](https://news.ycombinator.com/item?id=49925800)
  - "Getting started with Claude Code mods": 3 pts. — [HN](https://news.ycombinator.com/item?id=49926243)
  - The tracking issue, posted as "Claude Mods, Functional Hooks in Claude Code and Desktop" (Sep 15): 3 pts. — [HN](https://news.ycombinator.com/item?id=49712921)
- **AGENTS.md support** shipped as a built-in mod (repo path `mods/agents-md`), posted Sep 19–20 (4 pts). — [HN](https://news.ycombinator.com/item?id=49774919)
- **Mod Show HNs (all low-scoring).**
  - Terminal Gym makes you do pushups between prompts (4/2). — [HN](https://news.ycombinator.com/item?id=49945600)
  - A mod plays MIDI music while Claude works (3/1). — [HN](https://news.ycombinator.com/item?id=49999983)
  - Terminal Steps shows a daily step goal synced from Apple Health (3/0). — [HN](https://news.ycombinator.com/item?id=49971594)
  - "What's Agent Doing" draws one line above the prompt. It shows the current step in plain words, taken from the description Claude writes for each shell command, with a timer and a row per background agent (2/0). — [HN](https://news.ycombinator.com/item?id=49934165)
  - Minesweeper (1/0). — [HN](https://news.ycombinator.com/item?id=49946184)
  - A port of pi-autoresearch to the mods API (2/0). — [HN](https://news.ycombinator.com/item?id=49927599)
  - A context-debloat mod (1/0). — [HN](https://news.ycombinator.com/item?id=49990017)
  - Model-specific spinner verbs, e.g. Haiku: "Licking screen.." (1/0). — [HN](https://news.ycombinator.com/item?id=50008739)
- **Comments on mods.**
  - A desktop-statusline mod brings the CLI status line to the desktop app. — [HN](https://news.ycombinator.com/item?id=49946192)
  - Proc-stats, a task-manager mod, found that a Claude Code session costs about 450 MB of RAM. — [HN](https://news.ycombinator.com/item?id=50047442)
  - "Claude Mods seem to answer this pain better without affecting the model reasoning" (on a reply-shortening plugin). — [HN](https://news.ycombinator.com/item?id=50004163)
  - "can this be a claude mod?" (on Pinrail). — [HN](https://news.ycombinator.com/item?id=50000315)
  - diffr also ships as a mod. — [HN](https://news.ycombinator.com/item?id=50076983)

#### Biggest customization and companion stories
- **"Warcraft III Peon Voice Notifications for Claude Code" (peon-ping; Feb 12, 2026; 1,006 pts/301 comments)** is the top 2026 Claude Code customization story on HN by points. Top comments are nostalgic. One commenter loved hearing "Work complete!" but, once the novelty wore off, found per-project, event-specific spoken messages from a Stop hook on macOS more useful. — [HN](https://news.ycombinator.com/item?id=46985151)
- **Mr. Meeseeks voice line when Claude is waiting (Jul 13; 132/56).** A reply notes peon-ping now has many voice packs, including Meeseeks, but mixing per-project and global voices is hard. — [HN](https://news.ycombinator.com/item?id=48899529)
- **Elevator music while waiting for input (Dec 20, 2025; 56/15).** — [HN](https://news.ycombinator.com/item?id=46337118)
- **"The creator of Claude Code's Claude setup" (Jan 2; 568/403).** Boris Cherny's setup thread drew skepticism about running 10 parallel agents. One comment pointed out that prefixing a task with `&` sends it to Claude Code on the web as a background task. — [HN](https://news.ycombinator.com/item?id=46470017)
- **"Garry Tan's Claude Code Setup" (gstack; Mar 17; 74/79).** Comments called it "overengineered" and "not an impressive setup", though one user kept it in their toolkit. — [HN](https://news.ycombinator.com/item?id=47418576)
- **"My Claude Code Setup: Pure CLI, Pure Unix, Zero IDE" (May 6; 16/5).** — [HN](https://news.ycombinator.com/item?id=48032375)
- **Animal Crossing-style UI for agents (Mar 27; 48/36).** — [HN](https://news.ycombinator.com/item?id=47545642)

#### Flicker and rendering
- **"Claude Chill: Fix Claude Code's flickering in terminal" (Jan 20; 192/148).** A PTY proxy. A top reply said it breaks Ghostty's native scrollback. — [HN](https://news.ycombinator.com/item?id=46699072)
- **Reply from a Claude Code TUI engineer (chrislloyd, Jan 21).**
  - The differential renderer had shipped to everyone that day, after a ground-up rewrite. Only about 1/3 of sessions see at least one flicker, and rapid repeated flickers are now rare.
  - Synchronized-output (DEC mode 2026) patches were accepted upstream into VS Code's terminal (xterm.js) and tmux.
  - He recommends Ghostty, which supports mode 2026 and shows zero flicker.

  — [HN](https://news.ycombinator.com/item?id=46701013)
- **"Nori CLI, a better interface for Claude Code (no flicker)" (Jan 14; 37/9).** Commenters pointed to Toad as a similar project. — [HN](https://news.ycombinator.com/item?id=46616562)

#### Status line, usage HUD and quota tools
- **Claude Code Usage Monitor (Jun 19, 2025; 245/135).** — [HN](https://news.ycombinator.com/item?id=44317012)
- **ccusage (Jul 18, 2025; 75/30).** — [HN](https://news.ycombinator.com/item?id=44610925)
- **CodeBurn, token usage by task (Apr 13, 2026; 112/27).** — [HN](https://news.ycombinator.com/item?id=47759035)
- **macOS menu-bar quota gauges (Jun 10, 2026; 69/40).** Replies argued for putting the same data in the Claude Code status line instead. The status line is per session, so it can show per-session quota and context. One commenter shows context, 5h, weekly, branch and PR. — [HN](https://news.ycombinator.com/item?id=48473845)
- **"My Claude quota ran out in 10 minutes, so I made a tool to find out why" (Aug 27; 88/69).** A commenter uses a custom status line to avoid such surprises. — [HN](https://news.ycombinator.com/item?id=49467551)
- **Claudoro, a Pomodoro timer in the status line (Jul 1; 50/36).** Feedback:
  - A ticking MM:SS timer where your focus sits is distracting: "I can't use this until it doesn't show seconds".
  - tmux-pomodoro-plus was suggested as an alternative.

  — [HN](https://news.ycombinator.com/item?id=48745590)
- **"Show HN: A community library for Claude Code status lines" (statuslin.es; Aug 17; 13/2).** — [HN](https://news.ycombinator.com/item?id=49330285)
- **Rate-limit burndown in the status line (Jun 8; 8/2).** — [HN](https://news.ycombinator.com/item?id=48441132)
- **Live usage HUD on a $38 Thermalright Trofeo Vision LCD (Aug 15; 14/6).** — [HN](https://news.ycombinator.com/item?id=49314594)
- **Comments.**
  - "I use ccusage's statusline". — [HN](https://news.ycombinator.com/item?id=46516632)
  - An API cost meter on the status line that "frequently runs into the hundreds". — [HN](https://news.ycombinator.com/item?id=48626372)
  - beachcomber.sh exists because feeding the same data to the shell prompt, tmux, Neovim and Claude status lines caused lag. — [HN](https://news.ycombinator.com/item?id=48456136)

#### Multi-session terminals and agent managers
- **cmux, a Ghostty-based terminal with vertical tabs and notifications (Feb 19; 198/77).** The creator's motivation: Claude Code's notification body is always "Claude is waiting for your input", with no context. — [HN](https://news.ycombinator.com/item?id=47079718)
- **Agent-Manager, a tmux TUI (Jul 30; 98/80).** The top comment asks what these tools add over plain tmux (11 replies). Others compare it to herdr, and one links pleasedonotescape.com, which lists 36 similar projects. — [HN](https://news.ycombinator.com/item?id=49107749)
- **agent-of-empires (Jan 12; 118/44).** Rust + tmux; detects agent status via `tmux capture-pane`. A commenter remarks on "how convergent all the ideas are". — [HN](https://news.ycombinator.com/item?id=46588905)
- **Claudraband (Apr 12; 120/44).** Wraps the Claude Code TUI in tmux or xterm.js. Comments asked about ToS for subscription use and criticized Anthropic lock-in. — [HN](https://news.ycombinator.com/item?id=47741889)
- **agents-observe (Apr 1; 77/28).** The author found that "Claude code hooks are blocking – performance degrades rapidly if you have a lot of plugins that use hooks", and that hooks expose more useful information than OTEL. — [HN](https://news.ycombinator.com/item?id=47602986)
- **HUD (Aug 5; 26/1).** A minimal TUI that answers three questions: is it still going, what is it doing, and what was its last message. — [HN](https://news.ycombinator.com/item?id=49184388)
- **Smaller entries.**
  - jmux (10/10). — [HN](https://news.ycombinator.com/item?id=47650233)
  - amux (13/2). — [HN](https://news.ycombinator.com/item?id=47124064)
  - AgentPulse, a tmux status plugin (4/0). — [HN](https://news.ycombinator.com/item?id=49623768)

### Inferences
- HN rewards customizations that are useful and nostalgic at once (peon-ping) and fixes for real pain (flicker). It does not reward novelty mods: the HN-to-Reddit gap for the same mods launch (6 pts vs 1,118) is stark.
- The Claude Code team engages on HN about rendering. Synchronized output (mode 2026) plus Ghostty is the officially recommended route to a flicker-free terminal.

### Gaps
- HN does not expose comment scores, so "notable comments" are taken by HN's ranked order, not vote counts.
- No HN discussion thread about the mods launch with substantive comments was found as of Oct 14, 2026.

## GitHub (anthropics/claude-code): the most-reacted requests and bugs on customization, themes, status line, mods, panes, notifications and flicker

### Takeaway
The highest-ranked UI threads are a mix:
- long-running flicker and scroll bugs (#769, #1913, #826), still open
- the mods tracking issue (#91870), open, with heavy design debate
- a fan campaign to restore the Buddy pet (#45596), open

Most status-line data requests were shipped and closed in Apr–May 2026. Open work clusters around mod rendering outside the CLI and desktop app, custom-theme gaps, tmux and scrollback regressions from the new renderer, and notifications in VS Code.

### Cited Findings

#### Mods
- **#91870 "Mods – make Claude 10x more extensible".** Opened Sep 3, 2026 by poteat, the author of the launch updates; still open. Labels: area:hooks, area:plugins, enhancement. About 256 comments on the list view, the top post-Sep-1 "mod" issue by reactions.
  - **Function hooks:** typed TypeScript with LSP support, nesting like Express/Koa middleware. Earlier registrations wrap later ones, so admins prepend.
  - **The `$` capability object:** side effects go only through `$` (`$.fs`, `$.http`, `$.process`, `$.tool.call`, `$.ui`), so the audit log is exactly the calls a mod made. Admins can remove capabilities.
  - **Events:** `tool.call`, `turn.step`, `prompt.*`, `agent.spawn`, a wildcard `*`, and `ui.press`.
  - **React hooking:** mods can modify the props or rendered output of React components.
  - **Sep 9 update:** named "Claude Mods". Source for three built-in mods went into the repo's `mods/` directory, testable with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`.
  - **Oct 1 update:** "We're live!" Commenters cite CLI 2.1.287+ (desktop 2.1.286), with decorations added in 2.1.293.

  — [GitHub #91870](https://github.com/anthropics/claude-code/issues/91870)
- **Design pushback and asks inside #91870.**
  - A heavy hook user (42 active hooks) asked:
    - Does a throw fail open or closed?
    - What cancels a hang?
    - Can `$.fs` reach outside the workspace?

    They also said more than half their hooks can't be expressed in the `$`-only model. That comment got 👎 12.
  - Others asked for per-hook fail-open/fail-closed and a test harness. One later reported that `claude plugin test` (with `claude-code/testing`) shipped and confirmed fail-open.
  - Reported problems:
    - `classic.*` hooks in user-installed mods are silently skipped on Team/Enterprise plans or with managed settings.
    - There is a 1 MB module size limit.
    - claude.ai "Sync from GitHub" strips `types` from `plugin.json`, breaking mods from org marketplaces (#101258).
  - API requests:
    - faint text style, virtual text and a `prompt.changed` event
    - `agentId` on `turn.start`
    - compare-and-set on `$.store`
  - Requests for mods in cloud sessions and Projects (#100737).
  - The author said restricting what plugins can do is the org admin's job, and acknowledged the docs and videos were hard to follow.

  — [GitHub #91870](https://github.com/anthropics/claude-code/issues/91870)
- **Mod rendering bugs outside the CLI.**
  - #99045: the VS Code extension never draws mod UI (Pane, AbovePrompt, status, toast). Open (Oct 2).
  - #99401: feature request for VS Code to draw function-hook mod UI. Open (Oct 4).
  - #99265: the desktop app draws a mod's AbovePrompt band in only one chat at a time. Closed Oct 14, 2026.

  — [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20mod%20created%3A%3E2026-09-01%20sort%3Areactions-%2B1-desc); [#99045](https://github.com/anthropics/claude-code/issues/99045); [#99265](https://github.com/anthropics/claude-code/issues/99265); [#99401](https://github.com/anthropics/claude-code/issues/99401)

#### Status line (most data requests shipped in 2026)
- **Closed requests to expose data in the statusLine JSON.**
  - Rate limits, session and weekly %: #20636, closed Apr 24, 2026. Duplicates #28999, #27915, #15366, #25041 and #18121 were closed Apr 24–26.
  - Thinking mode: #9488, closed Apr 24.
  - Effort level: #38392 and #31415, closed as duplicates Apr 24.
  - session_name: #15029, closed May 18.
  - Terminal columns and wrapping: #22115, closed May 28.
  - Org API credit balance: #47574, closed May 31.
  - Actual context-window usage: #14058, closed Aug 17.
  - Token usage: #11535, closed Aug 17.
  - A script-based terminal title, configured like statusLine: #17951, closed Aug 17 (whether it shipped is unclear).

  — [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20statusline%20sort%3Areactions-%2B1-desc)
- **Still open.**
  - Per-model weekly limits (Opus/Sonnet/Fable): #73770, Jul 3.
  - Desktop app: show the worktree/cwd: #60097.
  - Bug: auto-compact never triggers even though the status line reports 100% context (#63015, a regression).
  - Bug: a custom statusLine command is not executed (#13517).
  - Bug: the context % differs between `/context`, the statusline API and the internal trigger (#18241).

  — [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20statusline%20sort%3Areactions-%2B1-desc)
- **"Always show available context percentage" (#516)** closed Jan 20, 2026. — [GitHub #516](https://github.com/anthropics/claude-code/issues/516)

#### Themes
- **Shipped or closed.**
  - "Automatic light/dark theme selection?" (#2990, the top theme issue) closed May 31, 2026. An `auto` theme exists: #95249 (open, Sep 17) reports that it doesn't repaint old message blocks after an appearance switch.
  - Custom themes beyond the built-ins (#1302) and user-configurable color themes (#25366) were closed as duplicates Apr 27, 2026.
  - A CLI "custom theme system" now exists, according to #79305, which asks for desktop parity (custom themes and accent colors; open, Jul 20).
- **Open custom-theme gaps.**
  - Diff overrides don't apply (#57036, reproduced).
  - Markdown inline code ignores theme overrides (#73837).
  - Customizable syntax-highlighting theme (#48636).
- **Closed as stale or duplicate.**
  - Dracula and other terminal themes (#62943)
  - Per-project theme (#43216)
  - Select a theme by env var (#10074)
  - "Bring back the winter theme" (#17081)

— [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20theme%20sort%3Areactions-%2B1-desc); [#2990](https://github.com/anthropics/claude-code/issues/2990); [#95249](https://github.com/anthropics/claude-code/issues/95249); [#79305](https://github.com/anthropics/claude-code/issues/79305)

#### Flicker, scrolling and rendering
- **Long-running flicker and scroll bugs.**
  - #769 "In-progress Call causes Screen Flickering": opened Apr 12, 2025, still open, about 307 comments.
  - #1913 "Terminal Flickering": Jun 10, 2025, open.
  - #826, the console scrolling to the top of history: Apr 19, 2025, about 354 comments.
  - #3648, uncontrollable terminal scrolling: closed Dec 17, 2025.
  - #10794, flicker crashing VS Code on macOS: open.
  - A joke issue, "Petition to rename Claude Code to: Flicker Code, or Seizure Code" (#18451): closed.

  — [GitHub flicker search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20flicker%20sort%3Areactions-%2B1-desc); [area:tui by reactions](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20label%3Aarea%3Atui%20sort%3Areactions-%2B1-desc)
- **Regressions in the flicker-free renderer (`CLAUDE_CODE_NO_FLICKER=1`).**
  - v2.1.89's flicker-free rendering destroys terminal scrollback by default (#41965, closed as duplicate Apr 17, 2026).
  - Japanese text is garbled on Windows (#42406), and copying Japanese text produces mojibake via OSC 52 (#42417).
  - Rendering artifacts in Zellij (#42930).
  - Ctrl-G external editor freezes input (#42606).
  - Windows Terminal strobing (#60435 and #60440, closed May 21).

  — [GitHub flicker search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20flicker%20sort%3Areactions-%2B1-desc)
- **tmux bugs and requests.**
  - The new scroll UI breaks tmux copy mode (#60185, open, May 18).
  - tmux scrollback broke after v2.1.152 (#62890, closed Aug 19).
  - Rendering corruption in tmux (#29937, open).
  - Scrollback-rewind lag (#4851, open).
  - The logo and "Thinking" animation look washed out inside tmux (#35148, open).
  - Requests:
    - a `CustomPaneBackend` protocol to decouple agent teams from tmux and unblock Ghostty, WezTerm and Zellij (#26572, open)
    - native Zellij support (#31901, open)
    - agent teams spawning a new tmux window instead of splitting the current pane (#23615, open)

  — [GitHub tmux search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20tmux%20sort%3Areactions-%2B1-desc)

#### Notifications
- **Closed.**
  - Sound notifications (#1288): Aug 22, 2025.
  - The following closed Aug 17, 2026:
    - option to disable notifications (#12046)
    - system notifications when Claude needs attention or completes (#26581)
    - terminal notifications inside tmux (#19976)
    - Remote Control push notifications (#29438, #28765)
- **Open.**
  - Native toast notifications in VS Code (#57230).
  - Built-in completion notifications in VS Code (#29928).
  - Notification hook has a 10-second delay (#5186, Linux).
  - Notification-hook latency (#19627, macOS).
  - Configurable `idle_prompt` timeout (#13922).
  - The desktop app's "Claude is ready" notification fires on a taskbar-icon focus switch but not on Alt-Tab (#74914, GNOME Wayland).

— [GitHub notification search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20notification%20sort%3Areactions-%2B1-desc)

#### Other TUI requests (area:tui by reactions)
- **#45596 "Bring Back Buddy — A Consolidated Plea from the Community"** (opened Apr 9, 2026; open; the most-commented area:tui issue at about 281).
  - **What Buddy was:** `/buddy` was an ASCII companion with 18 species and 5 rarity tiers, stored as a `companion` entry in `~/.claude.json`, with an off toggle.
  - **Removal:** it disappeared in v2.1.97 with no changelog entry. A commenter relays being told it is "not planned to come back".
  - **Community clones:** rezzminator/buddy, claude-familiar, and pixlings (which imports your existing companion from `~/.claude.json`).
  - **Suggestions:**
    - A commenter points to the built-in "You should know" mod in 2.1.287 as a partial replacement.
    - Another suggests bringing Buddy back as a mod.

  — [GitHub #45596](https://github.com/anthropics/claude-code/issues/45596)
- **Closed.**
  - The following closed Aug 17, 2026:
    - always show Claude's thinking (#8477)
    - view/edit pasted-text blocks (#3412)
    - message-queue mode (#50246)
    - Enter inserts a newline (#2054)
  - Turn off progress messages (#6814): Mar 12, 2026.
  - Option to disable the humorous verbs (#4034): Feb 1, 2026. Custom `spinnerVerbs` shipped in v2.1.23 per Reddit.
  - Custom session names (#2112): Dec 22, 2025.
- **Open.**
  - Show which file the Read tool is reading (#21151).
  - Copy/paste includes indentation and trailing spaces (#18170).
  - Option to disable collapsing of pasted text (#23134).
  - Disable the welcome banner (#2254).
  - Timestamps on messages (#44763).
  - Quota information in the CLI (#13585).
  - Respect the XDG Base Directory spec on Linux (#1455).

— [area:tui search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20label%3Aarea%3Atui%20sort%3Areactions-%2B1-desc); [broader search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20statusline%20sort%3Areactions-%2B1-desc); [Reddit on spinnerVerbs](https://www.reddit.com/r/ClaudeAI/comments/1qq2b3i/)
- **GitHub Discussions are not enabled** on anthropics/claude-code (404). — [GitHub](https://github.com/anthropics/claude-code/discussions)

### Inferences
- Anthropic has been absorbing the most common status-line asks into the statusLine JSON. Status lines are now limited mainly by layout and space, not by missing data, except per-model weekly limits.
- The renderer rewrite traded flicker for scrollback, copy-mode and Unicode regressions, especially in tmux, Zellij and on Windows. Anyone ricing inside tmux should expect rough edges.
- Mods are CLI- and desktop-first. VS Code, cloud sessions and Cowork are the obvious next requests.

### Gaps
- Exact 👍 counts were not visible. The numbers given are list-view counts that appear to be comment counts.
- WebFetch summaries could contain small transcription errors in labels or dates.
- "Closed" often means stale or duplicate, and per-issue confirmation of shipped features was not possible for the Aug 17, 2026 closures.

## Synthesis: recurring themes (what people want on screen, favorite tools, common pain points)

### Takeaway
Across all three platforms, users want a glanceable, low-noise answer to four questions:
1. How much quota and context do I have left, and at what burn rate?
2. Which session needs me right now?
3. What is the agent doing?
4. Where is my repo?

Favorite tools converge on status-line generators, tmux or Ghostty session managers, and sound or visual "needs you" signals. Recurring pain points are flicker and scrollback regressions, clutter, hook and plugin overhead, and supply-chain trust.

### Cited Findings

#### Information people most want on screen (roughly by frequency of mention)
1. **5h and weekly usage %, with reset countdown, pace or burn rate, or a forecast.**
   - Status lines: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vcjjbp/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1s7ay6n/)
   - Mods: [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wxntoy/)
   - HN: [HN](https://news.ycombinator.com/item?id=48473845)
2. **Context-window % with an auto-compact marker or a category breakdown.** The rich-statusline mod splits the context bar into system, tools, mcp, memory and chat. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wyjfm6/); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1qbmrc7/)
3. **Model, effort and thinking mode.** — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rj85f5/); [GitHub #9488 via search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20statusline%20sort%3Areactions-%2B1-desc)
4. **Git state:** branch, dirty, ahead/behind, worktree, PR, CI. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u4yegy/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wy5h58/); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1qagizr/)
5. **Session cost.** — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyojh6/); [HN](https://news.ycombinator.com/item?id=48626372)
6. **Prompt-cache warmth/TTL.** — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wzcz0q/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x19b2c/)
7. **Agent and subagent status:** working, needs permission, done, plus "what is it doing" in plain words. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x1rci2/); [HN](https://news.ycombinator.com/item?id=49934165); [HN](https://news.ycombinator.com/item?id=49184388)
8. **Session ID for `--resume`; extras such as weather and music.** — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ryepql/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qycvdu/); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1qeth9x/)

#### Favorite and recurring tools (as mentioned in discussions)
- **Status lines:**
  - ccstatusline: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rg3nmt/)
  - claude-powerline: [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1pkntwf/)
  - CShip / Starship: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rsnetb/)
  - coralline: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u4yegy/)
  - ccusage statusline: [HN](https://news.ycombinator.com/item?id=46516632)
  - the statuslin.es gallery: [HN](https://news.ycombinator.com/item?id=49330285)
- **Session managers and terminals:**
  - herdr, named repeatedly: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvc7vc/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wy9mju/); [HN](https://news.ycombinator.com/item?id=49107749)
  - cmux: [HN](https://news.ycombinator.com/item?id=47079718)
  - Recon: [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ru9yda/)
  - agent-of-empires: [HN](https://news.ycombinator.com/item?id=46588905)
  - opensessions: [Reddit](https://www.reddit.com/r/tmux/comments/1s6oze9/)
  - Ghostty, the officially recommended terminal: [HN](https://news.ycombinator.com/item?id=46701013)
- **Sounds:**
  - peon-ping: [HN](https://news.ycombinator.com/item?id=46985151)
  - sounds-retro and attention-sound mods: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyojh6/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x50xme/)
- **Neovim:**
  - claude-preview.nvim / code-preview.nvim: [Reddit](https://www.reddit.com/r/neovim/comments/1ri7891/)

#### Pain points
- **Flicker, then scrollback.**
  - #769 and #1913 have been open since spring 2025. — [GitHub](https://github.com/anthropics/claude-code/issues/769)
  - The NO_FLICKER launch thread's top replies:
    - Users want the terminal to stop jumping to the top of the buffer [39].
    - Copying a conversation longer than the window is impossible [23].
    - "why does their TUI have a 60fps framerate?" [21]
    - "At least the flicker is gone. The token burn is still there" [23].

    — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1sakkoh/)
  - Renderer regressions in tmux, Zellij and Windows are listed in the GitHub section. — [GitHub](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20flicker%20sort%3Areactions-%2B1-desc)
- **Clutter.**
  - "statusparagraph" [68]: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qycvdu/)
  - "status-essay" [34]: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1tmdxu9/)
  - A banner people couldn't dismiss: [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1u6zp8p/)
  - Requests to disable the welcome banner and progress messages: [GitHub](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20label%3Aarea%3Atui%20sort%3Areactions-%2B1-desc)
  - One status bar in tmux instead of the same status line repeated in every pane: [Reddit](https://www.reddit.com/r/tmux/comments/1uedjn8/)
- **Performance and bloat.**
  - Hooks are blocking and slow down with many plugins: [HN](https://news.ycombinator.com/item?id=47602986)
  - The 63% setup cut made it "10x faster": [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rnxm5c/)
  - Status-line data duplicated across tools caused lag: [HN](https://news.ycombinator.com/item?id=48456136)
  - About 450 MB of RAM per session: [HN](https://news.ycombinator.com/item?id=50047442)
  - Builders stress zero-token, cached designs: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u4yegy/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rg3nmt/)
- **Trust in third-party code.**
  - `npx -y …@latest` status lines run unpinned code at every render: [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1sh0x1r/)
  - Mods run TypeScript inside Claude Code's own process: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wh4avy/)
  - Mods show what they can access before install: [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyojh6/)
  - The official directory runs a security scan and Anthropic review, and reserves "claude-" names: [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wxntoy/)
  - Debate over whether the `$` capability model is auditable and whether failures fail open or closed: [GitHub #91870](https://github.com/anthropics/claude-code/issues/91870)
- **Sameness and showcase fatigue.**
  - r/tmux backlash: [Reddit](https://www.reddit.com/r/tmux/comments/1saciat/)
  - "seen at least 7 of these": [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1tm49wf/)
  - HN's "value over plain tmux?": [HN](https://news.ycombinator.com/item?id=49107749)

#### Platform specifics
- **macOS / Ghostty / kitty.**
  - Ghostty is recommended for flicker-free rendering via synchronized output. — [HN](https://news.ycombinator.com/item?id=46701013)
  - The images/videos-in-terminal plugin requires the kitty graphics protocol (Ghostty, kitty) plus macOS and ffmpeg. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x34qj4/)
  - Notch apps (an ADHD terminal manager, "Buddi"). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vj5ktu/); [GitHub #45596](https://github.com/anthropics/claude-code/issues/45596)
- **Windows.**
  - PowerShell status lines. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1qycvdu/)
  - NO_FLICKER Japanese-text and OSC 52 bugs, and Windows Terminal strobing. — [GitHub](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20flicker%20sort%3Areactions-%2B1-desc)
  - No image rendering in Windows Terminal. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x34qj4/)
  - Windows-only tools: ClaudeTerm, the account-switcher mod, the cursor badge. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wz6j3t/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x2asls/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u6cc24/)
- **Linux.**
  - A May 2026 post said Linux users "don't get the luxury of a dedicated Claude desktop app". — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1tbwwel/)
  - Later sources suggest a Linux desktop app exists by mid-2026:
    - a GNOME Wayland desktop notification bug, Jul 2026 — [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20notification%20sort%3Areactions-%2B1-desc)
    - a `$XDG_CONFIG_HOME/Claude` path used by a mod — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wzcz0q/)

    The May claim may be outdated.
  - XDG Base Directory support remains open (#1455). — [GitHub](https://github.com/anthropics/claude-code/issues/1455)
- **tmux and Zellij** have the most rendering bugs; see the GitHub tmux search. — [GitHub](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20tmux%20sort%3Areactions-%2B1-desc)

### Inferences
- The best-received customizations are ambient and quiet until needed: a glyph when an agent needs you, a usage band, a sound on completion. Customizations that compete for attention get mocked: seconds ticking in the status line, multi-line "status essays", decorative pets with no function.
- "Zero tokens, zero network, cached" has become a selling point that builders state explicitly. Users are sensitive to anything that might burn quota.
- For trust: prefer pinned versions, the official plugin directory (security-scanned) and mods that declare their access. Treat in-process TypeScript as full-trust code.

### Gaps
- No quantitative survey of which customizations people keep using was found. One user explicitly asked for "which mods are still in people's workflow after a week or two".
- I found no WSL-specific threads on customization or rendering in this time window.

## Idea bank: requested but not yet built (or only partly built) customizations

### Takeaway
The open asks below are unclaimed or half-built ideas, each with a source. Most could be built as mods today; a few need platform support (per-model limits, VS Code mod rendering, Windows images, Buddy).

### Cited Findings
- **Per-model weekly-limit gauges (Opus/Sonnet/Fable)** in the status line or a band. Needs platform data (#73770, open). A builder couldn't get the Fable limit to show in their mod. — [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20statusline%20sort%3Areactions-%2B1-desc); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1ww4aqj/)
- **Context-rich "needs you" notifications** that say which session and what it is waiting on. The default body is always "Claude is waiting for your input". — [HN](https://news.ycombinator.com/item?id=47079718); [Reddit tmux-agent-status](https://www.reddit.com/r/tmux/comments/1wy5wg7/)
- **A mod gallery with live GIF/video previews** and a "still used after two weeks" signal, like statuslin.es but for mods. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyi34j/); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1uy4le4/)
- **Mod UI everywhere:** the VS Code extension (#99045/#99401), cloud sessions and Projects (#100737), and Cowork (asked on Reddit). — [GitHub #99045](https://github.com/anthropics/claude-code/issues/99045); [GitHub #91870](https://github.com/anthropics/claude-code/issues/91870); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wzcz0q/)
- **Mod API requests:**
  - faint text style, virtual text and a `prompt.changed` event
  - cursor control for `$.prompt.fill`
  - `agentId` on `turn.start`
  - compare-and-set on `$.store`
  - explicit fail-open/fail-closed per hook

  — [GitHub #91870](https://github.com/anthropics/claude-code/issues/91870)
- **Desktop parity:** custom themes and accent colors (#79305) and a worktree/cwd indicator (#60097). — [GitHub #79305](https://github.com/anthropics/claude-code/issues/79305); [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20statusline%20sort%3Areactions-%2B1-desc)
- **Finer theming:** a syntax-highlighting theme (#48636), codespan colors (#73837), working diff-color overrides (#57036) and live repaint on an auto-theme switch (#95249). — [GitHub search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20theme%20sort%3Areactions-%2B1-desc)
- **Transcript readability:**
  - timestamps on messages (#44763)
  - showing which file the Read tool is reading (#21151)
  - copy without indentation and trailing spaces (#18170)
  - an option to stop collapsing pasted text (#23134)
  - disabling the welcome banner (#2254)

  The `/pin` side-pane mod covers part of this ("don't let the plan scroll away"). — [GitHub area:tui](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20label%3Aarea%3Atui%20sort%3Areactions-%2B1-desc); [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wxo51x/)
- **An official Buddy, as a mod.** The ask: persistent companions, a toggle, sub-agent buddies and context-aware reactions. Clones exist; the official feature does not. — [GitHub #45596](https://github.com/anthropics/claude-code/issues/45596)
- **Calm timers** without ticking seconds in the status line (Claudoro feedback). — [HN](https://news.ycombinator.com/item?id=48745590)
- **Per-project plus global sound packs** that mix cleanly (peon-ping feedback), and per-event, per-project spoken messages. — [HN](https://news.ycombinator.com/item?id=48899529); [HN](https://news.ycombinator.com/item?id=46985151)
- **Image and video previews on Windows Terminal** and on terminals without the kitty graphics protocol (currently unsupported). — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x34qj4/)
- **Multiplexer-native integration:**
  - native Zellij support (#31901)
  - a `CustomPaneBackend` for WezTerm/Ghostty/Zellij (#26572)
  - correct colors in tmux (#35148)
  - a single shared tmux status widget instead of one per pane (built by one user)

  — [GitHub tmux search](https://github.com/anthropics/claude-code/issues?q=is%3Aissue%20in%3Atitle%20tmux%20sort%3Areactions-%2B1-desc); [Reddit](https://www.reddit.com/r/tmux/comments/1uedjn8/)
- **Benchmarked routing.** Commenters want data before trusting model/effort-picker mods. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1x1nnkn/)
- **A "what just happened" digest when a turn ends.** Built in part by the "You should know" mod and Stop-hook + Haiku summaries. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvc7vc/); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ru9yda/)
- **Cross-platform account switching.** The existing mod is Windows/CLI only. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x2asls/)
- **The Fables mod in a plain terminal.** A commenter is adding a terminal renderer so it works in any terminal under tmux. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ww2cn3/)

### Inferences
- Best opportunities for a user who wants to "rice" Claude Code now:
  - a quiet multi-session "needs you" band or pane that says which session and why
  - a combined quota + context + cache-TTL band that costs zero tokens
  - a git/worktree pane
  - a tasteful theme that fills the codespan, diff and syntax gaps (within what custom themes allow)

  Each addresses a highly upvoted complaint, and each has proven demand but fragmented implementations.

### Gaps
- Some items may already be partly solved by mods released after Oct 13, 2026, or by unlisted marketplace entries. I could not verify full mod catalogs.

## Wow / flex factor

### Takeaway
Showcase posts that combined something you can see or touch with real utility scored highest:
- images and videos rendered in the terminal (1,201)
- the mods launch itself (1,118)
- a "smart watch" theme (910, though polarizing)
- an ADHD terminal manager (894)
- agents as Tamagotchis in tmux (691)
- a 3D cozy-game view of agents (534)
- desk hardware status displays (411; 366 for one built entirely by Claude via mods, including its CAD enclosure)

On HN, peon-ping's Warcraft voices (1,006) were the flex hit of the year. Viewers were most impressed by:
- seeing agent state at a glance without alt-tabbing
- physical objects
- personality (pets and voices)
- the meta-flex that Claude built the entire thing

Pure eye candy without function drew "looks cool but no real use case".

### Cited Findings (ranked by archived score; Reddit figures are pts/comments, HN figures are points/comments)
1. **"Claude Code now shows images and videos in the terminal" — r/ClaudeCode, Oct 11, 2026, 1,201/149.**
   - **What it does:** claude-show-your-work shows screenshots, videos of Claude clicking through your app, and before/after QA inline in the chat.
   - **Requirements:** a kitty-graphics terminal (Ghostty, kitty), macOS and ffmpeg. MIT licensed, runs locally.
   - **What stood out:** it ends the "Done! I fixed the pricing page" then go-check-the-browser loop. The author credits mods with making UI changes possible.
   - **Limitation:** Windows Terminal is unsupported.

   — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1x34qj4/)
2. **Peon-ping, "Warcraft III Peon Voice Notifications for Claude Code" — HN, Feb 12, 2026, 1,006/301.** Nostalgia combined with a genuinely useful audio "work complete" cue. It became a voice-pack ecosystem (peonping.com, with packs including Meeseeks). — [HN](https://news.ycombinator.com/item?id=46985151); [HN](https://news.ycombinator.com/item?id=48899529)
3. **"Introducing Claude Mods" — r/ClaudeCode, Oct 1, 2026, 1,118/206.** Launch hype. A built-in "You should know" session-digest mod impressed early users. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wvc7vc/)
4. **"Smart Watch Theme" — r/ClaudeCode, Aug 16, 2026, 910/110.** Flex in the purest sense: the OP says it "makes me feel smart" and other people can't read it. The top replies were mockery ("Rage bait" [80], "ugly" [24]), so it is high-score but polarizing. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vpyfta/)
5. **"I coded terminal manager for ADHD brains. 100% Opensource." — r/ClaudeCode, Aug 8, 2026, 894/167; also r/ClaudeAI, 685/206.**
   - A native terminal manager for multiple and SSH projects with git built in.
   - Users loved the UI and "finally a use for the notch!"
   - One complaint was that text looked soft on Retina screens; the author suggested switching to GPU rendering per terminal (whether that fixed it was not confirmed).

   — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1vj5ktu/); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1vqx297/)
6. **"I turned my Claude Code agents into Tamagotchis so I can monitor them from tmux" (Recon) — r/ClaudeAI, Mar 15, 2026, 691/76.** Rust + Ratatui, tmux-native. Praised as "the kind of monitoring I actually want": glanceable state instead of 50-chart dashboards. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ru9yda/)
7. **"…I built it 3D cozy game simulation for my agents" (Termi Protocol) — r/ClaudeAI, Jul 29, 2026, 534/130.** A game-dev take on watching agents in an Electron app. Pushback: a forced sign-in to "join a leaderboard". — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1va26us/)
8. **"I built a Claude statusbar hardware display for my desk" — r/ClaudeAI, Jun 28, 2026, 411/41.**
   - Hooks plus JSONL tailing drive a Lilygo T-Display S3 Long. It shows tool use, permission requests, live context, tokens in/out and effort.
   - Claude wrote the firmware and a Python bridge that auto-launches when Claude runs.
   - Top comment: "a claude usage statusbar is the new 'hello world'" [59]. The OP suggests an Adafruit 5805 bar display as an easier-to-find alternative.

   — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ui85ys/)
9. **"I just wanted to try the new Claude Code mods. I ended up with a finished physical object on my desk…" — r/ClaudeCode, Oct 5, 2026, 366/87.**
   - A mod pipes subscription usage and context data over USB to a small display.
   - Claude wrote the mod, the ESP32 firmware and the UI.
   - Claude drove FreeCAD from the manufacturer's dimensioned drawing to design the enclosure and stand, which were then 3D-printed.
   - Commenters: "The CAD part is honestly the most impressive bit" [14]. The top comment [187] is about AI pioneers.

   — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wye4ix/)
10. **"I'm also working on an e-ink smart clock that can handle multiple agent messages and notifications" — r/ClaudeAI, Jun 29, 2026, 280/34.**
    - An agent inbox with a flashing "agent waiting" indicator, procedurally generated clock faces, and a real muon detector (four Geiger tubes with coincidence circuits).
    - Firmware and schematics are to be open-sourced.
    - "Ok this is actually kinda bitchin" [37].

    — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1uihc8t/)
11. **"I built a terminal where you can watch Claude Code work…" — r/ClaudeCode, Oct 5, 2026, 274/70.**
    - A Ghostty fork:
      - The editor types Claude's edits live.
      - A repo map lights up: cyan for reads, orange for edits, with Claude flying between files as a comet.
      - A session sidebar shows which sessions need permission.
      - A diff review inbox sends line comments back as the next prompt.
    - Reactions were split: "looks cool but has no real usecase" [65], "DOPAMINEEEEE" [24], "someone has never spent 2 weeks ricing linux" [5].

    — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wycbbr/)
12. **"I built Claude Fables, a Claude Code mod that turns what Claude is doing into a little animated cartoon above the prompt" — r/ClaudeAI, Oct 2, 2026, 229/31.**
    - 20 actions, 7 hand-lit scenes and 11 styles (pixel art, blueprint, ukiyo-e, golden-age comic). A bug hunt becomes a nature documentary, a failing test makes Claude trip, and a finished turn means a nap in a moonlit village.
    - "Actually really cute" [35]. Someone forked it to add a tmux terminal renderer.

    — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ww2cn3/)
13. **"ascii-agents: a terminal pixel-art office where each of your Claude Code sessions is a character" — r/ClaudeCode, May 24, 2026, 227/44.**
    - Each character's monitor glows by tool (edit blue, bash orange, read cyan, task purple). A character waiting on permission stands up with a "?".
    - Skeptics: "seen at least 7 of these".

    — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1tm49wf/)
14. **"My cursor sprouts a Claude logo the moment Claude Code is waiting on me" — r/ClaudeCode, Jun 15, 2026, 209/31.** A Windows physics cursor that signals "needs you" wherever you are working. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1u6cc24/)
15. **"Final Fantasy theme for Claude" — r/ClaudeAI, Jul 27, 2026, 204/58** (target unclear: claude.ai or Claude Code). — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1v847vv/)
16. **Cmux (HN 198/77) and Claude Chill (HN 192/148).** Utility flexes for multi-agent terminal power users. — [HN](https://news.ycombinator.com/item?id=47079718); [HN](https://news.ycombinator.com/item?id=46699072)
17. **Clawd Tank, "a physical pixel-art crab that reacts to my Claude Code sessions" — r/ClaudeCode, Mar 13, 2026, 187/25.**
    - A ~$12 Waveshare ESP32-C6. Notification cards slide in, the RGB LED cycles, the crab dances when a notification is dismissed and sleeps after five minutes.
    - Top fan request: a version where he toils in the mines while Claude works and passes out when you hit your limit [28].

    — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1rt0ocx/)
18. **Pokémon-styled multi-agent dashboard — r/ClaudeAI, May 8, 2026, 176/30.** — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1t7m3j3/)
19. **Physical Tamagotchi that feeds on Claude Code activity — r/ClaudeAI, Mar 30, 2026, 139/27.** — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1s7lwao/)
20. **Small mod flexes from the mods era (low scores, high wow).**
    - **Doom running inside a mod (7/1).** The mod sandbox has no WebAssembly, so the engine is a native binary started with `$.process.spawn` and driven over a unix socket. It renders as a kitty `Image` or as a quadrant-block `Raster`, and Claude Code redraws only about 3 fps when idle. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wyc0nc/)
    - **pixelband**, seven reactive scenes. — [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wvgw2n/)
    - **glowup**, which restyles everything and adds a pet. — [Reddit](https://www.reddit.com/r/ClaudeCode/comments/1wz4d0e/)
    - **Terminal Gym**, pushups between prompts. — [HN](https://news.ycombinator.com/item?id=49945600)
21. **The Buddy pet as a lost flex — GitHub #45596, about 281 comments.** Users treated their rare buddies as status symbols. One says their buddy "caught 36 bugs in one day". Several rebuilt it as plugins or mods (pixlings imports your old buddy from `~/.claude.json`). — [GitHub #45596](https://github.com/anthropics/claude-code/issues/45596); [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1sgfjss/)

### Inferences
What made these stand out, and what to copy for maximum wow with real use:
- **Ambient state you can see from across the room or desk:** hardware displays, a cursor badge, a notch app, a glyph. The best-scoring builds answer "does an agent need me?" without alt-tabbing.
- **Personality layered on real signals:** pets and animations that react to actual tool calls, test results and permission requests (Fables, Recon, ascii-agents, Clawd Tank). Purely decorative versions ("pink bunny") flop.
- **Showing the work:** inline images and videos, or live edits on a repo map, beat plain text logs. The highest-scoring post of the mods era is exactly this.
- **Meta-flex:** posts stress that Claude built everything (firmware, CAD, launch video). In 2026 that is part of the brag.
- **Mod-specific wow tricks:** kitty-protocol images, reactive scenes in the band above the prompt, side panes with live git or subagent data, and native binaries driven via `$.process.spawn`.

### Gaps
- Scores are archived snapshots; October 2026 mod posts may have grown since capture.
- I could not view the images and videos behind several top posts, so the descriptions come from post text and comments.
- X/Twitter and YouTube showcases (for example "What the Hell Are Claude Mods?" on YouTube, linked on HN at https://news.ycombinator.com/item?id=50003222) are out of scope for this researcher.
