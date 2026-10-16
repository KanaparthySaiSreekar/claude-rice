# check-shader.ps1: compile a Windows Terminal pixel shader with the system's own HLSL compiler
# (d3dcompiler_47.dll, the one Windows Terminal uses) and print any errors. Exit 0 = it compiles.
#   pwsh -NoProfile -File tools/check-shader.ps1 -Path shaders/glow.hlsl
param([Parameter(Mandatory)][string]$Path)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices; using System.Text;
public static class Hlsl {
  [ComImport, Guid("8BA5FB08-5195-40e2-AC58-0D989C3A0102"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ID3DBlob { [PreserveSig] IntPtr GetBufferPointer(); [PreserveSig] UIntPtr GetBufferSize(); }
  [DllImport("d3dcompiler_47.dll", CharSet = CharSet.Ansi)]
  static extern int D3DCompile(byte[] src, UIntPtr len, string name, IntPtr defs, IntPtr inc, string entry, string target, uint f1, uint f2,
                               [MarshalAs(UnmanagedType.Interface)] out ID3DBlob code, [MarshalAs(UnmanagedType.Interface)] out ID3DBlob err);
  public static string Compile(string source, out int hr, out int codeBytes) {
    ID3DBlob code, err;
    hr = D3DCompile(Encoding.UTF8.GetBytes(source), (UIntPtr)Encoding.UTF8.GetByteCount(source), "shader.hlsl", IntPtr.Zero, IntPtr.Zero, "main", "ps_5_0", 0, 0, out code, out err);
    codeBytes = code == null ? 0 : (int)(uint)code.GetBufferSize();
    if (err == null) return "";
    return Marshal.PtrToStringAnsi(err.GetBufferPointer(), (int)(uint)err.GetBufferSize());
  }
}
'@
$src = Get-Content -LiteralPath $Path -Raw
$hr = 0; $bytes = 0
$msg = [Hlsl]::Compile($src, [ref]$hr, [ref]$bytes)
if ($hr -ne 0) { Write-Host ("FAILED (0x{0:X8})" -f $hr); Write-Host $msg; exit 1 }
Write-Host ("OK: {0} compiles to {1} bytes of ps_5_0" -f (Split-Path $Path -Leaf), $bytes)
if ($msg.Trim()) { Write-Host "warnings:"; Write-Host $msg }
