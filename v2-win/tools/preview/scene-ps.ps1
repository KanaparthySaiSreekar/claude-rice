# Scene: the generated PowerShell profile's prompt and icon `ls`. Run it through shot.ps1.
$ErrorActionPreference = 'Continue'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$profileFile = @("$env:USERPROFILE\.rice\current\powershell\profile.ps1", "$env:USERPROFILE\.rice\builds\aurora\powershell\profile.ps1") | Where-Object { Test-Path $_ } | Select-Object -First 1
. $profileFile
Set-Location $repo
Write-Host (prompt) -NoNewline; Write-Host 'ls v2-win'
ls 'v2-win'
Write-Host (prompt) -NoNewline; Write-Host 'git status -sb'
git -c color.ui=always status -sb | Select-Object -First 4
Set-Location "$env:USERPROFILE\Downloads"
Write-Host (prompt) -NoNewline; Write-Host '_'
Start-Sleep -Seconds 12
