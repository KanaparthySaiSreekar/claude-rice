# ============================================================
#  PowerShell 7 profile - 100% native (PSReadLine ships with PS7)
#  Theme: CLAUDE  (orange #D97757 / cream #F5E6D3 / coral #F28482
#                  / gold #FFD166 on warm-dark #141413)
#  No external modules. No oh-my-posh. Fast startup.
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

# --- Syntax highlight colours (Claude palette) ---
Set-PSReadLineOption -Colors @{
    Command                = "#D97757"   # Claude orange
    Parameter              = "#FFB38A"   # light orange
    String                 = "#A3B18A"   # sage
    Number                 = "#FFD166"   # gold
    Operator               = "#F28482"   # coral
    Variable               = "#F5E6D3"   # cream
    Comment                = "#6B655C"   # warm gray
    InlinePrediction       = "#5A534A"
    ListPrediction         = "#D97757"
    ListPredictionSelected = "#3E3833"
}

# --- Prompt: light-brown path + coral-red arrow ---
function prompt {
    $esc   = [char]27
    $brown = "$esc[38;2;196;164;132m"   # light brown  -> path
    $red   = "$esc[38;2;242;132;130m"   # Claude coral -> arrow
    $reset = "$esc[0m"
    $path  = $PWD.Path.Replace($HOME, '~')
    "`n$brown $path $red»$reset "
}

# ============================================================
#  Pretty ls - Nerd Font icons + Claude-themed colour by type
#  Folders first, column grid. Needs JetBrainsMono NFM font.
#  (raw Get-ChildItem still available as gci / dir for piping)
# ============================================================
# Built-in `ls` is an ALIAS (aliases outrank functions), so drop it.
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
            $icon = "`u{f07b}"; $rgb = '217;119;87'                        # folder   Claude orange
        } else {
            switch -Regex ($i.Extension.ToLower()) {
                '\.(ps1|psm1|psd1|sh|bat|cmd)$'                            { $icon="`u{f1c9}"; $rgb='255;209;102'; break } # script  gold
                '\.(py|js|mjs|ts|jsx|tsx|c|cpp|h|cs|go|rs|java|rb|php|lua|html|css)$' { $icon="`u{f1c9}"; $rgb='255;179;138'; break } # code    light orange
                '\.(json|ya?ml|toml|xml|ini|cfg|conf|env)$'               { $icon="`u{f1c9}"; $rgb='201;183;124'; break } # config  khaki
                '\.(md|markdown|rst|txt|log|nfo)$'                        { $icon="`u{f15c}"; $rgb='196;164;132'; break } # text    tan
                '\.(pdf|docx?|odt|rtf)$'                                  { $icon="`u{f1c1}"; $rgb='242;132;130'; break } # docs    coral
                '\.(xlsx?|csv|ods)$'                                      { $icon="`u{f1c3}"; $rgb='163;177;138'; break } # sheet   sage
                '\.(pptx?|odp)$'                                          { $icon="`u{f1c4}"; $rgb='230;149;111'; break } # slides  burnt orange
                '\.(png|jpe?g|gif|bmp|webp|svg|ico|tiff?)$'               { $icon="`u{f1c5}"; $rgb='180;142;173'; break } # image   mauve
                '\.(mp4|mkv|avi|mov|webm|flv|wmv)$'                       { $icon="`u{f1c8}"; $rgb='201;160;220'; break } # video   soft purple
                '\.(mp3|wav|flac|ogg|m4a|aac)$'                           { $icon="`u{f1c7}"; $rgb='148;197;204'; break } # audio   teal
                '\.(zip|rar|7z|tar|gz|xz|bz2)$'                           { $icon="`u{f1c6}"; $rgb='192;133;82';  break } # archive brown
                '\.(exe|msi|com|appx)$'                                   { $icon="`u{f013}"; $rgb='242;132;130'; break } # exe     coral
                default                                                   { $icon="`u{f15b}"; $rgb='168;155;135' }         # file    taupe
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
