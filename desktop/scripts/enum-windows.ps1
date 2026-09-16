Add-Type @"
using System;
using System.Runtime.InteropServices;
public class U32x {
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECTx r);
    public struct RECTx { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
$procs = Get-Process | Where-Object { $_.MainWindowTitle -match 'DND' }
foreach ($p in $procs) {
    $h = $p.MainWindowHandle
    if ($h -eq [IntPtr]::Zero) { Write-Output ($p.Id.ToString() + " no-window"); continue }
    $r = New-Object U32x+RECTx
    [U32x]::GetWindowRect($h, [ref]$r) | Out-Null
    $w = $r.Right - $r.Left
    $hh = $r.Bottom - $r.Top
    $line = $p.Id.ToString() + " min=" + [U32x]::IsIconic($h) + " vis=" + [U32x]::IsWindowVisible($h) + " pos=" + $r.Left + "," + $r.Top + " size=" + $w + "x" + $hh + " title=" + $p.MainWindowTitle
    Write-Output $line
}
