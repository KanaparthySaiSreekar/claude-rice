# Scene: the status line deck in four situations (mid-session, fresh, limits nearly spent, session start).
# Run it through shot.ps1:  pwsh -NoProfile -File tools/preview/shot.ps1 -Scene tools/preview/scene-deck.ps1 -Out deck.png -Cols 132 -Rows 17
$ErrorActionPreference = 'Stop'
$deck = Join-Path $PSScriptRoot '..\..\statusline\aurora-deck.mjs'
$maker = Join-Path $PSScriptRoot 'mkpayload.mjs'
$env:COLUMNS = [string]$Host.UI.RawUI.WindowSize.Width
function Show($variant, $title) {
  $payload = Join-Path $env:TEMP "rice-payload-$variant.json"
  & node $maker $payload $variant
  Write-Host ("`e[38;2;158;148;138m  -- {0} --`e[0m" -f $title)
  Get-Content -Raw $payload | & node $deck
}
Write-Host ''
Show 'full'  'mid-session'
Write-Host ''
Show 'calm'  'fresh session'
Write-Host ''
Show 'hot'   'limits nearly spent'
Write-Host ''
Show 'start' 'session start (no data yet)'
Start-Sleep -Seconds 14
