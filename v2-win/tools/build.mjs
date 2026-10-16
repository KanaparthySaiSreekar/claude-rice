// build.mjs: turn one palette into every config the rice needs. Pure functions (testable) plus
// a writer. Nothing here touches your live config: `rice.mjs apply` does that, with backups.
import fs from "node:fs"
import path from "node:path"
import { parseHex, toHex } from "./lib/color.mjs"
import { renderAurora } from "../art/aurora-art.mjs"

const j = (o) => JSON.stringify(o, null, 2) + "\n"
const rgbStr = (hex) => parseHex(hex).join(";")

// ---------------------------------------------------------------------------------------------
// Windows Terminal
// ---------------------------------------------------------------------------------------------
export function wtScheme(p) {
  const a = p.ansi
  return {
    name: p.label,
    background: p.base.bg, foreground: p.base.fg, cursorColor: p.accent.coral, selectionBackground: p.base.selection,
    black: a.black, red: a.red, green: a.green, yellow: a.yellow, blue: a.blue, purple: a.purple, cyan: a.cyan, white: a.white,
    brightBlack: a.brightBlack, brightRed: a.brightRed, brightGreen: a.brightGreen, brightYellow: a.brightYellow,
    brightBlue: a.brightBlue, brightPurple: a.brightPurple, brightCyan: a.brightCyan, brightWhite: a.brightWhite,
  }
}

export function wtTheme(p) {
  return {
    name: p.label,
    // Tried: Mica, a transparent tab row, and the art behind the tabs (experimental.useBackgroundImageForWindow).
    // Windows Terminal drew the tab row opaque in every case, so the tab row simply follows the terminal colour.
    window: { applicationTheme: "dark", useMica: false, frame: p.accent.coral, unfocusedFrame: p.base.line },
    tabRow: { background: "terminalBackground", unfocusedBackground: p.base.surface },
    tab: { background: "terminalBackground", unfocusedBackground: p.base.surface, showCloseButton: "hover" },
  }
}

/** `assets` = absolute directory holding art/bg.png and shaders/glow.hlsl for this palette. */
export function wtProfileDefaults(p, assets, opts = {}) {
  const win = (rel) => path.win32.join(assets, rel)
  const d = {
    colorScheme: p.label,
    antialiasingMode: "grayscale",
    padding: "18, 12, 18, 12",
    tabColor: p.accent.coral,
    cursorShape: "bar",
    useAcrylic: false,
    opacity: 100,
    "experimental.useBackgroundImageForWindow": false,
    font: { face: "JetBrainsMono NFM", size: 11, weight: "medium", features: { calt: 1, liga: 1 } },
  }
  // a palette with `art: null` is a plain colour: no picture behind the text
  if (p.art) Object.assign(d, {
    backgroundImage: win("art\\bg.png"),
    backgroundImageOpacity: opts.imageOpacity ?? 0.42,
    backgroundImageStretchMode: "uniformToFill",
    backgroundImageAlignment: "center",
  })
  if (opts.shader !== false) d["experimental.pixelShaderPath"] = win("shaders\\glow.hlsl")
  return d
}

// ---------------------------------------------------------------------------------------------
// Claude Code theme (the 62 override tokens a custom theme can set)
// ---------------------------------------------------------------------------------------------
export function claudeTheme(p) {
  const a = p.accent, b = p.base, an = p.ansi
  const indigo = p.between(a.blue, a.violet, 0.5)
  return {
    name: p.label,
    base: "dark",
    overrides: {
      claude: a.coral, claudeShimmer: a.coralLight,
      text: b.fg, inverseText: b.bg,
      inactive: b.muted, inactiveShimmer: p.lighter(b.muted, 0.18),
      subtle: b.dim,
      suggestion: a.blue, permission: a.blue, permissionShimmer: an.brightBlue, remember: a.violet,
      success: a.mint, error: a.red, warning: a.amber, warningShimmer: an.brightYellow, merged: a.violet,
      promptBorder: a.violet, promptBorderShimmer: a.pink, planMode: a.cyan, autoAccept: an.brightPurple,
      bashBorder: a.pink, ide: a.blue, fastMode: a.amber, fastModeShimmer: an.brightYellow, effortUltra: an.brightPurple,
      diffAdded: p.diff.added, diffRemoved: p.diff.removed, diffAddedDimmed: p.diff.addedDimmed, diffRemovedDimmed: p.diff.removedDimmed,
      diffAddedWord: p.diff.addedWord, diffRemovedWord: p.diff.removedWord,
      userMessageBackground: b.raised, userMessageBackgroundHover: b.hover,
      bashMessageBackgroundColor: b.surface, memoryBackgroundColor: p.tint(a.violet, 0.14), selectionBg: b.selection,
      rate_limit_fill: a.pink, rate_limit_empty: b.line,
      briefLabelYou: a.cyan, briefLabelClaude: a.coral,
      // tokens the docs leave out, found in the theme table inside Claude Code itself
      composerSidebarBackground: b.surface,        // the flightdeck / side-pane fill (neutral #262626 in the stock dark theme)
      background: a.cyan, skill: a.violet, autoAcceptShimmer: p.lighter(an.brightPurple, 0.2),
      claudeBlue_FOR_SYSTEM_SPINNER: a.blue, claudeBlueShimmer_FOR_SYSTEM_SPINNER: an.brightBlue,
      professionalBlue: a.blue, chromeYellow: a.amber,
      clawd_body: a.coral, clawd_background: b.bg,
      red_FOR_SUBAGENTS_ONLY: a.red, blue_FOR_SUBAGENTS_ONLY: a.blue, green_FOR_SUBAGENTS_ONLY: a.mint, yellow_FOR_SUBAGENTS_ONLY: a.amber,
      purple_FOR_SUBAGENTS_ONLY: a.violet, orange_FOR_SUBAGENTS_ONLY: a.coral, pink_FOR_SUBAGENTS_ONLY: a.pink, cyan_FOR_SUBAGENTS_ONLY: a.cyan,
      rainbow_red: a.red, rainbow_red_shimmer: an.brightRed,
      rainbow_orange: a.coral, rainbow_orange_shimmer: a.coralLight,
      rainbow_yellow: a.amber, rainbow_yellow_shimmer: an.brightYellow,
      rainbow_green: a.mint, rainbow_green_shimmer: an.brightGreen,
      rainbow_blue: a.blue, rainbow_blue_shimmer: an.brightBlue,
      rainbow_indigo: indigo, rainbow_indigo_shimmer: p.lighter(indigo, 0.2),
      rainbow_violet: a.violet, rainbow_violet_shimmer: an.brightPurple,
    },
  }
}

// ---------------------------------------------------------------------------------------------
// skins mod: one custom skin (the 15 palette slots) plus the settings that go with it
// ---------------------------------------------------------------------------------------------
export function skin(p) {
  const t = p.tool
  return {
    name: p.key === "aurora" ? "claude-aurora" : `claude-${p.key}`,
    base: "noir",
    palette: {
      user: p.accent.coral, fg: p.base.fg, muted: p.base.muted, surface: p.base.raised, zebra: p.base.surface,
      ok: p.semantic.ok, err: p.semantic.err, warn: p.semantic.warn,
      read: t.read, write: t.write, run: t.run, search: t.search, web: t.web, mcp: t.mcp, other: t.other,
    },
    spinner: ["Pondering", "Noodling", "Cogitating", "Percolating", "Ruminating", "Untangling", "Spelunking", "Sketching"],
    done: ["Pondered", "Noodled", "Cogitated", "Percolated", "Untangled", "Sketched"],
    settings: { rail: true, band: false, shimmer: true, tables: "on", icons: "unicode", markdown: true, quiet: false, charts: true },
  }
}

// ---------------------------------------------------------------------------------------------
// aurora-bridge mod: the colours it draws with, as the JSON its `palette` option takes
// ---------------------------------------------------------------------------------------------
export function bridgePalette(p) {
  const b = p.base, a = p.accent
  return {
    bg: b.bg, surface: b.surface, raised: b.raised, line: b.line, dim: b.dim, faint: b.faint, muted: b.muted, fg: b.fg,
    ok: p.semantic.ok, warn: p.semantic.warn, err: p.semantic.err, coral: a.coral,
    ramp: p.ramp,
    tool: { ...p.tool, agent: p.tool.agent ?? a.coralLight },
  }
}

// ---------------------------------------------------------------------------------------------
// Rio (the optional pixel terminal)
// ---------------------------------------------------------------------------------------------
export function rioConfig(p, pwshPath) {
  const a = p.ansi
  return `# Rio, the optional "pixel" terminal. Windows Terminal stays the daily driver.
# Colours generated from the "${p.label}" palette so both terminals match.

# Claude Code only sends real pictures to terminals it recognises by name, and Rio is not one yet.
# Forced on HERE ONLY: in a terminal without kitty-graphics support this prints stray characters.
env-vars = ["CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1"]

[shell]
program = ${JSON.stringify(pwshPath)}
args = []

[fonts]
size = 14
family = "JetBrainsMono NFM"

[colors]
background = "${p.base.bg}"
foreground = "${p.base.fg}"
cursor = "${p.accent.coral}"
selection-background = "${p.base.selection}"
selection-foreground = "${p.base.fg}"
black = "${a.black}"
red = "${a.red}"
green = "${a.green}"
yellow = "${a.yellow}"
blue = "${a.blue}"
magenta = "${a.purple}"
cyan = "${a.cyan}"
white = "${a.white}"
light-black = "${a.brightBlack}"
light-red = "${a.brightRed}"
light-green = "${a.brightGreen}"
light-yellow = "${a.brightYellow}"
light-blue = "${a.brightBlue}"
light-magenta = "${a.brightPurple}"
light-cyan = "${a.brightCyan}"
light-white = "${a.brightWhite}"
`
}

// ---------------------------------------------------------------------------------------------
// What the runtime status line needs (read at every refresh, so a palette switch needs no restart)
// ---------------------------------------------------------------------------------------------
export function statusPalette(p) {
  return { key: p.key, label: p.label, base: p.base, accent: p.accent, ramp: p.ramp, semantic: p.semantic }
}

// ---------------------------------------------------------------------------------------------
// PowerShell profile: the user's options and key bindings, recoloured, with a faster, richer prompt
// ---------------------------------------------------------------------------------------------
export function powershellProfile(p) {
  const a = p.accent
  return `# ============================================================
#  PowerShell 7 profile, generated by the rice (palette: ${p.label})
#  100% native: PSReadLine only, no modules, no prompt framework.
#  Regenerate with:  node tools/rice.mjs build ${p.key}   (then apply)
# ============================================================

# --- History (native PSReadLine) ---
Set-PSReadLineOption -EditMode Windows
Set-PSReadLineOption -HistoryNoDuplicates
Set-PSReadLineOption -MaximumHistoryCount 10000
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineOption -BellStyle None

if (-not [Console]::IsOutputRedirected) {
    Set-PSReadLineOption -PredictionSource History
    Set-PSReadLineOption -PredictionViewStyle ListView
}

# Keys
Set-PSReadLineKeyHandler -Key UpArrow    -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow  -Function HistorySearchForward
Set-PSReadLineKeyHandler -Key Tab        -Function MenuComplete
Set-PSReadLineKeyHandler -Key RightArrow -Function ForwardWord
Set-PSReadLineKeyHandler -Key Ctrl+z     -Function Undo

# --- Syntax highlight colours (${p.label}) ---
Set-PSReadLineOption -Colors @{
    Command                = "${a.coral}"
    Parameter              = "${a.coralLight}"
    String                 = "${a.mint}"
    Number                 = "${a.amber}"
    Operator               = "${a.pink}"
    Variable               = "${p.base.fg}"
    Comment                = "${p.base.faint}"
    InlinePrediction       = "${p.base.line}"
    ListPrediction         = "${a.coral}"
    ListPredictionSelected = "${p.base.hover}"
}

# --- Prompt: folder, git branch (read from .git/HEAD, no git process), arrow that shows the last result ---
function prompt {
    $ok   = $?
    $esc  = [char]27
    $path = $PWD.Path
    if ($path.StartsWith($HOME, [StringComparison]::OrdinalIgnoreCase)) { $path = '~' + $path.Substring($HOME.Length) }

    # branch: walk up to the nearest .git and read HEAD (cheap, and nothing in the repo can run)
    $branch = ''
    try {
        $dir = $PWD.Path
        for ($i = 0; $i -lt 40 -and $dir; $i++) {
            $dotGit = Join-Path $dir '.git'
            if ([IO.Directory]::Exists($dotGit)) { $head = [IO.File]::ReadAllText((Join-Path $dotGit 'HEAD')); break }
            if ([IO.File]::Exists($dotGit)) {
                $m = [regex]::Match([IO.File]::ReadAllText($dotGit), 'gitdir:\\s*(.+)')
                if ($m.Success) { $head = [IO.File]::ReadAllText((Join-Path (Join-Path $dir $m.Groups[1].Value.Trim()) 'HEAD')) }
                break
            }
            $dir = [IO.Path]::GetDirectoryName($dir)
        }
        if ($head -match 'ref:\\s*refs/heads/(.+)') { $branch = $Matches[1].Trim() }
    } catch { }

    $violet = "$esc[38;2;${rgbStr(a.violet)}m"
    $pink   = "$esc[38;2;${rgbStr(a.pink)}m"
    $faint  = "$esc[38;2;${rgbStr(p.base.faint)}m"
    $arrow  = if ($ok) { "$esc[38;2;${rgbStr(a.coral)}m" } else { "$esc[38;2;${rgbStr(a.red)}m" }
    $reset  = "$esc[0m"
    $git    = if ($branch) { " $faint\`u{2387} $pink$branch" } else { '' }
    "\`n$violet $path$git $arrow\`u{276F}$reset "
}

# ============================================================
#  Pretty ls: Nerd Font icons, colour by type, folders first.
#  Needs the JetBrainsMono NFM font. (gci / dir still give raw objects.)
# ============================================================
# Built-in \`ls\` is an ALIAS (aliases outrank functions), so drop it.
Remove-Item Alias:ls -Force -ErrorAction SilentlyContinue

function ls {
    param([string]$Path = '.')

    $items = Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue |
             Sort-Object @{ Expression = { -not $_.PSIsContainer } }, Name
    if (-not $items) { return }

    $esc = [char]27
    $reset = "$esc[0m"

    $cells = foreach ($i in $items) {
        if ($i.PSIsContainer) {
            $icon = "\`u{f07b}"; $rgb = '${rgbStr(a.coral)}'                                   # folder
        } else {
            switch -Regex ($i.Extension.ToLower()) {
                '\\.(ps1|psm1|psd1|sh|bat|cmd)$'                                         { $icon="\`u{f1c9}"; $rgb='${rgbStr(a.amber)}'; break }   # script
                '\\.(py|js|mjs|ts|jsx|tsx|c|cpp|h|cs|go|rs|java|rb|php|lua|html|css)$'   { $icon="\`u{f1c9}"; $rgb='${rgbStr(a.coralLight)}'; break } # code
                '\\.(json|ya?ml|toml|xml|ini|cfg|conf|env)$'                             { $icon="\`u{f1c9}"; $rgb='${rgbStr(a.cyan)}'; break }    # config
                '\\.(md|markdown|rst|txt|log|nfo)$'                                      { $icon="\`u{f15c}"; $rgb='${rgbStr(p.base.muted)}'; break } # text
                '\\.(pdf|docx?|odt|rtf)$'                                                { $icon="\`u{f1c1}"; $rgb='${rgbStr(a.red)}'; break }     # docs
                '\\.(xlsx?|csv|ods)$'                                                    { $icon="\`u{f1c3}"; $rgb='${rgbStr(a.mint)}'; break }    # sheets
                '\\.(pptx?|odp)$'                                                        { $icon="\`u{f1c4}"; $rgb='${rgbStr(a.coral)}'; break }   # slides
                '\\.(png|jpe?g|gif|bmp|webp|svg|ico|tiff?)$'                             { $icon="\`u{f1c5}"; $rgb='${rgbStr(a.violet)}'; break }  # images
                '\\.(mp4|mkv|avi|mov|webm|flv|wmv)$'                                     { $icon="\`u{f1c8}"; $rgb='${rgbStr(a.pink)}'; break }    # video
                '\\.(mp3|wav|flac|ogg|m4a|aac)$'                                         { $icon="\`u{f1c7}"; $rgb='${rgbStr(a.blue)}'; break }    # audio
                '\\.(zip|rar|7z|tar|gz|xz|bz2)$'                                         { $icon="\`u{f1c6}"; $rgb='${rgbStr(p.darker(a.amber, 0.2))}';  break } # archives
                '\\.(exe|msi|com|appx)$'                                                 { $icon="\`u{f013}"; $rgb='${rgbStr(a.red)}'; break }     # executables
                default                                                                  { $icon="\`u{f15b}"; $rgb='${rgbStr(p.base.muted)}' }     # other
            }
        }
        [pscustomobject]@{ Icon = $icon; Name = $i.Name; Rgb = $rgb; Vis = $i.Name.Length + 2 }
    }

    $colW  = (($cells.Vis | Measure-Object -Maximum).Maximum) + 2
    $width = $Host.UI.RawUI.WindowSize.Width; if (-not $width -or $width -lt 20) { $width = 120 }
    $cols  = [Math]::Max(1, [Math]::Floor($width / $colW))
    $rows  = [Math]::Ceiling($cells.Count / $cols)

    for ($r = 0; $r -lt $rows; $r++) {
        $line = ''
        for ($c = 0; $c -lt $cols; $c++) {
            $idx = $r + $c * $rows
            if ($idx -ge $cells.Count) { continue }
            $x   = $cells[$idx]
            $pad = ' ' * ($colW - $x.Vis)
            $line += "$esc[38;2;$($x.Rgb)m$($x.Icon) $($x.Name)$reset$pad"
        }
        Write-Host $line
    }
}
`
}

// ---------------------------------------------------------------------------------------------
// the writer
// ---------------------------------------------------------------------------------------------
export function writeBuild(p, outDir, { assetsDir, pwshPath, art = Boolean(p.art), repoRoot }) {
  const w = (rel, text) => { const f = path.join(outDir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); return f }
  const out = {}
  out.scheme = w("wt/scheme.json", j(wtScheme(p)))
  out.theme = w("wt/theme.json", j(wtTheme(p)))
  out.profile = w("wt/profile-defaults.json", j(wtProfileDefaults(p, assetsDir)))
  out.claudeTheme = w("claude/theme.json", j(claudeTheme(p)))
  out.skin = w("skins/skin.json", j(skin(p)))
  out.rio = w("rio/config.toml", rioConfig(p, pwshPath))
  out.status = w("statusline/palette.json", j(statusPalette(p)))
  out.profilePs1 = w("powershell/profile.ps1", powershellProfile(p))
  fs.mkdirSync(path.join(outDir, "shaders"), { recursive: true })
  fs.copyFileSync(path.join(repoRoot, "shaders", "glow.hlsl"), path.join(outDir, "shaders", "glow.hlsl"))
  if (art) {
    fs.mkdirSync(path.join(outDir, "art"), { recursive: true })
    out.art = path.join(outDir, "art", "bg.png")
    fs.writeFileSync(out.art, renderAurora({ width: 2560, height: 1440, base: p.base.bg, rampStops: p.ramp, ...p.art }))
  }
  return out
}
