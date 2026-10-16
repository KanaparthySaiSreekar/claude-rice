# shot.ps1: open a script in a NEW Windows Terminal window of its own, wait for it to render, capture ONLY that
# window's pixels to a PNG, then close it.
#
#   pwsh -NoProfile -File shot.ps1 -Scene <scene.ps1> -Out <file.png> [-Cols 120 -Rows 34 -Wait 3] [-Profile "<wt profile name>"]
#
# Privacy: the capture uses PrintWindow on that one window, so it can only see what that window itself draws.
# It never copies pixels from the screen, because a screen-region copy also records whatever sits behind the
# window's rounded corners (another window of yours). If PrintWindow returns a black image this script says so
# and stops; it does NOT fall back to a screen capture.
param(
  [Parameter(Mandatory)][string]$Scene,
  [Parameter(Mandatory)][string]$Out,
  [int]$Cols = 120, [int]$Rows = 34, [int]$Wait = 3,
  [string]$Profile = '',
  [int]$X = 60, [int]$Y = 40
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class Cap {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr h);
  [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr h, IntPtr dc);
  [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr dc);
  [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleBitmap(IntPtr dc, int w, int h);
  [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr dc, IntPtr obj);
  [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr dc);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  public static long[] Terminals() {
    var list = new List<long>();
    EnumWindows((h, l) => { var c = new StringBuilder(256); GetClassName(h, c, 256);
      if (c.ToString() == "CASCADIA_HOSTING_WINDOW_CLASS" && IsWindowVisible(h)) list.Add(h.ToInt64()); return true; }, IntPtr.Zero);
    return list.ToArray();
  }
  public static void Close(long h) { PostMessage(new IntPtr(h), 0x0010, IntPtr.Zero, IntPtr.Zero); }
  // PrintWindow (PW_RENDERFULLCONTENT) of just this window. The screen DC is only used to create a bitmap of the right format.
  public static IntPtr Grab(long h, out int w, out int hh) {
    RECT r; GetWindowRect(new IntPtr(h), out r); w = r.R - r.L; hh = r.B - r.T;
    IntPtr screen = GetDC(IntPtr.Zero); IntPtr mem = CreateCompatibleDC(screen); IntPtr bmp = CreateCompatibleBitmap(screen, w, hh); SelectObject(mem, bmp);
    PrintWindow(new IntPtr(h), mem, 2);
    DeleteDC(mem); ReleaseDC(IntPtr.Zero, screen); return bmp;
  }
}
'@

function Save-Shot([long]$hwnd, [string]$path) {
  $w = 0; $h = 0
  $hbm = [Cap]::Grab($hwnd, [ref]$w, [ref]$h)
  $img = [System.Drawing.Image]::FromHbitmap($hbm)
  $bmp = New-Object System.Drawing.Bitmap $img
  $sum = 0.0; $n = 0
  for ($y = 3; $y -lt $h; $y += 9) { for ($x = 3; $x -lt $w; $x += 9) { $p = $bmp.GetPixel($x, $y); $sum += ($p.R + $p.G + $p.B) / 3.0; $n++ } }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); $img.Dispose()
  [pscustomobject]@{ Width = $w; Height = $h; Brightness = $sum / [Math]::Max(1, $n) }
}

# Claude Code's tool shells set NO_COLOR=1, and wt.exe hands the caller's environment to the new tab, which makes
# PowerShell strip every colour code. Clear it so the preview matches a real terminal.
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
$env:COLORTERM = 'truecolor'
# Without this Windows reports a 125%-scaled window as 80% of its real size and the capture is cropped.
[void][Cap]::SetProcessDPIAware()

$before = [Cap]::Terminals()
$wtArgs = @('-w', "ricepreview$PID", '--pos', "$X,$Y", '--size', "$Cols,$Rows")
if ($Profile) { $wtArgs += @('new-tab', '-p', $Profile) } else { $wtArgs += 'new-tab' }
$wtArgs += @('--title', 'ricepreview', 'pwsh', '-NoLogo', '-NoProfile', '-File', $Scene)
Start-Process wt.exe -ArgumentList $wtArgs
$new = $null
for ($i = 0; $i -lt 60 -and -not $new; $i++) { Start-Sleep -Milliseconds 250; $new = [Cap]::Terminals() | Where-Object { $_ -notin $before } | Select-Object -First 1 }
if (-not $new) { throw 'preview window never appeared' }
Start-Sleep -Seconds $Wait
$r = Save-Shot $new $Out
"{0}x{1}  mean brightness {2:N1}  ->  {3}" -f $r.Width, $r.Height, $r.Brightness, $Out
[Cap]::Close($new)
if ($r.Brightness -lt 2) { throw 'PrintWindow returned a black image. Not falling back to a screen capture (it would also record what is behind the window).' }
