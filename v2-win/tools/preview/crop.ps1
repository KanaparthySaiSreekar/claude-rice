# crop.ps1: crop a region out of one or more PNGs, scale it up, and stack the results vertically with labels.
#   pwsh -NoProfile -File crop.ps1 -Out out.png -X 40 -Y 370 -W 600 -H 110 -Scale 2 -Images a.png,b.png -Labels shader,no-shader
param([Parameter(Mandatory)][string]$Out, [int]$X, [int]$Y, [int]$W, [int]$H, [double]$Scale = 2,
      [Parameter(Mandatory)][string[]]$Images, [string[]]$Labels = @())
Add-Type -AssemblyName System.Drawing
$tw = [int]($W * $Scale); $th = [int]($H * $Scale); $gap = 22
$canvas = New-Object System.Drawing.Bitmap $tw, (($th + $gap) * $Images.Count)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::FromArgb(20, 20, 20))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$font = New-Object System.Drawing.Font 'Segoe UI', 9
for ($i = 0; $i -lt $Images.Count; $i++) {
  $img = [System.Drawing.Image]::FromFile($Images[$i])
  $top = $i * ($th + $gap)
  $g.DrawString($(if ($Labels.Count -gt $i) { $Labels[$i] } else { Split-Path $Images[$i] -Leaf }), $font, [System.Drawing.Brushes]::White, 4, $top + 3)
  $dest = New-Object System.Drawing.Rectangle 0, ($top + $gap), $tw, $th
  $g.DrawImage($img, $dest, $X, $Y, $W, $H, [System.Drawing.GraphicsUnit]::Pixel)
  $img.Dispose()
}
$canvas.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $canvas.Dispose()
"wrote $Out"
