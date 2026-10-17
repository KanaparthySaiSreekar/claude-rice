# setup-rio.ps1 — copy a newer ConPTY into Rio. The copy needs an ELEVATED PowerShell (Run as administrator).
#
# Gives Rio a newer ConPTY (conpty.dll + OpenConsole.exe) so kitty-graphics pictures survive the Windows
# console layer. Both files are required: with conpty.dll alone Rio falls back to the built-in console host,
# which strips the pictures. See https://rioterm.com/docs/install/windows and jarrodwatts/intermission's README.
#
# Source of the files: -Source (default: the staging folder used on 2026-10-15). If they are not there, as on a fresh
# rebuild (this repo does not carry Microsoft's binaries), the script downloads the pinned NuGet package
# Microsoft.Windows.Console.ConPTY 1.25.260930003 from nuget.org into a temp folder. Nothing downloaded is trusted:
# both files must match the SHA-256 pins below AND carry a valid Microsoft signature, or nothing is copied.
# Verification runs without elevation; only the copy into Program Files needs it.
#
# Undo: delete conpty.dll and OpenConsole.exe from the Rio folder (or `winget uninstall raphamorim.rio`).
param([string]$Source = (Join-Path $HOME 'Projects\claude-rice\staging\conpty\x'))

$ErrorActionPreference = 'Stop'

$rioDir  = 'C:\Program Files\Rio'
$package = 'https://www.nuget.org/api/v2/package/Microsoft.Windows.Console.ConPTY/1.25.260930003'
$pins    = @(
    @{ Rel = 'runtimes\win-x64\native\conpty.dll';       Sha256 = 'FEEEF341D891643C62D30B6B07800BC70F0BC148F44CB8C3BEE84AA557AE805A' },
    @{ Rel = 'build\native\runtimes\x64\OpenConsole.exe'; Sha256 = '3D66B23D0A71BB8EED2B77EDC8B9DF9BF54CE6C8FB74C863A30E760997F80586' }
)

$src = $Source
if (@($pins | Where-Object { -not (Test-Path (Join-Path $src $_.Rel)) }).Count -gt 0) {
    $tmp = Join-Path ([IO.Path]::GetTempPath()) "rio-conpty-$([guid]::NewGuid().ToString('N'))"
    New-Item -ItemType Directory $tmp | Out-Null
    $zip = Join-Path $tmp 'conpty.zip'   # .zip: Windows PowerShell's Expand-Archive refuses any other extension
    Write-Host "downloading $package"
    Invoke-WebRequest -UseBasicParsing $package -OutFile $zip
    Expand-Archive $zip -DestinationPath (Join-Path $tmp 'x')
    $src = Join-Path $tmp 'x'
}

# Verify everything first; copy only if ALL checks pass.
$files = foreach ($p in $pins) {
    $path = Join-Path $src $p.Rel
    if (-not (Test-Path $path)) { throw "Missing $path" }
    $hash = (Get-FileHash $path -Algorithm SHA256).Hash
    if ($hash -ne $p.Sha256) { throw "Hash mismatch for ${path}: $hash" }
    $sig = Get-AuthenticodeSignature $path
    if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch '^CN=Microsoft Corporation') {
        throw "Signature check failed for ${path}: $($sig.Status) / $($sig.SignerCertificate.Subject)"
    }
    Write-Host "verified  $(Split-Path $path -Leaf)  (hash + Microsoft signature)"
    $path
}

if (-not (Test-Path "$rioDir\rio.exe")) { throw "Rio is not installed at $rioDir (winget install -e --id raphamorim.rio)." }
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Verified, but not elevated: right-click PowerShell > Run as administrator, then run this script again to copy.'
}

foreach ($path in $files) {
    Copy-Item $path $rioDir -Force
    Write-Host "copied    $(Split-Path $path -Leaf) -> $rioDir"
}

Write-Host "`nDone. Close and reopen Rio so it picks up the new ConPTY." -ForegroundColor Green
