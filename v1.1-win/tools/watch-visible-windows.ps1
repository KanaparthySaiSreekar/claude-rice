param([int]$Seconds = 1000, [string]$Log)
# Logs every NEW *visible* top-level window that looks like a console/terminal popup, with owner process + parent chain.
Add-Type -TypeDefinition @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class Win {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern int GetWindowThreadProcessId(IntPtr h, out int pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
  public class Info { public long H; public int Pid; public string Cls; public string Title; public int W; public int Ht; }
  public static List<Info> Visible() {
    var list = new List<Info>();
    EnumWindows((h, l) => {
      if (!IsWindowVisible(h)) return true;
      var c = new StringBuilder(256); GetClassName(h, c, 256);
      var t = new StringBuilder(256); GetWindowText(h, t, 256);
      int pid; GetWindowThreadProcessId(h, out pid);
      RECT r; GetWindowRect(h, out r);
      list.Add(new Info { H = h.ToInt64(), Pid = pid, Cls = c.ToString(), Title = t.ToString(), W = r.R - r.L, Ht = r.B - r.T });
      return true;
    }, IntPtr.Zero);
    return list;
  }
}
'@
function Chain($procId) {
  $out = @(); $pp = $procId; $d = 0
  while ($pp -and $d -lt 6) {
    $q = Get-CimInstance Win32_Process -Filter "ProcessId=$pp" -ErrorAction SilentlyContinue
    if (-not $q) { $out += "?($pp gone)"; break }
    $out += "$($q.Name)($pp)"; $pp = $q.ParentProcessId; $d++
  }
  $out -join ' <- '
}
$seen = @{}
foreach ($w in [Win]::Visible()) { $seen[$w.H] = $true }
$end = (Get-Date).AddSeconds($Seconds)
"[{0}] visible-window watcher started, {1} existing visible windows ignored" -f (Get-Date -f 'HH:mm:ss.fff'), $seen.Count | Out-File $Log -Append
while ((Get-Date) -lt $end) {
  foreach ($w in [Win]::Visible()) {
    if ($seen.ContainsKey($w.H)) { continue }
    $seen[$w.H] = $true
    if ($w.Cls -in 'IME','MSCTFIME UI','GDI+ Hook Window Class','SysShadow') { continue }
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($w.Pid)" -ErrorAction SilentlyContinue
    $pn = if ($proc) { $proc.Name } else { 'exited' }
    $cmd = if ($proc) { ("$($proc.CommandLine)" -replace '\s+',' ') } else { '' }
    if ($cmd.Length -gt 200) { $cmd = $cmd.Substring(0,200) + '...' }
    "[{0}] VISIBLE class={1} title='{2}' size={3}x{4} owner={5}({6})`n        chain: {7}`n        cmd: {8}" -f (Get-Date -f 'HH:mm:ss.fff'), $w.Cls, $w.Title, $w.W, $w.Ht, $pn, $w.Pid, (Chain $w.Pid), $cmd | Out-File $Log -Append
  }
  Start-Sleep -Milliseconds 100
}
"[{0}] visible-window watcher finished" -f (Get-Date -f 'HH:mm:ss.fff') | Out-File $Log -Append
