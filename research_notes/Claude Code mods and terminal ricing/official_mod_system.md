# The official Claude Code mod system ("Claude Mods"), as documented and shipped by October 14, 2026

Research date: 2026-10-14. CLI checked locally: Claude Code v2.1.299 (the newest npm release, published 2026-10-14). The docs reference page is written "as of v2.1.290". Doc pages also work with `.md` appended, as in `https://code.claude.com/docs/en/plugins/mods/overview.md`. All 10 mods pages were downloaded and read in full: overview, create, reference, interface, gallery, events, api, test, troubleshoot and admin. Supporting plugin pages, the CHANGELOG, the official announcement, the claude.dev guide and showcase, and the source repos were read too.

---

## 1. What a mod is according to the official docs, and how mods relate to plugins, marketplaces, skills, hooks, slash commands, the status line and output styles

### Takeaway
A mod is a Claude Code plugin with a JavaScript or TypeScript "hooks module". Claude Code loads it into its own process, and its functions handle Claude Code's events as middleware: tool calls, prompts, turns, commands, and every part of the interface as it is drawn. A handler can observe an event, rewrite it, or answer it in Claude Code's place. Settings hooks, skills, status-line scripts and MCP servers all work from outside Claude Code. A mod works from inside, so it is the only extension type that can draw UI (panes, a band above the prompt, buttons, inputs), restyle Claude Code's own rows, add instant `/commands`, and rewrite events. It is installed, versioned and shared exactly like any plugin.

### Cited Findings
**Definition and naming**
- Official definition: "A mod is a plugin that changes how Claude Code looks and behaves. It's made of JavaScript or TypeScript event handlers: Claude Code calls one when an event happens, such as a tool call, a submitted prompt, or a part of the interface being drawn, and the handler can watch the event, change it, or take it over." — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- Terminology: the docs call both kinds of handler "hooks". On the mods pages, "hook" means a mod's handler, and the settings-file kind (shell command, HTTP request or prompt) is a "settings hook". — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- The product name in the changelog is "Claude Mods": v2.1.287 says "Added Claude Mods: plugins may now modify deeper behavior". — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- The engineering name is "function hooks". The type declarations are headed "Claude Code function hooks: the plugin API's TypeScript declarations". — [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts). The pre-launch design issue says the product was renamed "Claude Mods" while "function hook" stayed the engineering term (from a summarized fetch of the issue). — [Issue #91870](https://github.com/anthropics/claude-code/issues/91870)
- Announcement wording (Oct 1, 2026): "mods, small TypeScript functions that change how Claude Code works. A mod can rewrite a prompt, add new UI, replace a built-in feature, or add entirely new functionality… Mods ship inside plugins, so you install and share them like any plugin. They work in the Claude Code CLI and desktop app." — [Customize Claude Code with mods](https://claude.com/resources/articles/claude-code-mods) (https://claude.com/blog/claude-code-mods redirects there)
- Why Anthropic built them: "Hooks helped give users some of this control, but hooks can't rewrite events, draw new UI, or replace features. Mods can." Built-ins are moving to mods: "the built-in /diff feature is now a mod, so you can turn it off (in /plugin) or replace it with your own version. We plan to move more built-in features to mods over time, so you can pare Claude Code down to a small core and add back only what you want." — [Announcement](https://claude.com/resources/articles/claude-code-mods)

**What a mod can do (the overview's five capabilities)**
- Draw an interface you can use: a pane beside the transcript or a band above the prompt, with tabs, buttons and text fields.
- Redraw Claude Code's own interface: replace or restyle a tool call's row, the spinner, or the dialog Claude uses to ask questions.
- Step into a tool call or request: hold a call while asking the user, answer it without running the tool, or send a request to a different model.
- Run your own code on a `/command`: it runs at once, with no Claude turn, even while Claude is working.
- Share data between hooks through module variables. For example, one hook counts tool calls and another shows the count beside the spinner.
- Source for all five: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- The three ways a hook handles an event are **Observe** (return `next(e)`), **Rewrite** (call `next` with a modified copy) and **Answer** (return a result without calling `next`). Anything outside the hook's own code, such as drawing, file, process or network access, or model calls, has to go through the mods API (`$`). "which is why Claude Code can list what a mod does before you install it". — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)

**Relationship to the other extension types (official comparison table)**

| | Mod | Settings hook | Skill | MCP server |
|---|---|---|---|---|
| What it is | Functions in a plugin that Claude Code calls in its own process | Shell command / HTTP request / prompt run on a lifecycle event | `SKILL.md` instructions Claude reads | External process giving Claude tools |
| Can draw in the interface | Yes | No | No | No |
| Written in | JavaScript or TypeScript | A script plus a `settings.json` entry | Markdown | Any language |
| Pick it when | You want a pane, a band above the prompt, a custom command, or to rewrite an event | You want to block, allow or log with an existing script | You keep pasting the same instructions | Claude needs an external system |

Source for the table: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview). A plugin can hold all of these together, "so a mod can ship in the same plugin as a skill and an MCP server". — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)

- **Plugins and marketplaces**: what makes a plugin a mod is the `modules` key in `hooks/hooks.json`. That same `hooks.json` can also hold settings hooks under `hooks`. — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create), [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference). A mod installs from a marketplace as `name@marketplace`, and the install, scope and update docs "apply to a plugin that contains a mod without changes". — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview). The Claude directory (claude.ai/directory) accepts plugins that include mods, and you submit at claude.ai/directory/manage. — [Announcement](https://claude.com/resources/articles/claude-code-mods)
- **Settings hooks**: these are not deprecated. Command, HTTP, prompt and agent hooks "run as before, alongside mods". — [Admin](https://code.claude.com/docs/en/plugins/mods/admin). Every settings hook event is also a mod event named `classic.<Event>`, such as `classic.Stop`, with the settings hook's stdin JSON as `e`. — [Events](https://code.claude.com/docs/en/plugins/mods/events). Mods run in a fixed order relative to settings hooks: managed `PreToolUse` hooks run before any mod, and other `PreToolUse` hooks run after the last mod calls `next`. — [Events](https://code.claude.com/docs/en/plugins/mods/events)
- **Settings hooks compared with mods (guide)**: "A settings hook runs a shell command for each event and passes JSON over stdin and stdout. A mod is loaded once and stays in the session. It can keep state, draw UI that updates as events happen, and call back into Claude Code: open a pane, run a process, register a slash command, or register a tool the model can call." — [claude.dev guide (Addy Osmani, Oct 1, 2026)](https://claude.dev/blog/getting-started-with-claude-code-mods/)
- **Skills**: Claude writes mods using a built-in skill named `plugin-authoring`. Claude loads it when you ask for a mod, or you run `/plugin-authoring` yourself. — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create). A mod can rewrite a skill's text through `skill.prompt`. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Slash commands**: a mod registers commands with `$.command.register` in `session.start` and answers them in `command.run`. `immediate: true` lets a command run while Claude is working. A built-in name is refused, for example `"/focus" refused: it is the built-in /focus`. — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api). `command.describe` can change any command's description, hint or visibility. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Tools for Claude**: `$.tool.register` adds a tool that Claude sees as `mcp__<plugin>__<name>`. — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)
- **Status line**: `$.ui.status(text)` shows "One line under the prompt that stays until you change it. It starts with `⚠` and the mod's name". — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api). The interface map labels this "a status line under the prompt". — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface). `$.session.usage()` returns context, rate limits and cost "as the status line has them". — [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts), [token-weather README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather). `disableAllHooks` also stops "your settings hooks and custom status line", while `allowManagedModsOnly` leaves users' status lines working. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview), [Admin](https://code.claude.com/docs/en/plugins/mods/admin)
- **Output styles and themes**: the mods pages never mention output styles. Plugins carry color themes (`themes/<slug>.json`, which appear in `/theme`) and output styles as separate, non-mod components. — [Add components to a plugin](https://code.claude.com/docs/en/plugins/components). Mods can change the system prompt through `prompt.compose` and `prompt.section` and can redraw `AssistantMessage` rows. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Built-in mods** (listed in `/plugin` → Installed → **Built-in**; you can't update or uninstall them):
  - `cc-plugin-agents-md`: AGENTS.md support
  - `cc-plugin-diff`: takes over `/diff` and draws its pane
  - `cc-plugin-plugin-authoring`: the skill only, no mod code
  - `cc-plugin-sec-default`: the organization guard
  - `cc-plugin-telemetry`
  - `cc-plugin-you-should-know`: a side agent that shows notes above the prompt, off until you turn it on
  - Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview). The changelog says to turn the last one on with `/plugin enable cc-plugin-you-should-know@builtin`, "for first-party sessions with telemetry on". — [CHANGELOG v2.1.287](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- The built-in skill's one-line description, as listed in this v2.1.299 environment's skill list (local observation, no URL): "plugin-authoring: Make a mod: a change to Claude's own interface or behaviour, such as a live pane or panel, a band above the prompt, a status line, a toast, a slash command, or a hook on tool calls or prompts."

### Inferences
- The render-site table has no site for the user's configured `statusLine` command output. A mod can therefore add its own `⚠ mod: …` line and draw the band right above the prompt, but it apparently cannot restyle the statusLine script's output. Use the status-line feature and a mod band together.
- Mods are the first official extension point that is both programmable and visual. Most terminal "ricing" that is interactive or event-driven (live meters, panes, restyled spinner and tool rows) now belongs in a mod. Static looks belong in themes, output styles and statusLine settings.
- The stated plan to move more built-ins into mods suggests the moddable surface will keep growing quickly.

### Gaps
- The full text of the bundled `plugin-authoring` skill could not be read. It is not plain text anywhere under `/opt/node22/lib/node_modules/@anthropic-ai/claude-code/`, and grep for "plugin-authoring" and "dev-mods" in `cli.js` returned nothing. `/root/.claude/skills` and `/root/.claude/plugins` have no copy. Only its description and the changelog's notes on improvements to it were available.
- No official page compares mods with output styles or themes directly.

---

## 2. UI surfaces a mod can control; file layout, manifest, API and lifecycle; what data and events a mod can read, and how often it refreshes

### Takeaway
The confirmed UI surfaces are:
- **Your own regions**: panes (a sidebar in wide fullscreen terminals, otherwise a framed region above the prompt) and the shared band above the prompt.
- **Claude Code's own render sites**: user and assistant messages, tool use, result and group rows, command output, the `AskUserQuestion` dialog, spinner, tool progress, turn duration, info notices, mode labels and the prompt hint line. The permission prompt is excluded.
- **Fire-and-forget outputs**: a `⚠` status line under the prompt, toasts, dim transcript log lines, question dialogs, native notifications (v2.1.295+) and a line under each answer.
- **Prompt-box helpers**: draft fill, ghost-text suggestions and autocomplete rows.
- **Sound**: audio clips and speech.

A mod is three files: a manifest, `hooks/hooks.json` with `modules`, and an ES-module `register(on, options)` file. Its data comes from events and the `$` API: context, rate limits and cost, per-request tokens, turns, tool calls, the transcript, subagents, settings, and git through processes. Redraws are event-driven, plus your own timers, throttled to 10 per second (30 in the terminal for the visible pane, band and hint line).

### Cited Findings
**File layout and manifest**
- Required files:
  - `.claude-plugin/plugin.json`: the normal plugin manifest. "Mods add no required fields."
  - `hooks/hooks.json`: `"modules": ["./register.js"]`, exactly one path, relative to `hooks.json`.
  - The hooks module: exports `register(on, options)`. It can be named `.js .mjs .cjs .jsx .ts .mts .cts .tsx`, and it is always an ES module.
- Optional files:
  - `types/index.d.ts`, named by `"types"` in the manifest. Required when the mod uses `$.state` or adds an API namespace.
  - `*.test.ts` / `*.test.tsx` tests.
- `options` holds the values of the manifest's `userConfig` fields, with defaults filled in.
- Source for all of the above: [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- Minimal example (the docs' `first-mod`):
  - Layout: `first-mod/.claude-plugin/plugin.json` + `first-mod/hooks/hooks.json` + `first-mod/hooks/register.js`
  - Manifest: `{"name":"first-mod","version":"0.1.0","description":"…","author":{"name":"Your Name"}}`
  - hooks.json: `{"description":"The first-mod hooks module","modules":["./register.js"]}`
  - Source: [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- You need no Node.js, bundler or build step: "Claude Code loads `.js` and `.ts` files directly". — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create). JSX works in `.tsx`/`.jsx` files. — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- The module's environment has no Node.js APIs, no timer globals such as `setTimeout`, and no file or network access of its own. Standard web APIs (`URL`, `TextEncoder`, `AbortController`, `crypto.subtle`) are available. — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)
- Installed mods share one worker thread. A hook that blocks the thread can get its mod unloaded ("it crashed the hooks worker"). — [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot)

**The hook function**
- Signature: `on(event, matcher?, async ($, e, next) => …)`.
  - `$` is the mods API.
  - `e` is the event's input, "deeply frozen plain data". To change it, pass a copy to `next`.
  - `next(e)` runs later hooks and then Claude Code's own behavior.
  - `next.signal` is an `AbortSignal`; `next.origin` is `{plugin, tier}`; `next.budget` holds `ms`/`remainingMs`.
  - `next.to(e, tier)` skips ahead and is available only to `prependPlugins`/`appendPlugins` mods.
  - `.catch(handler)` sets an error handler, which can read `next.error` (`throw`/`timeout`/`re-entry`) and `next.called`.
  - `turn.step` and `process.spawn` hooks are async generators.
  - Source: [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- Matchers compare event fields:
  - a value: `{ tool: 'Bash' }`
  - an array: `{ tool: ['Edit','Write'] }`
  - a regex: `{ tool: /^mcp__github__/ }`
  - Wildcards: `'classic.*'` and `'*'`. `*` matches everything except telemetry events.
  - Registering the same event twice without a matcher fails the load.
  - Source: [Events](https://code.claude.com/docs/en/plugins/mods/events)
- Static-analysis rules, enforced by `claude plugin validate` and at load:
  - Write every call as `$.namespace.method`. Don't alias, destructure or compute it.
  - Event names must be string literals.
  - Don't shadow `on`.
  - Only relative imports, plus the bare `claude-code` import. No dynamic `import()`. No `require`.
  - At most 2,000 nested scopes per file.
  - Source: [Create a mod](https://code.claude.com/docs/en/plugins/mods/create), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)

**All events by group (as of v2.1.290, per the reference)**
- **Tools**:
  - `tool.call`: return `next(e)`, `{deny}` or `{result}`. It also fires for subagents' calls and MCP tools.
  - `tool.check`: the final allow/ask/deny decision, made after the rules and `PreToolUse` hooks.
  - `tool.describe`: rewrite tool descriptions and deferral.
- **Prompts**:
  - `prompt.submit`: rewrite the text, add Claude-only `context`, or `{drop}`.
  - `prompt.fill`, `prompt.suggest`, `prompt.edit`.
  - `prompt.autocomplete`: add rows under Claude Code's own autocomplete.
  - `prompt.compose`: the list of system prompt sections. `prompt.section`: one section.
  - `prompt.context`: the first-message context. `prompt.attachment`: reminders.
  - `prompt.mention`: @-file reads.
  - `skill.prompt`, `attribution.text`.
- **Commands and config**: `command.run`, `command.describe`, `config.set`, `config.describe`.
- **Turns**:
  - `turn.start`
  - `turn.step`: one model request. It can switch `model` or `effort`.
  - `turn.complete`: can show a `{text}` line under the answer.
- **Session**:
  - `session.start`: runs once per mod before the first prompt and again on reload. It does not run after `/clear`, `/resume` or `/branch`.
  - `session.end`: reports a reason.
  - `session.compact`: can `{skip}`.
  - `session.receive` / `session.send`: messages between sessions.
  - `session.append`: rewrite stored rows.
  - `session.attach` / `session.detach`.
  - `session.measure`: fires after each turn and when a plan-limit percentage changes.
- **Subagents**: `agent.offer`, `agent.spawn`, which can choose a subagent's model or deny it.
- **Interface**: `ui.render`, `ui.resolve`, `ui.press`, `ui.input`, `ui.select`, `ui.focus`, `ui.scroll`, `ui.close`, `ui.message` (posts from a `Client`), `ui.fault`.
- **Other mods**: `plugin.register` (refuse a mod) and `engine.create` (add an API namespace).
- **Telemetry**: `telemetry.log` / `telemetry.mark`. An installed mod must filter these with `{ to: 'collector' }`.
- **Classic and API events**: every settings hook event is `classic.<Event>`, and every mods API call is itself an event, such as `fs.read` or `model.complete`.
- Source for all events: [Reference](https://code.claude.com/docs/en/plugins/mods/reference)

**The mods API (`$`) namespaces**
- `$.plugin`: `name`, `root`.
- `$.ui`: `resolve`, `invalidate`, `open`, `close`, `panes`, `focus`, `scroll`, `toast`, `status`, `log`, `notice`, `ask`, `copy`, `selection`, `blit`.
- `$.command`: `register`, `run`, `list`.
- `$.tool`: `register`, `call`, `check`, `list`.
- `$.agent`: `register`, `spawn`, `list`. `list` returns statuses: pending, running, waiting, idle, completed, failed, killed.
- `$.model`: `complete`, `fork`, `classify`.
- `$.prompt`: `submit`, `read`, `fill`, `suggest`, `compose`.
- `$.turn`: `abort`.
- `$.session`: `messages`, `cwd`, `root`, `model`, `turns`, `id`, `repo`, `surfaces`, `usage`, `version`, `compact`, `send`, `append`, `authorize`.
- `$.config`: `list`, `set`. `$.settings`: `read`. `$.env`: `get`, `set`.
- `$.fs`: `read`, `write`, `list`, `exists`, `stat`, `ancestors`.
- `$.store`: `get`, `set`, `delete`, `keys`.
- `$.state`: `get`, `set`, plus the helpers `atom`, `read`, `update`, `derive`, `memberOf`.
- `$.clock`: `now`, `sleep`, `after`, `every`.
- `$.http`: `fetch`. `$.process`: `run`, `spawn`. `$.mcp`: `call`, `connect`.
- `$.audio`: `play`, `speak`. `$.telemetry`: `log`, `mark`.
- Source for the namespace list: [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- Added after the reference's v2.1.290 snapshot, per the changelog:
  - v2.1.295: `$.ui.notify`, which raises a native notification "through your own notification setting". `Button` can also take children.
  - v2.1.299: `$.prompt.media` and `$.session.identity()` (both for mods installed by managed settings). `Text` gains `size`, `weight`, `mono` and `tabular`, with `bold` deprecated in favor of `weight`. `Box` gains spacing steps `xs` to `xl`.
  - v2.1.288: `$.ui.selection()`, which returns your fullscreen text selection.
  - Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**UI surfaces: where a mod can draw**
- The official screen map, a terminal in fullscreen rendering, shows where a mod can draw:
  - a pane as a right sidebar
  - a toast at the top right of the transcript
  - a log line in the transcript
  - a band above the prompt
  - a status line under the prompt
  - redrawn messages, tool rows and the spinner
  - "The prompt is Claude Code's own."
  - Map images: [light](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-screen-map.svg) / [dark](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-screen-map-dark.svg). — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Pane** (`ui.render` with `{ component: 'Pane' }`, keyed by `e.requestId`):
  - It is a sidebar beside the transcript in a wide fullscreen terminal, otherwise a framed region above the prompt. Several open panes each get a tab.
  - You open it with `$.ui.open({ id, title?, focus?, closeOnEscape?, holdToasts?, rows?, columns? })`. The boolean fields accept only `true`.
  - A pane opened by user action appears at any width. A pane the mod opens on its own appears only from 144 columns, or 110 after the user has opened it once.
  - `$.ui.open` resolves to `{ isPlaced, reason }`.
  - Source: [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Band above the prompt** (`{ component: 'AbovePrompt' }`):
  - "a strip directly above the prompt input. It's always there, and every mod shares it."
  - A returned tree replaces what later mods draw there, unless you include `await next(e)` in your tree.
  - Source: [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Claude Code's own render sites** (`e.component`; the reference lists `e.props` and which apps render each):

  | Site | Rendered on |
  |---|---|
  | `Pane`, `AbovePrompt` | Terminal, Desktop |
  | `UserMessage`, `AssistantMessage` | Terminal, Desktop |
  | `ToolUse`, `ToolResult`, `ToolGroup` | Terminal, Desktop |
  | `CommandOutput`, `AskUserQuestion` | Terminal, Desktop |
  | `ToolProgress` | Terminal only |
  | `Spinner` (props `word`, `message`, `suffix`, `mode`) | Terminal, Desktop |
  | `TurnDuration`, `InfoNotice` | Terminal only |
  | `SessionMode` (footer mode labels), `PromptHint` (hint line under the prompt) | Terminal, Desktop |

  - At these sites a hook can change a detail (`next({...e, props:{...}})`), replace the drawing (return a tree), or leave it alone. `e.viewport` gives `columns`, `rows` and `isFullscreen`. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Not moddable**: "The permission prompt isn't a render site, so a mod can't change what it shows." — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Outputs that need no render hook**:
  - `$.ui.status(text)`: a persistent `⚠ my-mod: …` line under the prompt.
  - `$.ui.toast(text,{timeoutMs})`: a box at the top right in fullscreen rendering, or one line at the right under the prompt in the classic renderer. It lasts 4 s by default; `timeoutMs` ranges from 1 to 60000.
  - `$.ui.log(text)`: a dim `● my-mod: …` transcript line that Claude doesn't read. Add `{to:'debug'}` to write to the debug log instead.
  - `$.ui.ask(question, options)`: the question dialog, which can hold a tool call until the user answers.
  - A `turn.complete` hook can return `{text}` to show a line under the answer.
  - Sources: [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api), [Events](https://code.claude.com/docs/en/plugins/mods/events), [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot)
- **Elements** (from `$.ui.resolve(e)`):
  - `Box`: flex layout, `gap`, `padding`, `margin`, `width`, `height`, `backgroundColor`, `position`, `hover`, and borders. `borderStyle` is one of `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`, `arrow`, `dashed`, `quote`. Any other name draws no border.
  - `Text`: `color`, `backgroundColor`, `bold`, `italic`, `underline`, `dimColor`, `inverse`, `wrap`.
  - `Button`: `key`, `label`, `onPress`, `hotkey`, `plain`, `dimColor`, `autoFocus`, `action`.
  - `Link`, `Code` (syntax colors, or `format:'diff'`), `Markdown`, `Input`, `Select`.
  - `Svg`: Desktop only, up to 131,072 characters.
  - `Client`: a second module for animation and pointer input.
  - `Raster`: terminal only, up to 512 columns × 256 rows of colored cells.
  - `Image`: terminal only, PNG or RGBA up to 2 MiB, up to 255 × 255 cells.
  - Source: [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- A `Text` `color` can be a theme key or a color such as `'red'`. `wrap` is one of `wrap`, `truncate`, `truncate-start`, `truncate-middle`, `truncate-end`. — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface). `ThemeKey` and `Color` types were added in v2.1.290. — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- An invalid tree makes Claude Code draw its own version of the site. With `--plugin-dir`, a transcript line explains why, for example `ui.render (Pane) refused: Text prop "bogusProp" is not allowed; the engine drew its own`. — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Keyboard**:
  - A pane or band gets focus through `focus:true` from a command or press, through Ctrl+X then Tab, or through a click.
  - Tab moves between controls and Enter presses. Up, Down, PgUp, PgDn, Home and End scroll.
  - Ctrl+X then an arrow resizes a pane. Ctrl+X then X closes it. Esc returns focus to the prompt.
  - Hotkeys are a single digit or lowercase letter.
  - "A mod can't bind Tab or the arrow keys… so a game steers with `w`, `a`, `s`, and `d`."
  - Source: [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- **Prompt box**:
  - `$.prompt.fill` writes a draft into the prompt box.
  - `$.prompt.suggest` shows a dim suggestion.
  - `prompt.autocomplete` adds rows below Claude Code's own (v2.1.292).
  - `$.prompt.submit({text, asUser?})` starts a turn once the session is idle.
  - Sources: [Reference](https://code.claude.com/docs/en/plugins/mods/reference), [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

**Data a mod can read**
- **Context, plan limits and cost**: `$.session.usage()` returns `{ startedAt, context:{tokens, window, percent}, rateLimits:[{kind, percentUsed, resetsAt}], cost }`. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference). The plain call "costs nothing"; `{breakdown:"full"}` counts each category. — [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts). The guide adds that it "only sends a token-count request if you ask for a breakdown". — [claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)
- The token-weather README says "These are the same figures the status line shows (`total_input_tokens`, `context_window_size`, `used_percentage`)". It also notes the percentage is of the full window, while Claude Code's own "context used" notice counts toward the auto-compact point. In testing the band read 81% when the notice read 90%. — [token-weather README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather)
- **Per request**:
  - A `turn.step` result carries `usage`: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, and the answering `model`. `serverToolUses` (v2.1.290+) lists the API's own tool calls, such as the advisor.
  - `turn.complete` gives `e.answer`, `e.durationMs`, `e.usage`, `e.isAborted` and `e.agentId`.
  - Source: [Events](https://code.claude.com/docs/en/plugins/mods/events)
- **Tool calls**: `tool.call` gets the tool name and every argument (`e.command`, `e.file_path`, …) and can await the result. Generated types narrow by tool (`claude-code-tools/index.d.ts`) and include MCP tool inputs (`claude-code-mcp/index.d.ts`). — [Events](https://code.claude.com/docs/en/plugins/mods/events), [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- **Session and transcript**: `$.session.messages()` returns the transcript as `{role, text, toolUses}`, the newest 4,096 entries. `$.session` also gives the working directory, model, id, repo and surfaces. `$.agent.list()` returns subagents and teammates with their status. — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Git**: there is no dedicated git API in the guides. The examples run git through `$.process.run(['git','branch','--show-current'])`, which takes an argv list with no shell, has a 30 s default and 10 min maximum timeout, and returns `{exitCode, stdout, stderr}`. — [Events](https://code.claude.com/docs/en/plugins/mods/events), [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api). The built-in `/diff` mod reads git through `process.run` and polls HEAD while its pane is open. — [diff README](https://github.com/anthropics/claude-code/blob/main/mods/diff/README.md)
- **Settings, environment, files, network, MCP and models**:
  - `$.settings.read` and `$.env.get` read settings and environment variables.
  - `$.fs` reads and writes files, up to 4 MiB per file.
  - `$.http.fetch` handles http and https, with a 4 MiB body, 30 s, and 5 redirects.
  - `$.mcp.call` calls MCP tools.
  - `$.model.complete` runs a standalone prompt and `$.model.fork` sends the conversation plus your prompt. Both bill to the user's plan or key. `complete` supports prompt caching (v2.1.292+).
  - Sources: [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)

**Refresh and lifecycle**
- Claude Code re-runs a `ui.render` hook only when the site's props change or the terminal's width changes, after `ui.fault`, or when the mod calls `$.ui.invalidate('ui.render')`. "It doesn't run the hook on a timer". — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- Redraws are "Throttled to 10 a second, or 30 in the terminal for the visible pane, the expanded band, and the hint line under the prompt. Calls that come sooner are coalesced." — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- Timers: `$.clock.every(ms, fn)` and `$.clock.after(ms, fn)` replace `setInterval` and `setTimeout`. They stop when the module reloads. — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)
- State lifetimes:
  - Module variables last until reload, and every save during development reloads.
  - `$.state` is reactive and survives reloads. Reading it in a render subscribes that render, so you don't call `invalidate`. It resets on `/clear`, `/resume` and `/branch`; reload from `$.store` in a `classic.SessionStart` hook filtered to `source: clear|resume|fork`.
  - `$.store` is a cross-session JSON key-value store under `~/.claude/plugins/store/`, 4 MiB in total. It is shared by all sessions on the machine and is not atomic across them.
  - Source: [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- `session.start` blocks the first prompt, so register commands and tools there. Claude Code waits for that hook. — [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)

**Authoring workflow**
- **Ask Claude**: describe the mod in an interactive session, for example "make a mod that shows the current git branch above the prompt".
  - Claude writes it to `~/.claude/dev-mods/<session-id>/<mod>/`.
  - In `default` and `acceptEdits` modes you approve each file, because `~/.claude` is a protected path.
  - On the first save, Claude Code asks whether to enable hot reloading: "Enable for this session" or "Not now".
  - The mod loads at turn end and reloads after each turn that changes it.
  - It loads only in that session and is deleted after `cleanupPeriodDays`. Copy it out, for example to `~/mods/git-branch`, then use `claude --plugin-dir ~/mods/git-branch` or a marketplace.
  - It can't load in `claude -p`, `dontAsk` mode, untrusted workspaces, `--safe-mode`, `--bare`, under `disableAllHooks`, or where policy blocks it.
  - Source: [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- **Write it yourself**:
  - Run `claude --plugin-dir ./first-mod`. It hot-reloads the hooks module on every save, and each reload re-runs `register` and `session.start`.
  - Test a command headlessly: `claude -p "/tally" --plugin-dir ./first-mod`.
  - Claude Code writes types for your exact build into `.claude-plugin/types/`: `claude-code/index.d.ts`, `claude-code-tools/index.d.ts`, `claude-code-mcp/index.d.ts`, one per-dependency `index.d.ts`, and a `tsconfig.json`. "trust these files over any page".
  - Source: [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- **Validate without running**: `claude plugin validate ./first-mod` prints lines such as `hooks: session.start, tool.call, command.run{command=tally}, ui.render{component=Spinner}` and `calls: $.command.register, $.ui.invalidate`. It also prints `env reads/writes`, `state reads/writes`, and `gating hook without .catch` lines. `--strict` and `--json` are available. — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create), local `claude plugin validate --help` (v2.1.299)
- **Test without a session**:
  - `claude plugin test [dir]` runs `*.test.ts(x)` files using `import { test, expect, describe, mock, tier } from 'claude-code/testing'`.
  - Stubs: `mock.clock`, `mock.store`, `mock.env`, `mock.session`.
  - `$.ui.mount({plugin, surface, component, props})` draws a site, and the handle can `press`, `input` and `find` elements.
  - Each test has 5 s by default.
  - Running `claude plugin test` from a non-mod directory also reports whether mods can load at all.
  - Sources: [Test a mod](https://code.claude.com/docs/en/plugins/mods/test), [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot), local `claude plugin test --help` (v2.1.299)

**Platform notes**
- The docs give Bash/Zsh and PowerShell versions of the setup commands. — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- `CLAUDE_CODE_PLUGIN_DIRS` separates paths with `:`, or `;` on Windows. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- Desktop WSL sessions load no plugins, so no mods. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- `Image` draws only where Claude Code detects kitty graphics with Unicode placeholders: kitty 0.28+ and Ghostty. It never draws inside tmux or screen, or in background sessions. `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` skips detection. — [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery)
- `$.audio.play` plays through the platform's player (`afplay` on macOS). `$.audio.speak` uses the platform synthesizer (`say` on macOS). — [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts)

### Inferences
- For "ricing", the highest-value surfaces are:
  - the band above the prompt: always visible, but shared with other mods
  - the `Spinner`, `ToolUse`/`ToolResult` and `PromptHint` sites, which restyle Claude Code itself
  - a docked pane in a wide fullscreen terminal
  - `$.ui.status` for a compact always-on readout
- Desktop users get `Svg` but lose `Raster`, `Image` and a few terminal-only status sites.
- There is no todos API. A todo dashboard would have to observe the todo tool's calls in `tool.call`. That approach is unverified, and the tool name depends on your build's `claude-code-tools` types.

### Gaps
- The `$.session.repo()`, `$.ui.notice`, `$.ui.copy`, `$.ui.panes` and `$.audio` semantics are documented only in the generated types, not in the guides. The GitHub copy of the types is older (see section 5).
- `$.audio` players and synthesizers on Linux and Windows are not named in the declarations I read.
- The reference is "as of v2.1.290", so APIs added in v2.1.292–v2.1.299 appear only in the changelog.

---

## 3. Installing, enabling or disabling, configuring, updating, listing and removing mods; storage on disk

### Takeaway
Mods use the plugin machinery unchanged:
- **Install**: `/plugin install name@marketplace` in a session, or `claude plugin install name@marketplace --scope user|project|local` in the shell.
- **Manage**: the `/plugin` panel (Discover / Installed / Marketplaces / Errors tabs), or `claude plugin enable|disable|uninstall|update|list|configure`.
- **Session-only loading**: `--plugin-dir`, `--plugin-url`, or `CLAUDE_CODE_PLUGIN_DIRS`.
- **Kill switches**: `--safe-mode` for one session, or `"disableAllHooks": true` everywhere.
- **Storage**: installed copies live under `~/.claude/plugins/cache/…`, mod data in `~/.claude/plugins/store/`, and Claude-written dev mods in `~/.claude/dev-mods/<session-id>/`.

### Cited Findings
- **Install a mod**: in a session, run `/plugin install token-chart@your-org`; in the shell, run `claude plugin install token-chart@your-org`. If you install from the shell while a session is open, run `/reload-plugins` in that session. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- In a session, `/plugin install` opens the plugin's details so you can review it and choose a scope before anything installs. — [Install plugins](https://code.claude.com/docs/en/plugins/install)
- **Scopes**:
  - User: `enabledPlugins` in `~/.claude/settings.json`, every project on the machine.
  - Project: `.claude/settings.json`, committed for collaborators. Each collaborator still runs `claude plugin install <name>@<marketplace> --scope project` once.
  - Local: `.claude/settings.local.json`.
  - Precedence: local over project over user. Managed-scope plugins appear in `/plugin` but can't be changed.
  - The terminal, Desktop local sessions and the VS Code extension read the same settings files.
  - Source: [Install plugins](https://code.claude.com/docs/en/plugins/install)
- **Shell management**:
  - `claude plugin install`, `enable`, `disable`, `uninstall`, `update` (a restart or `/reload-plugins` applies it), `list` (prints Version / Scope / Status), `details <name>` (component inventory and projected token cost), `configure <plugin>` (shows options; `--values-stdin` saves them), `marketplace`.
  - `enable`/`disable` act on the most specific scope that lists the plugin. `install`/`uninstall` default to user scope.
  - `init|new <name>` scaffolds at `~/.claude/skills/<name>/` with `--with skills, agents, hooks, mcp, lsp, output-style, channel`. There is no mod-specific scaffold option.
  - Sources: [Install plugins](https://code.claude.com/docs/en/plugins/install), [Plugin commands reference](https://code.claude.com/docs/en/plugins/cli-reference), local `claude plugin --help` / `claude plugin init --help` (v2.1.299)
- **The in-app panel**:
  - `/plugin` opens on **Discover**. The other tabs are **Installed** (enable, disable, update, uninstall; built-in mods sit under **Built-in**), **Marketplaces** (add, remove, auto-update toggle) and **Errors**.
  - `/plugin list [--enabled|--disabled]` prints inline.
  - Closing the panel with pending changes runs `/reload-plugins`. `/reload-plugins --force` applies a reload that would invalidate the prompt cache.
  - Sources: [Install plugins](https://code.claude.com/docs/en/plugins/install), [Plugin commands reference](https://code.claude.com/docs/en/plugins/cli-reference)
- **See loaded mods**: `/plugin` shows a dim line under the tabs, such as `1 mod active · first-mod`. Built-in mods are omitted from that line. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- **Turn mods off**:
  - One mod: disable or uninstall its plugin in `/plugin` → Installed.
  - Every installed mod for one session: `claude --safe-mode`, which also disables other customizations.
  - Every mod you installed, in every session: `"disableAllHooks": true` in `~/.claude/settings.json`, which also stops your settings hooks and custom status line. Organization-managed mods keep running.
  - `disableAllHooks`, `--bare` and `--safe-mode` don't stop built-in mods.
  - Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- **Version requirement and the old flag**: mods are on by default from v2.1.287 in the terminal and v2.1.286 in the Desktop app's Code tab. Check with `claude --version`, or `/status` → **Claude Code** row in Desktop. `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` from early access is ignored from v2.1.287, so setting it to `0` doesn't turn mods off. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- **Configure**:
  - Manifest `userConfig` fields become `register`'s `options`. Values live in `pluginConfigs`, keyed by plugin id (`acme-guard@acme-tools`, or `first-mod@inline` for `--plugin-dir`), in user or managed settings. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
  - A built-in example: `{"pluginConfigs":{"agents-md@builtin":{"options":{"instructionFiles":"claude-md-and-agents-md"}}}}`, also exposed as the `/config` row "Project instructions". — [agents-md README](https://github.com/anthropics/claude-code/blob/main/mods/agents-md/README.md)
- **Session-only loading**:
  - `--plugin-dir <path>` takes a directory or `.zip` and can be repeated. A folder of plugins loads each child that has `.claude-plugin/plugin.json`.
  - `--plugin-url <url>` fetches a `.zip`.
  - These load as `<name>@inline`, with scope `session`.
  - The `CLAUDE_CODE_PLUGIN_DIRS` environment variable, or `env` in `~/.claude/settings.json`, serves apps you can't pass flags to.
  - `CLAUDE_CODE_PLUGIN_DIR_WATCH=1` hot-reloads in long-running non-interactive sessions.
  - Sources: [Plugin commands reference](https://code.claude.com/docs/en/plugins/cli-reference), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Updates and development**: Claude Code caches an installed plugin by version, so edits don't reach the installed copy until you increment the version and reinstall. "Keep developing against the directory with `--plugin-dir`". — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- **On disk**:
  - The plugins root is `~/.claude/plugins`, overridable with `CLAUDE_CODE_PLUGIN_CACHE_DIR`. It holds `cache/<marketplace>/<plugin>/<version>/` (the loaded copy), `marketplaces/<name>/` clones, `installed_plugins.json` (scope, installPath, version) and `known_marketplaces.json`. — [Plugin loading reference](https://code.claude.com/docs/en/plugins/loading)
  - `$.store` data is a JSON file under `~/.claude/plugins/store/`. — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
  - Claude-written mods go to `~/.claude/dev-mods/<session-id>/`. — [Create a mod](https://code.claude.com/docs/en/plugins/mods/create)
- **Removing a marketplace** uninstalls every plugin installed from it. — [Install plugins](https://code.claude.com/docs/en/plugins/install)
- **Where mods run**:

  | Where | Hooks run | What the mod draws appears |
  |---|---|---|
  | `claude` in a terminal, including IDE terminals and the JetBrains plugin | Yes | Yes |
  | Desktop Code tab | Yes | Yes, except terminal-only elements |
  | Desktop WSL session | No | No |
  | VS Code extension chat panel | Yes | No |
  | `claude -p` / Agent SDK | Yes | No |
  | Remote Control | Yes | In the terminal on your machine |
  | Cloud sessions | Yes, for plugins that reach the session | No |

  Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)

### Inferences
- Collecting mods: keep a personal local marketplace folder with a `.claude-plugin/marketplace.json` listing each mod by relative path, as the playground does. Then use `claude plugin marketplace add ./my-mods` and `claude plugin install <mod>@my-mods --scope user`. User scope makes the rice follow you across projects.
- Several band-drawing mods compete for one band. Disable the extras per project at local scope.

### Gaps
- The docs don't name a dedicated "mods" filter in `claude plugin list`. Mods are recognized only through the `mods active` line and the Built-in group.
- A design-issue commenter reported on Oct 9 that "Mods don't load in cloud sessions or Projects" (tracked as #100737). That conflicts with the docs' table and is unverified. — [Issue #91870 (summarized fetch)](https://github.com/anthropics/claude-code/issues/91870)

---

## 4. Limits, the security and trust model, enterprise controls, performance budgets and troubleshooting

### Takeaway
Mods are not sandboxed. They run in Claude Code's process (a shared worker thread) with your user permissions: files, processes, network, secrets, every prompt and tool call, and the power to approve tool calls and spend your usage. They cannot change the permission prompt. Safety comes from:
- reviewing mods statically with `claude plugin validate` before installing
- the existing plugin and marketplace controls
- a built-in guard, `sec-default`, which on managed or Team/Enterprise machines keeps user mods away from org policy
- managed settings: `allowManagedModsOnly`, `allowManagedHooksOnly`, `disableAllHooks`, `disableSideloadFlags`, `prependPlugins`/`appendPlugins`

Hooks fail open by default: a failing hook is skipped. Use `.catch` to fail closed. Budgets are 10 s of hook CPU time per event (50 ms for `prompt.edit`), redraws at 10–30 per second, and several 4 MiB I/O caps.

### Cited Findings
- **What a mod can reach**:
  - It can act on your machine as you: files, programs, network.
  - It can read your secrets: environment variables, settings, and API keys kept in either.
  - It sees every prompt and tool call.
  - It can rewrite prompts and tool calls, submit prompts as you, and message your other sessions.
  - It can approve a tool call before you're asked.
  - It can call a model on your plan or key.
  - "Mods aren't sandboxed". Processes a mod starts run outside the Bash sandbox.
  - A mod that approves calls can approve one an `ask` rule or one of your `PreToolUse` hooks would have stopped.
  - It "can restyle much of Claude Code's interface, but not the permission prompt".
  - Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- The announcement says: "Mods run with the same access to your machine as Claude Code itself. They aren't sandboxed, and you should only install mods from sources you trust". — [Announcement](https://claude.com/resources/articles/claude-code-mods)
- The guide's phrase "The module runs in a sandbox of its own, with no DOM and no Node" describes JavaScript isolation only. All OS access goes through `$` calls, which run with your permissions. — [claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/), [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)
- **Review before install**: `claude plugin validate ./some-mod` lists `hooks:` and `calls:`. Calls to watch for:
  - `$.fs.read`/`write`: any file the user can reach
  - `$.process.run`/`spawn`: starts programs as the user
  - `$.http.fetch`: network requests
  - `$.env.get` / `$.settings.read`: can read secrets
  - `$.env.set`: changes the environment of later commands and MCP servers
  - `$.mcp.call`, `$.model.complete` (spends usage), `$.prompt.submit`, `$.session.send`
  - Hooks to watch for: `tool.call`, `prompt.submit`, `session.append`, `tool.check`, and `ui.render{component=AskUserQuestion}`.
  - Claude Code refuses to load a mod that uses `$` in a way the analyzer can't read.
  - Source: [Admin](https://code.claude.com/docs/en/plugins/mods/admin)
- **The built-in guard `sec-default@builtin`** (`cc-plugin-sec-default`):
  - It loads first when the machine has managed settings or the user signs in with a Team or Enterprise plan. API-key and Bedrock/Vertex/Foundry users get it only with managed settings. The source README adds machines with a `managed-mcp.json`.
  - It protects managed hooks, the system prompt, managed CLAUDE.md and instructions, settings reads, and managed MCP tools.
  - Deny rules beat users' mods where it loads.
  - It does not cover a mod's own `$.fs`/`$.process` calls: "with `Read(.env)` denied, a mod can still read that file with `$.fs.read`".
  - The guard fails closed.
  - Sources: [Admin](https://code.claude.com/docs/en/plugins/mods/admin), [built-in mods README](https://github.com/anthropics/claude-code/blob/main/mods/README.md)
- **The guard on Team/Enterprise or managed machines**: a user mod's hooks on `classic.*`, `prompt.section`, `prompt.context`, `prompt.attachment`, `skill.prompt`, `attribution.text`, `prompt.compose` and `session.compact` are skipped past the user tier. The guard also pins about 19 sensitive environment variables, such as `LD_PRELOAD`, `NODE_OPTIONS` and `CLAUDE_CONFIG_DIR`, against `$.env.set`. — [sec-default README](https://github.com/anthropics/claude-code/blob/main/mods/sec-default/README.md). v2.1.299 added a note in `/plugin` and `validate` "naming a mod's hooks that are skipped where an organization manages Claude Code". — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Managed-settings controls**:
  - `allowManagedModsOnly`: set under `pluginConfigs` → `cc-plugin-sec-default@builtin` → `options`. Only org mods and built-ins run, and users' settings hooks, status lines and `/goal` keep working.
  - `allowModsToOverrideDenyRules`.
  - `allowManagedHooksOnly`.
  - `disableAllHooks`: in managed settings it stops everything, including custom status lines.
  - `disableSideloadFlags`: rejects `--plugin-dir`, `--plugin-url`, Claude-written mods, `--agents` and `--mcp-config`.
  - `prependPlugins` / `appendPlugins`: set the chain order. If set, they must name `sec-default@builtin` to keep the guard.
  - `strictKnownMarketplaces` and the other plugin controls also apply.
  - Source: [Admin](https://code.claude.com/docs/en/plugins/mods/admin)
- An "organization's mod" must meet three conditions: managed `enabledPlugins` enables it, it comes from a local-directory marketplace named by absolute path in managed settings, and it is listed by relative path. Plugins copied from GitHub, git, URL or npm count as a user's. — [Admin](https://code.claude.com/docs/en/plugins/mods/admin)
- **Execution order**:
  1. the guard, prepend mods, and other org mods
  2. user-installed mods
  3. append mods
  4. other built-ins

  The first mod is outermost: it sees the event first and the result last. — [Events](https://code.claude.com/docs/en/plugins/mods/events)
- **Failure behavior**: a hook that throws, times out or returns a wrong shape before calling `next` is skipped (fail-open). After `next`, the result stands. `.catch` handlers make a guard fail closed. — [Events](https://code.claude.com/docs/en/plugins/mods/events)
- **Network policy**: if the organization disallows WebFetch, `$.http.fetch` is refused. Since v2.1.288, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` stops only built-in mods' fetches. — [Admin](https://code.claude.com/docs/en/plugins/mods/admin)
- **Remote kill switch**: Anthropic can turn installed mods off remotely; troubleshooting shows "the rollout switch served off". — [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot). v2.1.299 fixed installed mods that "kept running in an open session after being turned off remotely; they now unload between turns". — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Limits (reference table)**:
  - Hook execution: 10 s, or 50 ms for `prompt.edit`. Time spent inside `next` or `$` calls doesn't count, except `$.clock.sleep`.
  - `.catch`: 1 s. All `session.end` hooks together: 1.5 s by default.
  - `$.process.run`: 30 s default, 10 min maximum.
  - `$.model.complete` `maxTokens`: 1024 default, up to 64,000.
  - `$.fs` read/write: 4 MiB per file. `$.http.fetch`: 4 MiB request and response bodies, 30 s, 5 redirects.
  - Drop and deny reasons: 4,096 characters.
  - Tree text: the first 100,000 characters are drawn.
  - `Link` href: 2,048 characters.
  - `$.store`: 4 MiB in total. `$.session.messages()`: the newest 4,096 entries.
  - Redraws: 10 per second, or 30 in the terminal for the visible pane, band and hint line.
  - Toast: 4 s by default.
  - Unprompted pane placement: 144 columns, or 110 after the user has opened the pane.
  - Nested scopes: 2,000.
  - Command, tool, subagent type and pane names: `[A-Za-z0-9_-]`, up to 64 characters.
  - Tests: 5 s each.
  - Source: [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **Troubleshooting highlights**:
  - Where messages appear: a dim transcript line in `--plugin-dir` and hot-reload sessions, the debug log only for installed mods (`claude --debug` or `--debug-file`), and stderr for `claude -p`.
  - Check whether mods can load: `claude plugin test` from an empty directory. The outputs are `no hooks module to load`, `hooks modules are turned off here`, and `…the rollout switch served off`.
  - Refusal messages:
    - `disableAllHooks in managed settings`
    - `only managed plugins and built-in plugins run`
    - `installed plugins that are not managed load no hooks module in this mode (--bare)`
    - `another plugin of that name loads first`
  - Validate passes but lists no hooks line: `hooks.json` is missing `modules`.
  - Untrusted directory: no mod loads until you accept the trust prompt.
  - `hook skipped:` lines. `it crashed the hooks worker`: after three crashes, every non-built-in mod is off for the session until `/reload-plugins`.
  - In auto mode, a hook that changed a tool input after classifier review gets the call denied.
  - Panes not placed in narrow terminals.
  - Toasts: held by `holdToasts`, shown as a single line in the classic renderer, at most three at a time in fullscreen.
  - Hotkeys need focus.
  - Edits to an installed copy don't apply.
  - `$.state` resets after `/clear`.
  - A loaded mod's debug-log line looks like `hooks module first-mod@inline loaded (worker, environment 2, tier user); events: …`.
  - Source: [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot)
- The Plugin security page lists mods as running "JavaScript inside Claude Code with your permissions". Claude Code runs hooks, MCP and LSP servers, and processes a mod starts outside the sandbox. — [Plugin security and trust](https://code.claude.com/docs/en/plugins/security)

### Inferences
- For a personal rice, the realistic risk is installing an untrusted third-party mod. Run `claude plugin validate` and read the `calls:` line before installing. A purely visual mod should show only `$.ui.*`, `$.session.usage`, `$.state`/`$.store` and maybe `$.clock`. `$.http.fetch`, `$.process.*`, `$.env.get` or `$.fs.read` in a "theme" mod is a red flag.
- On Team/Enterprise accounts, some prompt-shaping hooks in personal mods silently don't run. Pure UI mods are unaffected.

### Gaps
- No official performance guidance exists beyond the limits table, for example on render-cost budgets per frame.
- An issue commenter reported a 1 MB module file-size limit. It is not in the docs and is unverified. — [Issue #91870 (summarized fetch)](https://github.com/anthropics/claude-code/issues/91870)

---

## 5. When mods shipped, related 2026 look-and-feel features, and official announcements

### Takeaway
Mods were proposed publicly as "function hooks" on Sep 3, 2026 (issue #91870), with opt-in early access through `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`. They launched on by default on **October 1, 2026 in Claude Code v2.1.287**, per the changelog entry "Added Claude Mods" and the official announcement. The Desktop app counts from v2.1.286 (published Sep 30). Daily point releases expanded the API through v2.1.299 (Oct 14). The weekly "What's new" digest had not yet covered mods: its latest entry is Week 37, Sep 7–11. 2026 look-and-feel milestones leading up to mods include flicker-free fullscreen rendering (W14), custom themes shippable in plugins (W17), screen reader mode (W29), the Concise output style (W34), and the live `/diff` panel (W36), which became the first built-in mod.

### Cited Findings
- **Changelog, v2.1.287**: "Added Claude Mods: plugins may now modify deeper behavior". Same release: "Added You should know, a built-in mod…". No earlier changelog entry mentions mods. The v2.1.286 section has none. — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **npm publish times** (registry `time` field):
  - 2.1.286: 2026-09-30T17:14:38Z
  - 2.1.287: 2026-10-01T16:59:25Z
  - 2.1.288: Oct 2
  - 2.1.289: Oct 3
  - 2.1.290: Oct 5
  - 2.1.292: Oct 6
  - 2.1.293: Oct 7
  - 2.1.295: Oct 8
  - 2.1.296: Oct 9
  - 2.1.299: 2026-10-14T00:23:19Z
  - Source: [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code), via `npm view @anthropic-ai/claude-code time`
- **Version conflict**: the overview says terminal v2.1.287+ and Desktop v2.1.286+. The admin page says "Mods are on by default in Claude Code v2.1.286 and later". — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview), [Admin](https://code.claude.com/docs/en/plugins/mods/admin). The changelog puts the launch in v2.1.287.
- **Official announcement**: "Customize Claude Code with mods", Anthropic, October 1, 2026, Announcements category, Claude Code, 5-minute read, no author listed. — [claude.com announcement](https://claude.com/resources/articles/claude-code-mods). It links:
  - the guide: https://claude.dev/blog/getting-started-with-claude-code-mods/
  - the docs
  - the design discussion: https://github.com/anthropics/claude-code/issues/91870
  - the Claude directory
- The announcement also covers:
  - load order ("The first mod to load sees the event first and the result last")
  - Claude creating, installing and hot-reloading mods
  - team examples: a CI/CD status pane, production safeguards, audit logging
  - Team/Enterprise owners setting marketplace controls in the admin console, and API-plan admins pushing managed settings
- **Developer guide**: "Getting started with Claude Code mods" by **Addy Osmani**, published Oct 01, 2026, 11-minute read, on claude.dev. It builds Token Weather (about 80 lines) and tours Blast Radius and Replay Theater, with terminal and Desktop videos. — [claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)
- **Official showcase**: https://claude.dev/mods/. "Small TypeScript functions that ship inside Claude Code plugins. They hook its events, change what it does, and draw their own UI in the terminal." It shows animated terminal replays of each mod. — [claude.dev/mods](https://claude.dev/mods/)
- **Design discussion** (from a summarized fetch of the GitHub page; author identity inferred):
  - "Mods - make Claude 10x more extensible", opened Sep 3, 2026 by @poteat.
  - It describes Express/Koa-style middleware with a capability object `$`.
  - The Sep 9 "Community Update" renamed the feature "Claude Mods" and said early access worked with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude`.
  - The Oct 1 update said "We're live!".
  - About 260 timeline entries through Oct 13.
  - Source: [Issue #91870](https://github.com/anthropics/claude-code/issues/91870)
  - The docs separately confirm the early-access variable existed and is now ignored. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- **Post-launch API growth** (changelog):
  - v2.1.288: `$.ui.selection()`
  - v2.1.289: `Client` failures isolated and `ui.fault` added; a fix for "unrecoverable interface error" crashes from mod rows
  - v2.1.290: `serverToolUses`, `tool.check` `ceiling`, `ThemeKey`/`Color` types, and validate listing gating hooks
  - v2.1.292: `prompt.autocomplete` and prompt caching for `$.model.complete`
  - v2.1.293: `isDeferred` for `$.tool.register`
  - v2.1.295: `$.ui.notify`, Button children, and plugin-authoring skill improvements
  - v2.1.296: a `$.http.fetch` HEAD fix
  - v2.1.299: `Text` `size`/`weight`/`mono`/`tabular`; `Box` spacing steps; `$.prompt.media`; `$.session.identity()`; `skill.prompt` fields; `turn.start` hears subagent turns; remote-off unload
  - Source: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Older GitHub types**: the `claude-code.d.ts` on GitHub begins "Written by Claude Code 2.1.277" with an "EARLY ACCESS" warning. The `mods/README.md` still says "Early access: hooks modules load only where function hooks are enabled". Both predate launch, and the docs say to trust the locally generated types instead. — [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts), [built-in mods README](https://github.com/anthropics/claude-code/blob/main/mods/README.md), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- **What's new digests**: the newest weekly digest is Week 37 (Sep 7–11, 2026, v2.1.263–v2.1.269). The Week 38–42 pages return 404 as of Oct 14, 2026, so no digest covers mods yet. — [What's new index](https://code.claude.com/docs/en/whats-new/index.md), [llms.txt](https://code.claude.com/docs/llms.txt)
- **2026 look-and-feel features near mods** (What's new digests):
  - W14 (Mar 30–Apr 3): "flicker-free rendering" (fullscreen). — [Week 14](https://code.claude.com/docs/en/whats-new/2026-w14)
  - W17 (Apr 20–24): "custom color themes you can build and ship in plugins". — [Week 17](https://code.claude.com/docs/en/whats-new/2026-w17)
  - W29 (Jul 13–17): "screen reader mode". — [Week 29](https://code.claude.com/docs/en/whats-new/2026-w29)
  - W34 (Aug 17–21): "the built-in Concise output style". — [Week 34](https://code.claude.com/docs/en/whats-new/2026-w34)
  - W36 (Aug 31–Sep 4): "in fullscreen rendering, `/diff` opens a live panel beside the conversation that refreshes as Claude edits". — [Week 36](https://code.claude.com/docs/en/whats-new/2026-w36)
  - W37 (Sep 7–11): "pop any Claude Code Desktop pane out into its own window". — [Week 37](https://code.claude.com/docs/en/whats-new/2026-w37)
  - W27: `/radio` "tunes into Claude FM". — [Week 27](https://code.claude.com/docs/en/whats-new/2026-w27)
  - Week descriptions are also listed in [llms.txt](https://code.claude.com/docs/llms.txt).
- The `/diff` live panel shipped as a built-in feature in W36 and became the built-in mod `cc-plugin-diff`. Its README describes it re-implementing "the built-in panel" behaviors. — [diff README](https://github.com/anthropics/claude-code/blob/main/mods/diff/README.md), [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- The v2.1.299 CLI exposes `--ax-screen-reader`: "Render screen-reader friendly output (flat text, no decorative borders or animations)". — local `claude --help`, v2.1.299

### Inferences
- With releases almost daily and the reference already behind (v2.1.290 against v2.1.299 installed), the user should regenerate and check the local `.claude-plugin/types/` files rather than trust blog snippets. Expect breaking changes; the GitHub types still say "may change between releases without notice".
- A future "What's new" digest covering weeks 39–40 will probably feature mods. It was not yet published when checked.

### Gaps
- I found no X or Twitter posts by Claude Code team members through search. The design issue's author @poteat appears to be on the team, but that is inferred from the issue text.
- Secondary coverage, such as The New Stack, ClaudeKit and WeAreDevelopers, was not used for facts.

---

## 6. Official example mods, templates and first-party marketplaces

### Takeaway
The first-party mod sources are:
- **6 built-in mods**: four with public source in `anthropics/claude-code/mods`, under a proprietary license.
- **3 sample mods** in `anthropics/claude-code-playground` (Apache-2.0, provided as-is), installable as the local marketplace `claude-code-playground-mods`.
- **1 community mod** featured on claude.dev/mods: `next-steps`, in Anthropic's community marketplace.
- **Tutorial mods** in the docs: `first-mod`, `hello-tabs`, a notes pane, `gallery`, heat-map `Raster`, `/standup`, `/triage`, a ticket tool, `/ping`, a PR-checks status line, a risky-command ask, and the `acme-guard` policy mod.

Anthropic's general marketplaces are `claude-plugins-official`, `claude-community` and `claude-code-plugins` (the demo marketplace). A keyword scan found no mods explicitly listed in the official marketplace.

### Cited Findings
**Built into Claude Code**
- Source repo: [anthropics/claude-code/mods](https://github.com/anthropics/claude-code/tree/main/mods). Its contents are `agents-md/`, `diff/`, `sec-default/`, `telemetry/`, `types/`, `README.md` and `tsconfig.json`. The README says "These four ship inside Claude Code; this folder is their source, published as it is built into the binary". Each is a complete plugin with TypeScript `hooks/register.ts` and tests, runnable as `claude --plugin-dir mods/diff` and testable with `claude plugin test mods/diff`. — [built-in mods README](https://github.com/anthropics/claude-code/blob/main/mods/README.md)
- The repo license reads: "© Anthropic PBC. All rights reserved. Use is subject to Anthropic's Commercial Terms of Service." The source is readable but not open source. — [LICENSE.md](https://github.com/anthropics/claude-code/blob/main/LICENSE.md)
- **diff** (`cc-plugin-diff`):
  - `/diff` shows uncommitted changes in a pane beside the transcript.
  - It auto-opens on the first edit only when docked, 144 columns wide (110 if kept open before), and checkpointing is on.
  - It has wheel scrolling and keyboard actions; Ctrl+X then B cycles the comparison base.
  - Noise files such as lockfiles are folded.
  - A per-file "ask" button attaches that file's hunks to the next prompt.
  - Without the fullscreen layout (`CLAUDE_CODE_NO_FLICKER=0`) it opens inline as a dialog.
  - Source: [diff README](https://github.com/anthropics/claude-code/blob/main/mods/diff/README.md)
- **agents-md**: loads `AGENTS.md` as project instructions. Its option `instructionFiles` takes `claude-md`, `claude-md-or-agents-md` (the default), `claude-md-and-agents-md` or `managed-only`. — [agents-md README](https://github.com/anthropics/claude-code/blob/main/mods/agents-md/README.md)
- **sec-default**: the organization guard; see section 4. — [sec-default README](https://github.com/anthropics/claude-code/blob/main/mods/sec-default/README.md)
- **telemetry**: adds `$.telemetry` for built-ins only and refuses installed plugins. "It is not meant to be installed or loaded with `--plugin-dir`". It sends nothing under `DISABLE_TELEMETRY`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` or `DO_NOT_TRACK`. — [telemetry README](https://github.com/anthropics/claude-code/blob/main/mods/telemetry/README.md)
- **Built-ins without public source**: `cc-plugin-plugin-authoring` (a skill) and `cc-plugin-you-should-know`. — [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview)
- The anthropics/claude-code star count, last-commit date and primary language could not be read, because the GitHub API was blocked by the session proxy and the tree page didn't show them.

**Sample mods: [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground)**
- **Repo facts** (GitHub page as fetched Oct 14, 2026): 230 stars, 26 forks, 8 watchers, Apache-2.0, 3 commits on `main`. Language percentages and the latest commit date were not shown. — [repo page](https://github.com/anthropics/claude-code-playground). Apache-2.0 is confirmed in the README and LICENSE.
- Maintained by Anthropic DevRel: "not an official Anthropic product… provided as-is, with no support", with no outside contributions. — [playground README](https://github.com/anthropics/claude-code-playground)
- The mods folder holds the marketplace `claude-code-playground-mods` (owner "Claude Code DevRel"). All three samples "need Claude Code 2.1.287 or later". Install commands:
  - `git clone https://github.com/anthropics/claude-code-playground.git && cd claude-code-playground/claude-code/mods && claude --plugin-dir ./token-weather`
  - or `claude plugin marketplace add ./` then `claude plugin install token-weather@claude-code-playground-mods --scope user`
  - Source: [mods README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods)
- **token-weather**:
  - A live context-window "forecast" in the band above the prompt, for example ` ☂  Showers  67% of context  134.4k / 200k   last turns ▁▂█  ▲ +98.3k last turn`.
  - Forecast levels: ☀ Clear under 25%, ☁ Cloudy, ☂ Showers, ☇ Storm, ↯ Compact soon at 90%+.
  - Hooks: `session.start`, `turn.complete`, `ui.render{AbovePrompt}`.
  - It updates once per turn, and the band is shared with other mods.
  - Built and tested on 2.1.280; validate passes on 2.1.285.
  - The README says "`AbovePrompt` is drawn on the terminal surface only", which conflicts with the reference listing `AbovePrompt` for Terminal and Desktop.
  - Source: [token-weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather)
- **blast-radius**:
  - It holds risky Bash commands (`rm -r/-rf`, `git reset --hard`, `git checkout -- .`/`git restore .`, `git clean`, force pushes, DB migrations) and shows what they would change, with Proceed (`1`) and Cancel (`2`).
  - It uses a pane, or the band in narrow terminals, and refuses after 10 minutes with no answer.
  - It holds the call by looping on `$.process.run(["sleep","0.25"])`, because time inside `$` calls doesn't count against the 10 s budget.
  - "a safety net, not a permission system".
  - Source: [blast-radius](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius)
- **replay-theater**:
  - It records Edit/Write/MultiEdit calls during a turn.
  - It shows a hint, `▶ Replay: 5 edits (press r)  [ Replay ]`, then a pane stepping through diffs with numbered step cells and Prev, Next and Close (keys `n`, `p`, `c`). `/replay` opens it too.
  - It is observe-only.
  - Source: [replay-theater](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater)
- The playground README says all three "started as one of ten ideas Claude wrote for mods". The build prompt was "implement 1,2,7. give me zips for them. test them in claude code and get me screenshots…". The original effort labels were Token Weather "A weekend build", and Blast Radius and Replay Theater "A bigger project". — [token-weather README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather), [blast-radius README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius), [replay-theater README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater)

**Featured community mod in Anthropic's community marketplace**
- **next-steps**, by Thariq Shihipar per claude.dev/mods.
  - After each turn it suggests up to three next prompts above the input box. Press 1, 2 or 3 to draft one, or 0 to dismiss. The top suggestion also appears as ghost text that Tab takes.
  - It is built on `$.model.fork`, which shares the prompt cache, plus `$.command.list`, `ui.render{AbovePrompt}`, `$.prompt.fill` and `$.prompt.suggest`.
  - Options: `minAnswerChars` (default 80) and `suggestSkills` (default true).
  - Terminal only.
  - Install: `claude plugin install next-steps@claude-community`.
  - Sources: [claude.dev/mods](https://claude.dev/mods/), [next-steps](https://github.com/anthropics/claude-plugins-community/tree/main/next-steps)

**Marketplaces and directories**
- **Official**: `claude-plugins-official` (anthropics/claude-plugins-official), auto-added on first interactive start. Most of it comes from partners.
- **Community**: `claude-community` (anthropics/claude-plugins-community). Add it with `/plugin marketplace add anthropics/claude-plugins-community`.
- **Demo**: `claude-code-plugins` (anthropics/claude-code). Add it with `/plugin marketplace add anthropics/claude-code`.
- Topic marketplaces such as `anthropics/skills` also exist.
- Source: [Anthropic's marketplaces](https://code.claude.com/docs/en/plugins/anthropic-marketplaces)
- Raw `marketplace.json` files fetched Oct 14, 2026: the official marketplace lists 315 plugins and the community marketplace 2,283. A keyword scan of descriptions ("mod", "pane", "above the prompt", "hooks module", "spinner") flagged no explicitly labeled mods in the official catalog. — [claude-plugins-official](https://github.com/anthropics/claude-plugins-official), [claude-plugins-community](https://github.com/anthropics/claude-plugins-community)
- The Claude directory (claude.ai/directory) "accepts plugins that include mods"; submit at claude.ai/directory/manage. — [claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/), [Announcement](https://claude.com/resources/articles/claude-code-mods)

**Doc tutorial mods worth copying**
- `first-mod`: a tool-call counter on the spinner plus `/tally`.
- `hello-tabs`: a pane with tabs and a persistent counter.
- A notes pane: `Input` plus delete buttons.
- `/gallery`: a sample viewer for every element.
- A heat-map `Raster`.
- A PR-checks status line: `$.clock.every(60_000)` plus `gh pr checks`.
- `/standup`, `/triage` (calls haiku), the `mcp__my-mod__ticket` tool, and cross-session `/ping`.
- Sources: [Create a mod](https://code.claude.com/docs/en/plugins/mods/create), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface), [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery), [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)

### Inferences
- The best starter kit for "ricing" is `token-weather`, which is about 80 lines and terminal-friendly, plus the docs' `gallery` mod as a sandbox for trying elements.
- `next-steps` shows the AI-assisted UI pattern.
- No official theme or "rice" mod pack exists yet. Look-and-feel mods are left to users and the community.

### Gaps
- Stars and last-commit data for anthropics/claude-code, claude-plugins-official and claude-plugins-community could not be collected, because the API was blocked.
- I didn't run the playground mods, as instructed.
- The keyword scan can't reveal mods whose descriptions don't mention UI. Finding them would mean checking each plugin for `hooks.json` `modules`.

---

## Wow / flex factor

### Takeaway
Mods can be genuinely theatrical, and some APIs exist mainly to impress:
- `Raster` draws pixel-art grids of up to 512×256 colored cells.
- `$.ui.blit` repaints a `Raster` or swaps an `Image` at about 60 visible frames per second without re-rendering.
- `Image` shows real PNG or RGBA images in kitty and Ghostty.
- `Client` is an element module with its own frame clock, mouse and key input.
- `Svg` draws charts in Desktop.
- `$.audio.play` and `$.audio.speak` add sound and speech. `$.ui.notify` raises native notifications.
- Mods can restyle Claude Code's own spinner and rows, and a game can run in a pane.

The most screenshot-friendly official demos are Token Weather (a live context forecast band), Blast Radius (a destructive command frozen mid-flight with a "what would be deleted" report) and Replay Theater (a scrubbable diff timeline). All have official videos and screenshots. Hard ceilings:
- `ui.render` redraws: 10 per second, or 30 in the terminal for the visible pane, band and hint line.
- Blit: up to 120 per second accepted, about 60 shown.
- Images: kitty 0.28+ or Ghostty only, never inside tmux or screen.
- Panes the mod opens on its own need 144 columns.

### Cited Findings
**Top possibilities, ranked by impact relative to effort**

The "Effort" column gives my estimates. Where the official sources give a size or effort label, it is quoted.

| # | Effect | APIs | Why it impresses | Effort | Official demo media |
|---|---|---|---|---|---|
| 1 | **Live context and usage "weather" band** above the prompt | `$.session.usage()` (context, rate limits, cost; plain call free), `turn.complete`, `ui.render{AbovePrompt}`, `$.state` | An always-visible, colored, iconic readout of how full the context is, with a sparkline (☀ → ☂ → ☇). It answers "why did Claude forget that?" at a glance. The idea text says "Developers would share it because it looks good in a screenshot" | Low. "about 80 lines" ([guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)); "A weekend build" ([README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather)) | Screenshots: [clear](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/token-weather/screenshots/token-weather-clear.png), [showers](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/token-weather/screenshots/token-weather-showers.png), [storm](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/token-weather/screenshots/token-weather-storm.png). Videos: [three-turn session](https://claude.dev/media/eccd73c962a5b22578cf5bfd4fa214f6ecd9e602a1cb8df519db737b99932f05.mp4), [band image](https://claude.dev/media/eaee11951bbed827ef89ee535abfbbed7277b67a65044ea277ade9e9acd1d3b5.png) |
| 2 | **Hold a destructive command mid-flight** (Blast Radius) | `tool.call` hold plus `$.ui.open` pane, `Button` hotkeys, `$.process.run` dry runs, `{deny}` | Live-demo drama: Claude tries `rm -rf build`, everything freezes, and a pane lists exactly the 9 files (1.1 MB) that would vanish, with 1: Proceed / 2: Cancel | Medium–high. "A bigger project" ([README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius)) | [pane screenshot](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/blast-radius/screenshots/blast-radius-pane.png), [band screenshot](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/blast-radius/screenshots/blast-radius-band.png), [video](https://claude.dev/media/75748f2aa5232025acdbe254ddea99a0b573152035fd289437d2953b8f6061e7.mp4), [band image](https://claude.dev/media/ac53d89fc2dbe36603c30639b12fdc7edcfba5072b9b417e656a65a2d196cc37.png) |
| 3 | **Scrubbable replay of Claude's edits** (Replay Theater) or a live diff panel (built-in `/diff`) | `tool.call` observe, `turn.*`, `Code{format:'diff'}` (red/green with word-level highlights), `Button` | Turns an agent run into a reviewable timeline: "step 2 of 5", Prev/Next | Medium. "A bigger project" ([README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater)) | [pane](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/replay-theater/screenshots/replay-theater-pane.png), [hint](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/replay-theater/screenshots/replay-theater-hint.png), [80-column](https://raw.githubusercontent.com/anthropics/claude-code-playground/main/claude-code/mods/replay-theater/screenshots/replay-theater-80-columns.png), [video](https://claude.dev/media/e616623b87187bf2439108f0f566448fa74f8cfee6fd5b4c5d8703da2ce4e331.mp4) |
| 4 | **Animated pixel graphics and games** in a pane: heat maps, sparklines, boards | `Raster` (up to 512×256 cells, 24-bit colors packed as base64), `$.ui.blit` (repaint without re-render), `$.clock.every(33, …)` | The terminal becomes a canvas. The docs anticipate games ("a game steers with `w`, `a`, `s`, and `d`"). The types' own example blits every 33 ms | Medium (packing cells; terminal only) | Docs heat map: [SVG](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-heat-map.svg), gallery [Raster PNG](https://mintcdn.com/claude-code/EXkwf0kKMewZsyod/images/mods-el-raster-dark.png) |
| 5 | **Real images and streamed video frames** in the terminal | `Image` (PNG/RGBA up to 2 MiB, up to 255×255 cells), `$.ui.blit` swapping a keyed Image, including shared-memory `shm` RGB frames | Photo-quality pixels inside Claude Code. The types' example streams `{shm, format:'rgb', width:1280, height:720}` into a site named "browser", at "some sixty a second" | High (kitty 0.28+ or Ghostty only; never in tmux/screen) | None official |
| 6 | **`Client` regions**: custom animated or mouse-driven widgets | `Client{module, key, props, width, height}`; the module gets `surface.every` (frame clock), `onPointer` (sub-cell `fine` coordinates on kitty/Ghostty/iTerm2/WezTerm/foot), `onKey`, `setState`, `post` → `ui.message` | Smooth animation and mouse interaction without re-running hooks. The types describe forwarding pointer input for "a module showing another program's pixels" | High | None official |
| 7 | **Restyle Claude Code itself**: spinner text or replacement, tool rows, assistant and user messages, question dialog, footer mode labels, prompt hint | `ui.render{component:'Spinner'\|'ToolUse'\|'AssistantMessage'\|'AskUserQuestion'\|'SessionMode'\|'PromptHint'…}` | Every screenshot shows your personality, as in `Thinking · tool calls: 3…`, without opening anything | Low (a few lines) | Docs videos: [overview spinner counter](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-overview-dark.mp4), [first-mod](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-first-mod-dark.mp4) |
| 8 | **Interactive dashboards in a pane**: tabs, buttons, inputs, selects, Markdown, syntax-colored code, 10 border styles | `Pane` plus `Box`/`Text`/`Button`/`Input`/`Select`/`Markdown`/`Code`; `$.clock.every` for live data (CI status, rate limits, cost) | "CI/CD status: a mod can show your pipeline's status in a pane beside the conversation" ([announcement](https://claude.com/resources/articles/claude-code-mods)) | Low–medium | [hello-tabs video](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-hello-tabs-dark.mp4); gallery element PNGs on [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery) |
| 9 | **Sound and speech**: chimes, looping beds, spoken summaries | `$.audio.play({asset\|url\|base64,mime}, {shouldLoop, gain, signal})` (clips overlap, "a bed under speech"); `$.audio.speak(text, {voice})` (system synthesizer, `say` on macOS, up to 4,096 characters) | Theatrical in a live demo: a turn finishes and Claude says so out loud. Works through screen shares with audio | Low (platform-dependent) | None official |
| 10 | **AI-generated UI**: next-prompt suggestions as hotkey buttons and ghost text | `$.model.fork` (shares the prompt cache), `$.prompt.fill`, `$.prompt.suggest`, `AbovePrompt` | Feels like autocomplete for your whole workflow | Medium | Animated demo on [claude.dev/mods](https://claude.dev/mods/); install `claude plugin install next-steps@claude-community` |
| 11 | **Desktop-only vector charts** | `Svg` (Desktop only, up to 131,072 characters) | Crisp charts in the Desktop Code tab | Low–medium | None official |
| 12 | **Notifications and toasts** | `$.ui.notify` (native, v2.1.295+), `$.ui.toast` (fullscreen top-right box) | Polished feedback after long turns | Low | None official |

Sources for the table:
- APIs and limits: [Reference](https://code.claude.com/docs/en/plugins/mods/reference), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface), [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery), [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api)
- Blit, Client, audio and Image streaming details: [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts). This GitHub copy dates from v2.1.277 and may differ from current builds.
- `$.ui.notify`: [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Every demo media URL in the table was checked and returned HTTP 200 on Oct 14, 2026.

**Animation and rendering limits for flashy mods**
- `ui.render` redraws are throttled to 10 per second, or 30 in the terminal for the visible pane, expanded band and prompt hint line. Faster calls coalesce: "An animation can't run faster than the limit." — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface), [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- `$.ui.blit`: "blits between frames fold into one: up to 120 a second taken, some sixty shown". An Image swap "sends one small command". — [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- `Client`:
  - `setState` coalesces to one redraw per frame. Three `setState` calls in a row with no input between them count as a render loop, and the instance unmounts.
  - `post` sends at most one message per frame.
  - A Client tree is limited to 20,000 nodes, 32 levels deep and 100,000 characters.
  - No nested `Client`, `Raster` or `Image` inside a Client.
  - A failing Client shows a dimmed error line in its place and fires `ui.fault`.
  - Sources: [claude-code.d.ts](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- `Raster`: terminal only; each character must be one cell wide. Colors are 24-bit RGB but "rounds each color to a smaller palette, so `0x2e7d32` draws as `#337733`". — [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface)
- `Image`: kitty 0.28+ or Ghostty, detected at startup. Never in tmux or screen, or in background sessions; otherwise the dimmed `alt` text shows. — [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery)
- `Svg` is not drawn in the terminal: a pane returning only an `Svg` opens empty. — [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery)
- Docked side panes need fullscreen rendering and width. Unprompted panes appear from 144 columns, or 110 after the first manual open. The band is shared by all mods, and the samples warn that "only one of them shows". — [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface), [replay-theater README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater)
- Toasts: at most three are drawn at once in fullscreen. In the classic renderer a toast is a single line under the prompt. — [Troubleshoot](https://code.claude.com/docs/en/plugins/mods/troubleshoot)
- A hook gets 10 s of CPU per event. Long waits must happen inside `$` calls. — [Reference](https://code.claude.com/docs/en/plugins/mods/reference)
- Emoji may be missing from terminal fonts. Token Weather switched to "single-width text symbols", which "line up in any terminal font". — [token-weather README](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather)

**Official showcase and launch demos**
- [claude.dev/mods](https://claude.dev/mods/) shows replayable terminal sessions of Token weather, Blast radius, Replay theater and Next steps. It also lists built-in `/diff`, AGENTS.md and sec-default with source links.
- The launch guide's videos include "Token Weather, Blast Radius and Replay Theater, one after another, in a terminal session", with Terminal and Desktop variants: [terminal](https://claude.dev/media/a4e8983c1c68c9549dbf74a7478c8e2b7932e65d881a978d51a5191e2c7ce5ac.mp4), [desktop](https://claude.dev/media/22d3a880ab0b467434221682c05a569487d8d5c5adb91de208ef24242d36662d.mp4). — [claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)
- The guide asks developers to share what they build: "Post it on X or LinkedIn with a GIF or a screenshot of it running". Its idea list includes a cost or rate-limit meter via `$.ui.status`, a live map of files Claude read, and a focus timer with `$.ui.toast`. — [claude.dev guide](https://claude.dev/blog/getting-started-with-claude-code-mods/)
- Docs media:
  - the screen map ([dark SVG](https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-screen-map-dark.svg))
  - the overview, first-mod and hello-tabs MP4s (light and dark variants)
  - per-element gallery PNGs: Text, Markdown, Link, Code, diff, Box, Button (incl. focused), Input (incl. focused/typed), Select (incl. open/picked), Raster
  - Sources: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview), [Create a mod](https://code.claude.com/docs/en/plugins/mods/create), [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface), [Gallery](https://code.claude.com/docs/en/plugins/mods/gallery)

### Inferences
- The best ratio of visual impact to effort for a screenshot is items 1 and 7: a colored band above the prompt plus a restyled spinner. Use single-width symbols, theme colors and a `round` or `bold` border in a wide fullscreen terminal.
- For a live demo or screen share, items 2 and 9 land hardest: a command frozen with a "what would be deleted" pane, then Claude speaking the result. Neither needs special terminal support.
- The top-tier "flex" (items 4–6: Raster or Image animation and Client widgets) needs kitty or Ghostty outside tmux for images. Budget for terminal-specific fallbacks: check `e.surface` and `e.viewport`, and draw text elsewhere.
- Since only one mod effectively owns the band, a "rice" setup should pick one primary band mod and move other readouts to `$.ui.status`, toasts or a pane.

### Gaps
- No official demo of `Image` streaming, `Client` animation, games or `$.audio` was found. Those capabilities are documented only in the types (v2.1.277 copy on GitHub) and the reference.
- There are no official benchmarks for CPU or flicker cost of high-rate blits. "some sixty shown" is the only figure.
- It is unverified whether Desktop pop-out panes (W37) include mod panes.
- Community "wow" mods (for example a multiplayer Doom mod reported by secondary press) are out of scope for this first-party track and were not verified.
