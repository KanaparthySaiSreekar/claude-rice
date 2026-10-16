import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { execFileSync, spawnSync } from "node:child_process"
const SP = process.argv[2]
const home = os.homedir().split(path.sep).join("/")
const dist = fs.readdirSync(`${home}/.claude/plugins/cache/kasasree-mods/claude-hud`).map((v) => `${home}/.claude/plugins/cache/kasasree-mods/claude-hud/${v}/dist/index.js`)[0]
const live = JSON.parse(fs.readFileSync(`${home}/.claude/plugins/claude-hud/config.json`, "utf8"))
const sh = (cwd, ...a) => execFileSync("git", a, { cwd, stdio: "pipe" })

// throwaway repo: 1 commit pushed, 1 commit not pushed (ahead 1), 1 modified file (dirty)
const demo = `${SP}/demo-repo`, remote = `${SP}/demo-remote.git`
fs.rmSync(demo, { recursive: true, force: true }); fs.rmSync(remote, { recursive: true, force: true })
fs.mkdirSync(demo, { recursive: true }); sh(demo, "init", "-q", "-b", "main"); sh(demo, "config", "user.email", "t@t"); sh(demo, "config", "user.name", "t")
fs.writeFileSync(`${demo}/a.txt`, "1\n"); sh(demo, "add", "."); sh(demo, "commit", "-qm", "one")
execFileSync("git", ["init", "-q", "--bare", remote]); sh(demo, "remote", "add", "origin", remote); sh(demo, "push", "-q", "-u", "origin", "main")
fs.writeFileSync(`${demo}/a.txt`, "2\n"); sh(demo, "commit", "-qam", "two (unpushed)")
fs.writeFileSync(`${demo}/a.txt`, "3\n")   // dirty

const now = Math.floor(Date.now() / 1000)
const payload = (cwd) => ({
  session_id: "t", version: "2.1.300", model: { id: "claude-sonnet-5-5", display_name: "Sonnet 5.5" },
  workspace: { current_dir: cwd, project_dir: cwd }, cwd,
  context_window: { used_percentage: 29, context_window_size: 1000000 },
  rate_limits: { five_hour: { used_percentage: 15, resets_at: now + 8760 }, seven_day: { used_percentage: 94, resets_at: now + 22000 } },
  cost: { total_cost_usd: 22.48, total_duration_ms: 4320000 },
  prompt_cache: { caching_observed: true, warm: true, expires_at: now + 252, ttl: "5m", hit_ratio: 0.93 },
})
const strip = (s) => s.replace(/\u001b\]8;;[^\u001b\u0007]*(\u001b\|\u0007)/g, "").replace(/\u001b\[[0-9;]*m/g, "")
const variants = {
  "A  clean (what you have now)": { cwd: `${home}/Projects/claude-code-mods-research`, cfg: {} },
  "B  git detail (dirty + unpushed)": { cwd: demo, cfg: {} },
  "C  + prompt-cache countdown": { cwd: `${home}/Projects/claude-code-mods-research`, cfg: { elementOrder: ["project", "promptCache"], display: { showPromptCache: true, mergeGroups: [["project", "promptCache"]] } } },
  "D  + session clock": { cwd: `${home}/Projects/claude-code-mods-research`, cfg: { display: { showDuration: true } } },
  "E  + cache countdown + session clock": { cwd: `${home}/Projects/claude-code-mods-research`, cfg: { elementOrder: ["project", "promptCache"], display: { showPromptCache: true, showDuration: true, mergeGroups: [["project", "promptCache"]] } } },
}
for (const [name, v] of Object.entries(variants)) {
  const cfg = structuredClone(live); Object.assign(cfg, { ...v.cfg, display: { ...live.display, ...(v.cfg.display ?? {}) } })
  const dir = `${SP}/cfg/${name.slice(0, 1)}/plugins/claude-hud`; fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${dir}/config.json`, JSON.stringify(cfg))
  const r = spawnSync("node", [dist], { input: JSON.stringify(payload(v.cwd)), encoding: "utf8", env: { ...process.env, CLAUDE_CONFIG_DIR: `${SP}/cfg/${name.slice(0, 1)}`, COLUMNS: "120" } })
  const rows = strip(r.stdout ?? "").split("\n").filter((l) => l.trim())
  console.log(`${name}  [${rows.length} row${rows.length === 1 ? "" : "s"}]`); for (const l of rows) console.log("    " + l); if (r.stderr?.trim()) console.log("    stderr: " + r.stderr.slice(0, 200))
}
