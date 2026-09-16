Add-Type @"
using System;
using System.Runtime.InteropServices;
public class U32r {
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@
$p = Get-Process | Where-Object { $_.MainWindowTitle -match 'DND' } | Select-Object -First 1
if (-not $p) { Write-Output "NO_WINDOW"; exit 1 }
[U32r]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
[U32r]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Write-Output ("restored " + $p.Id)
