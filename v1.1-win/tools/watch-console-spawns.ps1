param([int]$Seconds = 1000, [string]$Log)
# Logs every NEW process that owns/creates a console window (cmd, conhost, powershell, pwsh, wscript, cscript, node, bash, git),
# plus its parent chain, so a flashing window can be traced to whatever launched it.
$names = 'cmd','powershell','pwsh','wscript','cscript','conhost','node','bash','sh','git','taskkill','reg','where','chcp'
$seen = @{}
Get-Process | ForEach-Object { $seen[$_.Id] = $true }
$end = (Get-Date).AddSeconds($Seconds)
"[{0}] watcher started, pid {1}, {2}s" -f (Get-Date -f 'HH:mm:ss.fff'), $PID, $Seconds | Out-File $Log -Append
while ((Get-Date) -lt $end) {
  foreach ($n in $names) {
    foreach ($p in [System.Diagnostics.Process]::GetProcessesByName($n)) {
      if ($seen.ContainsKey($p.Id)) { continue }
      $seen[$p.Id] = $true
      try {
        $w = Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" -ErrorAction Stop
        $chain = @(); $pp = $w.ParentProcessId; $depth = 0
        while ($pp -and $depth -lt 5) {
          $q = Get-CimInstance Win32_Process -Filter "ProcessId=$pp" -ErrorAction SilentlyContinue
          if (-not $q) { $chain += "?($pp gone)"; break }
          $chain += "$($q.Name)($pp)"; $pp = $q.ParentProcessId; $depth++
        }
        $cl = ("$($w.CommandLine)" -replace '\s+',' ')
        if ($cl.Length -gt 260) { $cl = $cl.Substring(0,260) + '...' }
        "[{0}] NEW {1} pid={2} chain={3}`n        cmd: {4}" -f (Get-Date -f 'HH:mm:ss.fff'), $w.Name, $p.Id, ($chain -join ' <- '), $cl | Out-File $Log -Append
      } catch {
        "[{0}] NEW {1} pid={2} (exited before inspection)" -f (Get-Date -f 'HH:mm:ss.fff'), $n, $p.Id | Out-File $Log -Append
      }
    }
  }
  Start-Sleep -Milliseconds 120
}
"[{0}] watcher finished" -f (Get-Date -f 'HH:mm:ss.fff') | Out-File $Log -Append
