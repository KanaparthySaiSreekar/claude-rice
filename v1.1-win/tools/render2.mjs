import fs from "node:fs"; import os from "node:os"; import { spawnSync } from "node:child_process"
const home = os.homedir().split(String.fromCharCode(92)).join("/")
const ESC = String.fromCharCode(27), BEL = String.fromCharCode(7)
const strip = (s) => s.split(ESC + "]8;;").map((p, i) => i === 0 ? p : p.slice(p.search(new RegExp("(" + ESC + "\\|" + BEL + ")")) + (p.includes(ESC + "\\") ? 2 : 1))).join("").replace(new RegExp(ESC + "\[[0-9;]*m", "g"), "")
const now = Math.floor(Date.now() / 1000), dir = `${home}/Projects/claude-code-mods-research`
const base = { session_id: "t", version: "2.1.300", model: { display_name: "Sonnet 5.5" }, workspace: { current_dir: dir, project_dir: dir }, cwd: dir,
  context_window: { used_percentage: 29, context_window_size: 1000000 }, rate_limits: { five_hour: { used_percentage: 15, resets_at: now + 8760 }, seven_day: { used_percentage: 94, resets_at: now + 22000 } } }
const cases = [
  ["cache warm, 120 cols", { ...base, prompt_cache: { caching_observed: true, warm: true, expires_at: now + 252, ttl: "5m", hit_ratio: 0.93 } }, 120],
  ["no cache data yet (session start)", base, 120],
  ["cache expired", { ...base, prompt_cache: { caching_observed: true, warm: false, expires_at: now - 30, ttl: "5m" } }, 120],
  ["cache warm, narrow 50 cols", { ...base, prompt_cache: { caching_observed: true, warm: true, expires_at: now + 252, ttl: "5m" } }, 50],
]
const shim = `${home}/.claude/plugins/claude-hud/statusline.cmd`
for (const [name, payload, cols] of cases) {
  const t0 = performance.now()
  const r = spawnSync("cmd.exe", ["/c", shim.split("/").join(String.fromCharCode(92))], { input: JSON.stringify(payload), encoding: "utf8", env: { ...process.env, COLUMNS: String(cols) } })
  const ms = Math.round(performance.now() - t0)
  const rows = strip(r.stdout ?? "").split("\n").filter((l) => l.trim())
  console.log(`${name}  [exit ${r.status}, ${ms} ms, ${rows.length} row${rows.length === 1 ? "" : "s"}]`); rows.forEach((l) => console.log("    " + l))
}
