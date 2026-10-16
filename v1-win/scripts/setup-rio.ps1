# setup-rio.ps1 — run ONCE from an ELEVATED PowerShell (Run as administrator).
#
# Gives Rio a newer ConPTY (conpty.dll + OpenConsole.exe) so kitty-graphics pictures survive the Windows
# console layer. Both files are required: with conpty.dll alone Rio falls back to the built-in console host,
# which strips the pictures. See https://rioterm.com/docs/install/windows and jarrodwatts/intermission's README.
#
# The files were downloaded and verified un-elevated on 2026-10-15 (Microsoft.Windows.Console.ConPTY 1.25.260930003).
# This script re-verifies hash AND Microsoft signature before copying, and copies nothing otherwise.
#
# Undo: delete conpty.dll and OpenConsole.exe from the Rio folder (or `winget uninstall raphamorim.rio`).

$ErrorActionPreference = 'Stop'

$rioDir = 'C:\Program Files\Rio'
$src    = Join-Path $HOME 'Projects\claude-rice\staging\conpty\x'
$files  = @(
    @{ Path = "$src\runtimes\win-x64\native\conpty.dll";       Sha256 = 'FEEEF341D891643C62D30B6B07800BC70F0BC148F44CB8C3BEE84AA557AE805A' },
    @{ Path = "$src\build\native\runtimes\x64\OpenConsole.exe"; Sha256 = '3D66B23D0A71BB8EED2B77EDC8B9DF9BF54CE6C8FB74C863A30E760997F80586' }
)

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Not elevated. Right-click PowerShell > Run as administrator, then run this script again.'
}
if (-not (Test-Path "$rioDir\rio.exe")) { throw "Rio is not installed at $rioDir (winget install -e --id raphamorim.rio)." }

# Verify everything first; copy only if ALL checks pass.
foreach ($f in $files) {
    if (-not (Test-Path $f.Path)) { throw "Missing $($f.Path)" }
    $hash = (Get-FileHash $f.Path -Algorithm SHA256).Hash
    if ($hash -ne $f.Sha256) { throw "Hash mismatch for $($f.Path): $hash" }
    $sig = Get-AuthenticodeSignature $f.Path
    if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch '^CN=Microsoft Corporation') {
        throw "Signature check failed for $($f.Path): $($sig.Status) / $($sig.SignerCertificate.Subject)"
    }
    Write-Host "verified  $(Split-Path $f.Path -Leaf)  (hash + Microsoft signature)"
}

foreach ($f in $files) {
    Copy-Item $f.Path $rioDir -Force
    Write-Host "copied    $(Split-Path $f.Path -Leaf) -> $rioDir"
}

Write-Host "`nDone. Close and reopen Rio so it picks up the new ConPTY." -ForegroundColor Green
