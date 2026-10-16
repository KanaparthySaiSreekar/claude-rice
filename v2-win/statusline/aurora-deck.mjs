#!/usr/bin/env node
// aurora-deck.mjs: the v2 status line. One file, no dependencies.
//
//   row 1  identity pills:  ✦ model  ▇ effort  ⌂ folder  ⎇ branch ✱dirty ↑ahead  #PR       … ⏱ session  +added −removed
//   row 2  gauges:          ctx ▕gradient bar▏ 29% 293k/1.0M │ 5h ▕bar▏ 15% ↻2h26m │ 7d ▕bar▏ 94% ↻6h06m ! │ $22.48 │ cache 93% ◷ 20:56
//
// Reads Claude Code's status-line JSON on stdin (documented at code.claude.com/docs/en/statusline),
// sizes itself from COLUMNS, and ALWAYS exits 0 with at least one row: a non-zero exit blanks the
// status line. Colours come from ~/.rice/current/statusline/palette.json, so a palette switch
// needs no restart. NO_COLOR is deliberately ignored: this output is only ever drawn by
// Claude Code, and its tool shells set NO_COLOR for their own sake.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"

// ---------------------------------------------------------------------------------------------
// colour (OKLab ramps; kept in sync with tools/lib/color.mjs by tests/statusline.test.mjs)
// ---------------------------------------------------------------------------------------------
const ESC = String.fromCharCode(27)
const RESET = `${ESC}[0m`
const BOLD = `${ESC}[1m`
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const unlin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const toLab = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(lin)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
const fromLab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [unlin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), unlin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), unlin(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)].map((v) => Math.max(0, Math.min(255, v)))
}
export function rampAt(stops, t) {
  const pts = stops.map(hexToRgb)
  if (t <= 0) return pts[0]
  if (t >= 1) return pts[pts.length - 1]
  const x = t * (pts.length - 1), i = Math.floor(x), A = toLab(pts[i]), B = toLab(pts[i + 1]), f = x - i
  return fromLab(A.map((v, k) => v + (B[k] - v) * f))
}
const fgc = (rgb) => `${ESC}[38;2;${rgb.map(Math.round).join(";")}m`
const bgc = (rgb) => `${ESC}[48;2;${rgb.map(Math.round).join(";")}m`
const F = (hex) => fgc(hexToRgb(hex))
const Bg = (hex) => bgc(hexToRgb(hex))

export const DEFAULT_PALETTE = {
  key: "aurora", label: "Claude Aurora",
  base: { bg: "#0C0A18", surface: "#14112B", raised: "#1B1740", hover: "#241F52", line: "#332D66", selection: "#3B3478", fg: "#ECE8FA", muted: "#A29DC8", faint: "#8A84B8", dim: "#6C66A3" },
  accent: { coral: "#FF8F66", coralLight: "#FFB08F", pink: "#FF5FA2", violet: "#A78BFA", blue: "#5BA8FF", cyan: "#4DE3D8", mint: "#62EBB0", amber: "#FFC857", red: "#FF6B88" },
  ramp: ["#4DE3D8", "#5BA8FF", "#A78BFA", "#FF5FA2", "#FF8F66"],
  semantic: { ok: "#62EBB0", warn: "#FFC857", err: "#FF6B88", info: "#5BA8FF" },
}

export function loadPalette(file = path.join(os.homedir(), ".rice", "current", "statusline", "palette.json")) {
  try { return { ...DEFAULT_PALETTE, ...JSON.parse(fs.readFileSync(file, "utf8")) } } catch { return DEFAULT_PALETTE }
}

// ---------------------------------------------------------------------------------------------
// text helpers
// ---------------------------------------------------------------------------------------------
const ANSI = /\u001b\[[0-9;]*m/g
const isWide = (cp) => (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe6f) || (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f300 && cp <= 0x1faff)
export const visibleWidth = (s) => { let w = 0; for (const ch of s.replace(ANSI, "")) w += isWide(ch.codePointAt(0)) ? 2 : 1; return w }
const clampPct = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null)
const clean = (s, max = 40) => String(s ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").slice(0, max)

export function fmtTokens(n) {
  if (!Number.isFinite(n)) return "–"
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`
  return String(Math.round(n))
}
export function fmtReset(epochSec, nowMs) {
  if (!Number.isFinite(epochSec)) return ""
  let s = Math.max(0, Math.round(epochSec - nowMs / 1000))
  const d = Math.floor(s / 86400); s -= d * 86400
  const h = Math.floor(s / 3600); s -= h * 3600
  const m = Math.floor(s / 60)
  if (d > 0) return `${d}d${h}h`
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`
  return `${m}m`
}
export function fmtDuration(ms) {
  if (!Number.isFinite(ms) || ms < 1000) return ""
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}m` : m > 0 ? `${m}m` : `${s}s`
}
const clock = (epochSec) => new Date(epochSec * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

// ---------------------------------------------------------------------------------------------
// the gradient bar: `cells` wide, filled to pct with 1/8-cell precision; colour follows the cell's
// position on the ramp, so a nearly empty bar is cool and a nearly full one is warm.
// ---------------------------------------------------------------------------------------------
const EIGHTHS = [" ", "▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"]
export function gradientBar(pct, cells, P, { glow = false } = {}) {
  const track = Bg(P.base.raised)
  const filled = pct === null ? 0 : (pct / 100) * cells
  let out = ""
  for (let i = 0; i < cells; i++) {
    const frac = Math.max(0, Math.min(1, filled - i))
    const eighths = Math.round(frac * 8)
    if (eighths === 0) { out += `${track} ${RESET}`; continue }
    const t = cells === 1 ? 0 : (i + 0.5) / cells
    const color = fgc(rampAt(P.ramp, t))
    out += `${track}${color}${EIGHTHS[eighths]}${RESET}`
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// pills: ◖ text ◗ with rounded powerline caps (or blocks, or none)
// ---------------------------------------------------------------------------------------------
const CAPS = {
  powerline: ["", ""],
  block: ["▌", "▐"],
  none: ["", ""],
}
export function pill(text, bgHex, fgHex, caps = "powerline", bold = false) {
  const [l, r] = CAPS[caps] ?? CAPS.powerline
  const cap = (g) => (g ? `${F(bgHex)}${g}${RESET}` : "")
  return `${cap(l)}${Bg(bgHex)}${F(fgHex)}${bold ? BOLD : ""} ${text} ${RESET}${cap(r)}`
}

const EFFORT_SEGMENTS = { low: 1, medium: 2, high: 3, xhigh: 4, max: 5 }
export const effortMeter = (level) => { const n = EFFORT_SEGMENTS[level] ?? 0; return "◆".repeat(n) + "◇".repeat(5 - n) }

// ---------------------------------------------------------------------------------------------
// git: `git status --porcelain=v2 --branch`, cached for a few seconds, with HEAD as the fallback
// ---------------------------------------------------------------------------------------------
export function parseGitStatus(text) {
  const g = { branch: "", ahead: 0, behind: 0, dirty: 0, conflicts: 0 }
  for (const line of text.split("\n")) {
    if (line.startsWith("# branch.head ")) g.branch = line.slice(14).trim()
    else if (line.startsWith("# branch.ab ")) { const m = /\+(\d+) -(\d+)/.exec(line); if (m) { g.ahead = Number(m[1]); g.behind = Number(m[2]) } }
    else if (line.startsWith("u ")) { g.conflicts++; g.dirty++ }
    else if (line[0] === "1" || line[0] === "2" || line[0] === "?") g.dirty++
  }
  if (g.branch === "(detached)") g.branch = ""
  return g
}

function branchFromHead(start) {
  try {
    let dir = path.resolve(start)
    for (let i = 0; i < 64; i++) {
      const dot = path.join(dir, ".git")
      let st = null
      try { st = fs.statSync(dot) } catch { /* keep climbing */ }
      if (st) {
        let gitDir = dot
        if (st.isFile()) { const m = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(dot, "utf8")); if (!m) return ""; gitDir = path.resolve(dir, m[1].trim()) }
        const head = /^ref:\s*refs\/heads\/(.+)$/m.exec(fs.readFileSync(path.join(gitDir, "HEAD"), "utf8"))
        return head ? head[1].trim() : ""
      }
      const parent = path.dirname(dir)
      if (parent === dir) return ""
      dir = parent
    }
  } catch { /* no branch */ }
  return ""
}

export function gitInfo(cwd, { now = Date.now(), cacheDir = path.join(os.homedir(), ".rice", "cache"), ttlMs = 3000, run = defaultGit } = {}) {
  if (!cwd) return null
  const file = path.join(cacheDir, "git.json")
  let cache = {}
  try { cache = JSON.parse(fs.readFileSync(file, "utf8")) } catch { /* cold */ }
  const hit = cache[cwd]
  if (hit && now - hit.t < ttlMs) return hit.v
  let v = null
  try { const text = run(cwd); if (text !== null) v = parseGitStatus(text) } catch { /* fall through */ }
  if (!v) { const branch = branchFromHead(cwd); v = branch ? { branch, ahead: 0, behind: 0, dirty: 0, conflicts: 0, partial: true } : null }
  try {
    fs.mkdirSync(cacheDir, { recursive: true })
    const keep = Object.fromEntries(Object.entries(cache).filter(([, e]) => now - e.t < 60000).slice(-8))
    keep[cwd] = { t: now, v }
    fs.writeFileSync(file, JSON.stringify(keep))
  } catch { /* the cache is a nicety */ }
  return v
}

function defaultGit(cwd) {
  try {
    return execFileSync("git", ["-c", "core.fsmonitor=false", "--no-optional-locks", "-C", cwd, "status", "--porcelain=v2", "--branch", "--untracked-files=normal"], {
      encoding: "utf8", timeout: 1500, windowsHide: true, stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" },
    })
  } catch { return null }
}

// ---------------------------------------------------------------------------------------------
// the deck
// ---------------------------------------------------------------------------------------------
const SEP = (P) => ` ${F(P.base.line)}│${RESET} `

function pctColor(pct, P, warn, crit) {
  if (pct === null) return F(P.base.faint)
  if (pct >= crit) return F(P.semantic.err)
  if (pct >= warn) return F(P.semantic.warn)
  return F(P.base.fg)
}

function gauge({ label, pct, cells, P, warn, crit, extra = "", showBar = true, labelWidth = 3 }) {
  const col = pctColor(pct, P, warn, crit)
  const txt = pct === null ? "  –" : `${String(Math.round(pct)).padStart(3)}%`.slice(-4)
  const bold = pct !== null && pct >= crit ? BOLD : ""
  const bar = showBar ? ` ${gradientBar(pct, cells, P)}` : ""
  const bang = pct !== null && pct >= crit ? ` ${F(P.semantic.err)}${BOLD}!${RESET}` : ""
  return `${F(P.base.muted)}${label.padEnd(labelWidth)}${RESET}${bar} ${bold}${col}${txt.trim()}${RESET}${extra}${bang}`
}

/** Returns the status line as an array of rows. Pure given (payload, ctx). */
export function renderDeck(input, ctx = {}) {
  const P = ctx.palette ?? loadPalette()
  const nowMs = ctx.now ?? Date.now()
  const cols = Math.max(40, (ctx.columns ?? (Number(process.env.COLUMNS) || 120)) - 4)
  const caps = ctx.caps ?? process.env.RICE_CAPS ?? P.caps ?? "powerline"
  const cwd = input?.workspace?.current_dir ?? input?.cwd ?? ""
  const folder = clean(path.basename(String(cwd).replace(/[\\/]+$/, "")) || "~", 32)
  const model = clean(input?.model?.display_name ?? input?.model?.id ?? "Claude", 24)
  const effort = input?.effort?.level
  const fast = input?.fast_mode === true
  const cw = input?.context_window ?? {}
  const ctxPct = clampPct(cw.used_percentage)
  const ctxSize = Number(cw.context_window_size)
  const ctxUsed = Number.isFinite(Number(cw.total_input_tokens)) && Number(cw.total_input_tokens) > 0 ? Number(cw.total_input_tokens)
    : Number.isFinite(ctxSize) && ctxPct !== null ? (ctxSize * ctxPct) / 100 : NaN
  const five = input?.rate_limits?.five_hour, seven = input?.rate_limits?.seven_day
  const cost = input?.cost ?? {}
  // RICE_DEMO_GIT='{"branch":"main","dirty":3,"ahead":1}' forces the git pill for screenshots of a folder that is not a repo.
  const demoGit = (() => { try { return process.env.RICE_DEMO_GIT ? { ahead: 0, behind: 0, dirty: 0, conflicts: 0, ...JSON.parse(process.env.RICE_DEMO_GIT) } : undefined } catch { return undefined } })()
  const git = ctx.git !== undefined ? ctx.git : demoGit !== undefined ? demoGit : gitInfo(String(cwd), { now: nowMs })
  const pr = input?.pr
  const cache = input?.prompt_cache

  const wide = cols >= 112, mid = cols >= 88, narrow = cols >= 64

  // ---- row 1: identity pills ------------------------------------------------------------------
  const buildLeft = (folderMax, drop) => {
    const left = []
    left.push(pill(`✦ ${model}${fast ? " ⚡" : ""}`, P.accent.coral, P.base.bg, caps, true))
    if (effort && !drop.has("effort") && (mid || effort === "max")) left.push(pill(`${effortMeter(effort)} ${effort}`, P.base.raised, effort === "max" ? P.accent.pink : P.accent.coralLight, caps))
    if (folderMax > 0) {
      const name = folder.length > folderMax ? folder.slice(0, Math.max(1, folderMax - 1)) + "…" : folder
      left.push(pill(`${F(P.accent.violet)}⌂${F(P.base.fg)} ${name}`, P.base.raised, P.base.fg, caps))
    }
    if (git?.branch && !drop.has("git")) {
      let g = `${F(P.base.faint)}⎇ ${F(P.accent.pink)}${clean(git.branch, 28)}`
      if (git.dirty) g += ` ${F(P.accent.amber)}✱${git.dirty}`
      if (git.ahead) g += ` ${F(P.accent.mint)}↑${git.ahead}`
      if (git.behind) g += ` ${F(P.accent.coral)}↓${git.behind}`
      if (git.conflicts) g += ` ${F(P.semantic.err)}✖${git.conflicts}`
      left.push(pill(g, P.base.raised, P.base.fg, caps))
    }
    if (pr?.number && mid && !drop.has("pr")) {
      const rs = pr.review_state
      const [icon, color] = rs === "approved" ? ["✓", P.semantic.ok] : rs === "changes_requested" ? ["✖", P.semantic.err] : rs === "draft" ? ["◌", P.base.muted] : ["●", P.semantic.warn]
      left.push(pill(`${F(P.base.muted)}#${pr.number} ${F(color)}${icon}`, P.base.raised, P.base.fg, caps))
    }
    if (input?.agent?.name && wide && !drop.has("agent")) left.push(pill(`${F(P.accent.violet)}◈ ${clean(input.agent.name, 18)}`, P.base.raised, P.base.fg, caps))
    if (input?.vim?.mode && wide && !drop.has("vim")) left.push(pill(clean(input.vim.mode, 12), P.base.raised, P.accent.cyan, caps))
    return left
  }
  // Shrink until it fits: optional pills go first (least important first), then the folder name
  // is cut with an ellipsis, then the folder and git pills go, leaving at least the model.
  const fits = (l) => visibleWidth(l.join(" ")) <= cols
  const steps = [[32, []], [32, ["vim"]], [32, ["vim", "agent"]], [32, ["vim", "agent", "pr"]], [32, ["vim", "agent", "pr", "effort"]], [32, ["vim", "agent", "pr", "effort", "git"]]]
  let left = null
  for (const [fm, dropList] of steps) { left = buildLeft(fm, new Set(dropList)); if (fits(left)) break }
  if (!fits(left)) {
    const drop = new Set(["vim", "agent", "pr", "effort", "git"])
    for (let fm = 24; fm >= 4 && !fits(left); fm -= 2) left = buildLeft(fm, drop)
    if (!fits(left)) left = buildLeft(0, drop)
  }

  const right = []
  const dur = fmtDuration(cost.total_duration_ms)
  if (dur && narrow) right.push(`${F(P.base.faint)}◔ ${F(P.base.muted)}${dur}${RESET}`)
  const added = Number(cost.total_lines_added), removed = Number(cost.total_lines_removed)
  if (wide && (added > 0 || removed > 0)) right.push(`${F(P.accent.mint)}+${Math.round(added || 0)}${RESET} ${F(P.accent.red)}−${Math.round(removed || 0)}${RESET}`)
  const l = left.join(" "), r = right.join("  ")
  const space = cols - visibleWidth(l) - visibleWidth(r)
  const row1 = space >= 2 && r ? `${l}${" ".repeat(space)}${r}` : l

  // ---- row 2: gauges --------------------------------------------------------------------------
  const barCtx = wide ? 16 : mid ? 12 : 8
  const barQ = wide ? 9 : mid ? 7 : 5
  const parts = []
  parts.push(gauge({ label: "ctx", pct: ctxPct, cells: barCtx, P, warn: 70, crit: 88,
    extra: wide && Number.isFinite(ctxUsed) ? ` ${F(P.base.faint)}${fmtTokens(ctxUsed)}/${fmtTokens(ctxSize)}${RESET}` : "" }))
  if (five && clampPct(five.used_percentage) !== null)
    parts.push(gauge({ label: "5h", pct: clampPct(five.used_percentage), cells: barQ, P, warn: 75, crit: 90, extra: mid ? ` ${F(P.base.faint)}↻${fmtReset(five.resets_at, nowMs)}${RESET}` : "" }))
  if (seven && clampPct(seven.used_percentage) !== null)
    parts.push(gauge({ label: "7d", pct: clampPct(seven.used_percentage), cells: barQ, P, warn: 75, crit: 90, extra: mid ? ` ${F(P.base.faint)}↻${fmtReset(seven.resets_at, nowMs)}${RESET}` : "" }))
  if (Number.isFinite(cost.total_cost_usd) && mid) parts.push(`${F(P.accent.amber)}$${cost.total_cost_usd.toFixed(2)}${RESET}`)
  if (cache?.caching_observed && narrow) {
    const exp = Number(cache.expires_at), warm = cache.warm === true && Number.isFinite(exp) && exp * 1000 > nowMs
    const hit = typeof cache.hit_ratio === "number" ? `${Math.round(cache.hit_ratio * 100)}% ` : ""
    const soon = warm && exp * 1000 - nowMs < 60000
    const col = !warm ? P.semantic.err : soon ? P.semantic.warn : P.accent.cyan
    parts.push(`${F(P.base.muted)}cache ${F(P.base.fg)}${hit}${F(col)}${warm ? `◷ ${clock(exp)}` : "◌ cold"}${RESET}`)
  }
  let row2 = parts.join(SEP(P))
  while (visibleWidth(row2) > cols && parts.length > 1) { parts.pop(); row2 = parts.join(SEP(P)) }

  return [row1, row2]
}

// ---------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------
async function readStdin() {
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return Buffer.concat(chunks).toString("utf8")
}

async function main() {
  let rows
  try {
    let input = {}
    try { input = JSON.parse(await readStdin()) } catch { /* render the empty state */ }
    rows = renderDeck(input)
  } catch {
    rows = ["claude"]
  }
  process.stdout.write(rows.join("\n") + "\n")
}

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  await main()
  process.exitCode = 0
}
