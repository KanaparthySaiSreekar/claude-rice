// make-demo-session.mjs: write a synthetic Claude Code transcript so the real TUI can be screenshotted
// (skin rows, theme, tables, diffs, status line) with `claude --resume <id>`, with no API call and
// no usage spent. It creates a throwaway project folder and one session file, and prints the session id.
//
//   node tools/make-demo-session.mjs [projectDir]      (default C:\Users\Kasasree\Projects\aurora-demo)
//   node tools/make-demo-session.mjs --clean [projectDir]   remove the demo project and its session files
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import crypto from "node:crypto"

const args = process.argv.slice(2)
const clean = args.includes("--clean")
const projectDir = path.resolve(args.find((a) => !a.startsWith("--")) ?? path.join(os.homedir(), "Projects", "aurora-demo"))
const encoded = projectDir.replace(/[:\\/]/g, "-")
const sessionDir = path.join(os.homedir(), ".claude", "projects", encoded)

if (clean) {
  fs.rmSync(sessionDir, { recursive: true, force: true })
  fs.rmSync(projectDir, { recursive: true, force: true })
  console.log(`removed ${projectDir} and ${sessionDir}`)
  process.exit(0)
}

// ---- a plain throwaway folder ---------------------------------------------------------------------------
// Deliberately NOT a git repository: Claude Code keys workspace trust on the repo root, so a repo here would
// raise the trust dialog even under a trusted parent, while a plain subfolder of a trusted folder does not.
fs.rmSync(projectDir, { recursive: true, force: true })
fs.mkdirSync(path.join(projectDir, "statusline"), { recursive: true })
fs.writeFileSync(path.join(projectDir, "statusline", "deck.mjs"), "export const bar = (pct) => gradientBar(pct, 16)\n")
fs.writeFileSync(path.join(projectDir, "notes.md"), "todo\n")

// ---- the transcript ------------------------------------------------------------------------------------
const sessionId = crypto.randomUUID()
const T0 = Date.now() - 12 * 60 * 1000
let clock = T0, last = null
const uuid = () => crypto.randomUUID()
const stamp = () => new Date((clock += 1800 + Math.floor(Math.random() * 900))).toISOString()
const common = () => ({ isSidechain: false, userType: "external", entrypoint: "cli", cwd: projectDir, sessionId, version: "2.1.300", gitBranch: "main", slug: "aurora-demo" })
const usage = (n) => ({ input_tokens: 4, cache_creation_input_tokens: 900 + n * 40, cache_read_input_tokens: 270000 + n * 2300, output_tokens: 180 + n * 21, service_tier: "standard" })
const lines = []
const push = (o) => { lines.push(JSON.stringify(o)); last = o.uuid ?? last }

lines.push(JSON.stringify({ type: "mode", mode: "normal", sessionId }))
lines.push(JSON.stringify({ type: "permission-mode", permissionMode: "bypassPermissions", sessionId }))

function user(text, promptId) {
  const u = uuid()
  push({ parentUuid: lastUuid, ...common(), promptId, type: "user", message: { role: "user", content: text }, uuid: u, timestamp: stamp(), permissionMode: "bypassPermissions", origin: { kind: "human" }, promptSource: "typed", turnOrigin: "human" })
  lastUuid = u; return u
}
let lastUuid = null
let apiN = 0
function assistant(blocks, stop = "tool_use") {
  const msgId = "msg_" + crypto.randomBytes(12).toString("hex"), req = "req_" + crypto.randomBytes(12).toString("hex"); apiN++
  const ids = []
  blocks.forEach((b, i) => {
    const u = uuid(); ids.push(u)
    push({ parentUuid: lastUuid, ...common(), type: "assistant", uuid: u, timestamp: stamp(), requestId: req, apiBlockIndex: i,
      message: { model: "claude-sonnet-5-5", id: msgId, type: "message", role: "assistant", content: [b], container: null, stop_reason: i === blocks.length - 1 ? stop : null, stop_sequence: null, usage: usage(apiN) },
      ...(b.type === "tool_use" ? { wireToolInputs: { [b.id]: b.input } } : {}), effort: "xhigh", perTurnEffort: "xhigh" })
    lastUuid = u
  })
  return ids[ids.length - 1]
}
const toolUse = (name, input) => ({ type: "tool_use", id: "toolu_" + crypto.randomBytes(12).toString("hex"), name, input, caller: { type: "direct" } })
function result(tu, content, toolUseResult, isError = false, promptId) {
  const u = uuid()
  push({ parentUuid: lastUuid, ...common(), promptId, type: "user", uuid: u, timestamp: stamp(), sourceToolAssistantUUID: lastUuid,
    message: { role: "user", content: [{ type: "tool_result", tool_use_id: tu.id, content, ...(isError ? { is_error: true } : {}) }] }, toolUseResult })
  lastUuid = u
}
const file = (p) => path.join(projectDir, p)
const pid = uuid()

user("Make the status line show git, context and quota on two rows, with a gradient bar. Keep it fast.", pid)

assistant([{ type: "text", text: "I'll look at what the deck draws now, then change the bar." }])
const t1 = toolUse("Read", { file_path: file("statusline/deck.mjs") })
assistant([t1])
result(t1, "     1→export const bar = (pct) => gradientBar(pct, 16)\n", { type: "text", file: { filePath: file("statusline/deck.mjs"), content: "export const bar = (pct) => gradientBar(pct, 16)\n", numLines: 1, startLine: 1, totalLines: 1 } }, false, pid)

const t2 = toolUse("Grep", { pattern: "prompt_cache|rate_limits", path: projectDir, output_mode: "files_with_matches" })
assistant([t2])
result(t2, "Found 3 files\nstatusline/deck.mjs\ntests/deck.test.mjs\nREADME.md", { mode: "files_with_matches", filenames: ["statusline/deck.mjs", "tests/deck.test.mjs", "README.md"], numFiles: 3 }, false, pid)

const t3 = toolUse("Edit", { file_path: file("statusline/deck.mjs"), old_string: "gradientBar(pct, 16)", new_string: "gradientBar(pct, 16, palette.ramp)" })
assistant([t3])
result(t3, "The file statusline/deck.mjs has been updated.", { filePath: file("statusline/deck.mjs"), oldString: "gradientBar(pct, 16)", newString: "gradientBar(pct, 16, palette.ramp)", originalFile: "export const bar = (pct) => gradientBar(pct, 16)\n",
  structuredPatch: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ["-export const bar = (pct) => gradientBar(pct, 16)", "+export const bar = (pct) => gradientBar(pct, 16, palette.ramp)"] }], userModified: false, replaceAll: false }, false, pid)

const t4 = toolUse("Bash", { command: "node --test tests/", description: "Run the status line tests" })
assistant([t4])
result(t4, "✔ renders two rows (4ms)\n✔ never wider than the terminal (2ms)\n✔ hot quotas turn red (1ms)\nℹ tests 15\nℹ pass 15\nℹ fail 0", { stdout: "ℹ tests 15\nℹ pass 15\nℹ fail 0", stderr: "", interrupted: false, isImage: false, noOutputExpected: false }, false, pid)

const t5 = toolUse("Bash", { command: "node tools/rice.mjs apply --palette sunset", description: "Apply a palette that does not exist yet" })
assistant([t5])
result(t5, 'Exit code 1\nno palette "sunset" (have: aurora)', 'Error: Exit code 1\nno palette "sunset" (have: aurora)', true, pid)

const t6 = toolUse("WebSearch", { query: "Windows Terminal pixel shader glow bloom" })
assistant([t6])
result(t6, "Web search results for query: \"Windows Terminal pixel shader glow bloom\"\n\n1. Custom pixel shaders in Windows Terminal …", { query: "Windows Terminal pixel shader glow bloom", results: [], durationSeconds: 3.1 }, false, pid)

assistant([{ type: "text", text:
`## Done

The status line is now two rows and still fast.

- **Row 1:** model, effort, folder, git branch with dirty and unpushed counts.
- **Row 2:** context, 5h and 7d as gradient bars that warm from cyan to coral as they fill.
- **Cost:** about 40 ms a refresh, with git cached for three seconds.

## What changed

| Segment | Source | Updates |
|---|---|---|
| context bar | context_window | each reply |
| 5h / 7d quota | rate_limits | each reply |
| cache clock | prompt_cache | at expiry |

\`\`\`js
export const bar = (pct) => gradientBar(pct, 16, palette.ramp)
\`\`\`

One caveat: the \`sunset\` palette I tried does not exist yet, so that apply failed. Want me to add it?` }], "end_turn")

lines.push(JSON.stringify({ type: "last-prompt", lastPrompt: "Make the status line show git, context and quota on two rows, with a gradient bar. Keep it fast.", sessionId }))
fs.mkdirSync(sessionDir, { recursive: true })
const out = path.join(sessionDir, `${sessionId}.jsonl`)
fs.writeFileSync(out, lines.join("\n") + "\n")
const riceDir = process.env.RICE_DIR ?? path.join(os.homedir(), ".rice")
fs.mkdirSync(path.join(riceDir, "preview"), { recursive: true })
fs.writeFileSync(path.join(riceDir, "preview", "session.txt"), sessionId)
console.log(JSON.stringify({ sessionId, projectDir, sessionFile: out, lines: lines.length }))
