# Scene: the REAL Claude Code resuming the synthetic demo session (see tools/make-demo-session.mjs), so the actual
# UI can be photographed with no prompt sent and no usage spent. By default it uses your applied config as it is.
# Set RICE_PREVIEW_SETTINGS=<file> (see tools/preview-claude.mjs) to try the look before applying it.
$ErrorActionPreference = 'Stop'
# A preview launched from inside a Claude Code session must not look like that session's child: it would inherit
# the parent's messaging socket and token and switch off transcript saving. Scrub what Claude Code sets for children.
Get-ChildItem Env: | Where-Object { $_.Name -match '^(CLAUDECODE|CLAUDE_CODE_|CLAUDE_PID|CLAUDE_EFFORT)' } | ForEach-Object { Remove-Item "Env:$($_.Name)" }
$session = (Get-Content "$env:USERPROFILE\.rice\preview\session.txt" -Raw).Trim()
Set-Location "$env:USERPROFILE\Projects\aurora-demo"
$env:COLORTERM = 'truecolor'
$env:RICE_DEMO_GIT = '{"branch":"main","dirty":3,"ahead":1}'   # demo only: the demo folder is not a repo, this shows the git pill
$claudeArgs = @('--no-chrome', '--resume', $session)           # --no-chrome: skip the one-time "Claude in Chrome" prompt
if ($env:RICE_PREVIEW_SETTINGS) { $claudeArgs += @('--settings', $env:RICE_PREVIEW_SETTINGS) }
& "$env:USERPROFILE\.local\bin\claude.exe" @claudeArgs
