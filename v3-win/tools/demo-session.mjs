// demo-session.mjs: write a synthetic Claude Code transcript that exercises what prismantis draws, so the real UI can be
// photographed with `claude --resume <id>`: no API call, no usage spent. Same approach as v2-win/tools/make-demo-session.mjs,
// with a richer closing reply (headings, a chart, a figure, an alert, a task list, code) and an Edit whose diff prismantis
// redraws in the palette.
//
//   node tools/demo-session.mjs              writes ~/.rice/preview/session-v3.txt (the session id) and prints the details
//   node tools/demo-session.mjs --clean      removes the session files it wrote (the demo folder is shared with v2, kept)
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const TAG = process.env.RICE_DEMO_TAG ?? "v3"
const projectDir = path.join(os.homedir(), "Projects", "aurora-demo")
const sessionDir = path.join(os.homedir(), ".claude", "projects", projectDir.replace(/[:\\/]/g, "-"))
const idFile = path.join(process.env.RICE_DIR ?? path.join(os.homedir(), ".rice"), "preview", `session-${TAG}.txt`)

if (process.argv.includes("--clean")) {
  if (fs.existsSync(idFile)) {
    const id = fs.readFileSync(idFile, "utf8").trim()
    fs.rmSync(path.join(sessionDir, `${id}.jsonl`), { force: true })
    fs.rmSync(idFile, { force: true })
    console.log(`removed session ${id}`)
  } else console.log("nothing to clean")
  process.exit(0)
}

// A plain folder, not a git repository (workspace trust is keyed on the repo root; see v2-win/docs/FINDINGS.md).
fs.mkdirSync(path.join(projectDir, "statusline"), { recursive: true })
fs.writeFileSync(path.join(projectDir, "statusline", "deck.mjs"), "export const bar = (pct) => gradientBar(pct, 16)\n")

const sessionId = crypto.randomUUID()
let clock = Date.now() - 9 * 60 * 1000, lastUuid = null, apiN = 0
const lines = []
const uuid = () => crypto.randomUUID()
const stamp = () => new Date((clock += 1800 + Math.floor(Math.random() * 900))).toISOString()
const common = () => ({ isSidechain: false, userType: "external", entrypoint: "cli", cwd: projectDir, sessionId, version: "2.1.301", gitBranch: "main", slug: "aurora-demo" })
const usage = (n) => ({ input_tokens: 4, cache_creation_input_tokens: 900 + n * 40, cache_read_input_tokens: 270000 + n * 2300, output_tokens: 180 + n * 21, service_tier: "standard" })
const push = (o) => lines.push(JSON.stringify(o))

lines.push(JSON.stringify({ type: "mode", mode: "normal", sessionId }))
lines.push(JSON.stringify({ type: "permission-mode", permissionMode: "bypassPermissions", sessionId }))

function user(text, promptId) {
  const u = uuid()
  push({ parentUuid: lastUuid, ...common(), promptId, type: "user", message: { role: "user", content: text }, uuid: u, timestamp: stamp(), permissionMode: "bypassPermissions", origin: { kind: "human" }, promptSource: "typed", turnOrigin: "human" })
  lastUuid = u
}
function assistant(blocks, stop = "tool_use") {
  const msgId = "msg_" + crypto.randomBytes(12).toString("hex"), req = "req_" + crypto.randomBytes(12).toString("hex"); apiN++
  blocks.forEach((b, i) => {
    const u = uuid()
    push({ parentUuid: lastUuid, ...common(), type: "assistant", uuid: u, timestamp: stamp(), requestId: req, apiBlockIndex: i,
      message: { model: "claude-opus-5-5", id: msgId, type: "message", role: "assistant", content: [b], container: null, stop_reason: i === blocks.length - 1 ? stop : null, stop_sequence: null, usage: usage(apiN) },
      ...(b.type === "tool_use" ? { wireToolInputs: { [b.id]: b.input } } : {}), effort: "xhigh", perTurnEffort: "xhigh" })
    lastUuid = u
  })
}
const toolUse = (name, input) => ({ type: "tool_use", id: "toolu_" + crypto.randomBytes(12).toString("hex"), name, input, caller: { type: "direct" } })
function result(tu, content, toolUseResult, isError, promptId) {
  const u = uuid()
  push({ parentUuid: lastUuid, ...common(), promptId, type: "user", uuid: u, timestamp: stamp(), sourceToolAssistantUUID: lastUuid,
    message: { role: "user", content: [{ type: "tool_result", tool_use_id: tu.id, content, ...(isError ? { is_error: true } : {}) }] }, toolUseResult })
  lastUuid = u
}
const file = (p) => path.join(projectDir, p)
const pid = uuid()
const before = "export const bar = (pct) => gradientBar(pct, 16)\n"
const after = "export const bar = (pct, ramp = palette.ramp) => gradientBar(pct, 14, ramp)\n"

user("Give the status line bar the palette's ramp and make it two cells shorter. Show me what changed.", pid)
assistant([{ type: "text", text: "Reading the bar first." }])
const t1 = toolUse("Read", { file_path: file("statusline/deck.mjs") })
assistant([t1])
result(t1, `     1→${before}`, { type: "text", file: { filePath: file("statusline/deck.mjs"), content: before, numLines: 1, startLine: 1, totalLines: 1 } }, false, pid)
const t2 = toolUse("Grep", { pattern: "gradientBar", path: projectDir, output_mode: "files_with_matches" })
assistant([t2])
result(t2, "Found 2 files\nstatusline/deck.mjs\ntests/deck.test.mjs", { mode: "files_with_matches", filenames: ["statusline/deck.mjs", "tests/deck.test.mjs"], numFiles: 2 }, false, pid)
const t3 = toolUse("Edit", { file_path: file("statusline/deck.mjs"), old_string: before.trim(), new_string: after.trim() })
assistant([t3])
result(t3, "The file statusline/deck.mjs has been updated.", { filePath: file("statusline/deck.mjs"), oldString: before.trim(), newString: after.trim(), originalFile: before,
  structuredPatch: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: [`-${before.trim()}`, `+${after.trim()}`] }], userModified: false, replaceAll: false }, false, pid)
const t4 = toolUse("Bash", { command: "node --test tests/", description: "Run the status line tests" })
assistant([t4])
result(t4, "✔ renders two rows (4ms)\n✔ never wider than the terminal (2ms)\nℹ tests 19\nℹ pass 19\nℹ fail 0", { stdout: "ℹ tests 19\nℹ pass 19\nℹ fail 0", stderr: "", interrupted: false, isImage: false, noOutputExpected: false }, false, pid)
const t5 = toolUse("Bash", { command: "node tools/rice.mjs apply sunset", description: "Apply a palette that does not exist yet" })
assistant([t5])
result(t5, 'Exit code 1\nno palette "sunset" (have: ember, amber, crimson)', 'Error: Exit code 1\nno palette "sunset" (have: ember, amber, crimson)', true, pid)

// The closing reply is a markdown file: RICE_DEMO_REPLY, or preview/reply-a.md next to this script (reply-b.md is the second shot).
const replyFile = process.env.RICE_DEMO_REPLY || path.join(path.dirname(fileURLToPath(import.meta.url)), "preview", "reply-a.md")
const reply = fs.readFileSync(replyFile, "utf8").trim()

assistant([{ type: "text", text: reply }], "end_turn")
lines.push(JSON.stringify({ type: "last-prompt", lastPrompt: "Give the status line bar the palette's ramp and make it two cells shorter. Show me what changed.", sessionId }))
fs.mkdirSync(sessionDir, { recursive: true })
const out = path.join(sessionDir, `${sessionId}.jsonl`)
fs.writeFileSync(out, lines.join("\n") + "\n")
fs.mkdirSync(path.dirname(idFile), { recursive: true })
if (fs.existsSync(idFile)) fs.rmSync(path.join(sessionDir, `${fs.readFileSync(idFile, "utf8").trim()}.jsonl`), { force: true })   // one demo session per tag
fs.writeFileSync(idFile, sessionId)
console.log(JSON.stringify({ sessionId, sessionFile: out, idFile, lines: lines.length }))
