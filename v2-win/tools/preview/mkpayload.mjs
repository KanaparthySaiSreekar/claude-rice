// mkpayload.mjs: a realistic Claude Code status-line payload for visual checks.
//   node tools/preview/mkpayload.mjs <out.json> [full|calm|hot|start]
// The working directory is this repository, so the git pill shows a real branch.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const [out, variant = "full"] = process.argv.slice(2)
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..").split(path.sep).join("/")
const now = Math.floor(Date.now() / 1000)
const base = {
  session_id: "demo", version: "2.1.300", cwd: repo,
  model: { id: "claude-sonnet-5-5", display_name: "Sonnet 5.5" },
  workspace: { current_dir: repo, project_dir: repo },
  effort: { level: "xhigh" }, fast_mode: false, thinking: { enabled: true },
  context_window: { used_percentage: 29, context_window_size: 1000000, total_input_tokens: 293000, total_output_tokens: 1800 },
  rate_limits: { five_hour: { used_percentage: 15, resets_at: now + 2 * 3600 + 26 * 60 }, seven_day: { used_percentage: 94, resets_at: now + 6 * 3600 + 6 * 60 } },
  cost: { total_cost_usd: 22.48, total_duration_ms: 4320000, total_lines_added: 156, total_lines_removed: 23 },
  prompt_cache: { warm: true, caching_observed: true, ttl: "5m", expires_at: now + 252, hit_ratio: 0.93, requests: 14, misses: 1 },
  pr: { number: 12, url: "https://github.com/example/repo/pull/12", review_state: "approved" },
}
const variants = {
  full: base,
  calm: { ...base, context_window: { ...base.context_window, used_percentage: 8, total_input_tokens: 80000 }, rate_limits: { five_hour: { used_percentage: 6, resets_at: now + 4 * 3600 }, seven_day: { used_percentage: 22, resets_at: now + 3 * 86400 } }, cost: { ...base.cost, total_cost_usd: 1.2 } },
  hot: { ...base, context_window: { ...base.context_window, used_percentage: 91, total_input_tokens: 910000 }, rate_limits: { five_hour: { used_percentage: 97, resets_at: now + 25 * 60 }, seven_day: { used_percentage: 99, resets_at: now + 5 * 3600 } }, prompt_cache: { ...base.prompt_cache, expires_at: now + 40 } },
  start: { session_id: "demo", version: "2.1.300", cwd: repo, model: base.model, workspace: base.workspace, context_window: { used_percentage: null, context_window_size: 1000000 } },
}
if (!variants[variant]) throw new Error(`unknown variant "${variant}"`)
fs.writeFileSync(out, JSON.stringify(variants[variant]))
