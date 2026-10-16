// Tests the REAL hook at ~/.claude/hooks/tab-title.mjs. Everything it creates lives in a temp dir.
import { spawnSync, execFileSync } from "node:child_process"
import fs from "node:fs"; import os from "node:os"; import path from "node:path"

const hook = path.join(os.homedir(), ".claude", "hooks", "tab-title.mjs")
const ESC = String.fromCharCode(27), BEL = String.fromCharCode(7)
const fwd = (p) => p.split(path.sep).join("/")
const git = (cwd, ...a) => execFileSync("git", a, { cwd, stdio: "pipe" })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "title-test-"))

function run(input) {
  const t0 = performance.now()
  const r = spawnSync(process.execPath, [hook], { input: typeof input === "string" ? input : JSON.stringify(input), encoding: "utf8" })
  const out = r.stdout ?? ""
  let title = null, raw = out
  if (out) { const seq = JSON.parse(out).terminalSequence; title = seq.slice((ESC + "]2;").length, -BEL.length); raw = seq }
  return { status: r.status, title, raw, ms: performance.now() - t0, stderr: r.stderr }
}

// --- fixtures ---------------------------------------------------------------
const repo = path.join(tmp, "my-repo"); fs.mkdirSync(path.join(repo, "src", "deep"), { recursive: true })
git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "t@t"); git(repo, "config", "user.name", "t")
fs.writeFileSync(path.join(repo, "a.txt"), "1"); git(repo, "add", "."); git(repo, "commit", "-qm", "one")
const wt = path.join(tmp, "my-worktree"); git(repo, "worktree", "add", "-q", wt, "-b", "feature/login")
const detached = path.join(tmp, "detached"); git(tmp, "clone", "-q", repo, detached); git(detached, "checkout", "-q", "--detach")
const plain = path.join(tmp, "not-a-repo"); fs.mkdirSync(plain)
const garbage = path.join(tmp, "garbage"); fs.mkdirSync(path.join(garbage, ".git"), { recursive: true }); fs.writeFileSync(path.join(garbage, ".git", "HEAD"), "\u0000\u0001 not a ref")
const gitfile = path.join(tmp, "badgitfile"); fs.mkdirSync(gitfile); fs.writeFileSync(path.join(gitfile, ".git"), "nonsense")

// --- cases ------------------------------------------------------------------
let pass = 0, fail = 0
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "   " + detail : ""}`) }
const ev = (hook_event_name, cwd) => ({ hook_event_name, cwd: fwd(cwd) })

let r = run(ev("UserPromptSubmit", repo));              check("working title with branch", r.title === "◐ my-repo ⎇ main", JSON.stringify(r.title))
r = run(ev("PermissionRequest", repo));                 check("needs-you title with branch", r.title === "▲ my-repo ⎇ main · needs you", JSON.stringify(r.title))
r = run(ev("Stop", repo));                              check("done title with branch", r.title === "✓ my-repo ⎇ main · done", JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", path.join(repo, "src", "deep"))); check("finds the repo from a subfolder (shows folder + branch)", r.title === "◐ deep ⎇ main", JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", wt));                    check("worktree (.git is a file), branch with a slash", r.title === "◐ my-worktree ⎇ feature/login", JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", detached));              check("detached HEAD: folder only", r.title === "◐ detached", JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", plain));                 check("not a repo: folder only", r.title === "◐ not-a-repo", JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", garbage));               check("garbage HEAD: folder only, no crash", r.title === "◐ garbage" && r.status === 0, JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", gitfile));               check("garbage .git file: folder only, no crash", r.title === "◐ badgitfile" && r.status === 0, JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", path.join(tmp, "does", "not", "exist"))); check("nonexistent cwd: folder only", r.title === "◐ exist", JSON.stringify(r.title))

for (const [name, input] of [["not JSON", "{{{"], ["empty stdin", ""], ["no cwd", { hook_event_name: "Stop" }], ["cwd not a string", { hook_event_name: "Stop", cwd: 42 }], ["unknown event", { hook_event_name: "PreToolUse", cwd: "C:/x" }], ["null payload", "null"]]) {
  r = run(input); check(`silent on ${name}`, r.status === 0 && r.raw === "", `exit ${r.status}, out ${JSON.stringify(r.raw)}`)
}

// hostile names: only the hook's own single OSC 2 sequence may reach the terminal
r = run({ hook_event_name: "Stop", cwd: "C:/x/evil" + ESC + "]0;pwned" + BEL + ESC + "[31mname" })
const escCount = [...r.raw].filter((c) => c === ESC).length, belCount = [...r.raw].filter((c) => c === BEL).length
check("control chars in the folder name are stripped (1 ESC + 1 BEL, ours only)", escCount === 1 && belCount === 1, `ESC=${escCount} BEL=${belCount} title=${JSON.stringify(r.title)}`)
const hostileBranch = path.join(tmp, "hostile"); fs.mkdirSync(path.join(hostileBranch, ".git"), { recursive: true })
fs.writeFileSync(path.join(hostileBranch, ".git", "HEAD"), "ref: refs/heads/x" + ESC + "]0;pwned" + BEL + "y\n")
r = run(ev("UserPromptSubmit", hostileBranch))
check("control chars in a branch name are stripped", [...r.raw].filter((c) => c === ESC).length === 1 && [...r.raw].filter((c) => c === BEL).length === 1, JSON.stringify(r.title))
r = run(ev("UserPromptSubmit", path.join(tmp, "a".repeat(120)))); check("long titles are cut to 80 chars", r.title.length === 80, `len ${r.title.length}`)

// the hook must never start a process (that was the point of reading HEAD directly)
const src = fs.readFileSync(hook, "utf8")
check("hook imports no child_process / does not spawn git", !/child_process|\bspawn|execFile|execSync|\bfork\(/.test(src.replace(/\/\/.*$/gm, "")))

// speed
const times = Array.from({ length: 8 }, () => run(ev("UserPromptSubmit", repo)).ms).sort((a, b) => a - b)
console.log(`\ntiming over 8 runs in a repo: median ${times[4].toFixed(0)} ms, max ${times[7].toFixed(0)} ms  (previous hook was ~37 ms)`)
console.log(`\n${pass} passed, ${fail} failed`)
fs.rmSync(tmp, { recursive: true, force: true })
process.exit(fail ? 1 : 0)
