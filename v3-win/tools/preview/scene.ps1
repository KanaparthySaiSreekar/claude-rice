# Scene: the REAL Claude Code resuming a synthetic demo session, for v2-win/tools/preview/shot.ps1 to photograph.
# Like v2's scene-claude.ps1, but the session and the settings come from the environment, so every version (v3 to v6) can use it:
#   RICE_PREVIEW_SESSION   path of the file holding the session id (tools/demo-session.mjs writes it)
#   RICE_PREVIEW_SETTINGS  the --settings file (tools/rice.mjs preview <palette> writes it); the live settings.json is not changed
$ErrorActionPreference = 'Stop'
# A preview launched from inside a Claude Code session must not look like that session's child: it would inherit the
# parent's messaging socket and token and switch off transcript saving. Scrub what Claude Code sets for children.
Get-ChildItem Env: | Where-Object { $_.Name -match '^(CLAUDECODE|CLAUDE_CODE_|CLAUDE_PID|CLAUDE_EFFORT)' } | ForEach-Object { Remove-Item "Env:$($_.Name)" }
$session = (Get-Content $env:RICE_PREVIEW_SESSION -Raw).Trim()
Set-Location "$env:USERPROFILE\Projects\aurora-demo"
$env:COLORTERM = 'truecolor'
$env:RICE_DEMO_GIT = '{"branch":"main","dirty":1,"ahead":1}'   # demo only: the demo folder is not a repo, this shows the git pill
$claudeArgs = @('--no-chrome', '--resume', $session)
if ($env:RICE_PREVIEW_SETTINGS) { $claudeArgs += @('--settings', $env:RICE_PREVIEW_SETTINGS) }
& "$env:USERPROFILE\.local\bin\claude.exe" @claudeArgs
