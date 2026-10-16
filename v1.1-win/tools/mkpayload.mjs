import fs from "node:fs"
const now = Math.floor(Date.now() / 1000)
const dir = "C:/Users/Kasasree/Projects/claude-code-mods-research"
const payload = {
  session_id: "test", version: "2.1.300",
  model: { id: "claude-sonnet-5-5", display_name: "Sonnet 5.5" },
  workspace: { current_dir: dir, project_dir: dir }, cwd: dir,
  context_window: { used_percentage: 29, context_window_size: 1000000, total_input_tokens: 293000 },
  rate_limits: { five_hour: { used_percentage: 15, resets_at: now + 2 * 3600 + 26 * 60 }, seven_day: { used_percentage: 94, resets_at: now + 6 * 3600 + 6 * 60 } },
  effort: { level: "xhigh" },
}
fs.writeFileSync(process.argv[2], JSON.stringify(payload))
