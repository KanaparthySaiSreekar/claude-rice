import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { spawnSync } from "node:child_process"
const [payload, ...flags] = process.argv.slice(2)
const shim = path.join(os.homedir(), ".claude", "plugins", "claude-hud", "statusline.cmd")
const t0 = Date.now()
const r = spawnSync("cmd.exe", ["/c", shim], { input: fs.readFileSync(payload), env: { ...process.env, COLUMNS: "120" }, encoding: "utf8" })
const ms = Date.now() - t0
const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, "")
const lines = strip(r.stdout ?? "").split("\n").filter((l) => l.trim() !== "")
console.log(`exit=${r.status} ${ms}ms rows=${lines.length}`)
for (const l of lines) console.log("  |" + l + "|")
if (r.stderr) console.log("stderr:", r.stderr.slice(0, 300))
