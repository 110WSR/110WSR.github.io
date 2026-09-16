param([string]$OutPath = "D:\F\5ednd\desktop\verify-shot.png")

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT lpRect);
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$procs = Get-Process | Where-Object { $_.MainWindowTitle -match 'DND' }
if (-not $procs) { Write-Output "NO_WINDOW"; exit 1 }

# 可能有多个残留窗口，选面积最大的那个
$best = $null; $bestArea = 0
foreach ($p in $procs) {
    $r = New-Object Win32+RECT
    [Win32]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
    $area = ($r.Right - $r.Left) * ($r.Bottom - $r.Top)
    Write-Output "candidate: $($p.Id) $($p.MainWindowTitle) ${area}px2"
    if ($area -gt $bestArea) { $bestArea = $area; $best = $p; $bestRect = $r }
}
$proc = $best
$rect = $bestRect
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
Write-Output "window: ${w}x${h} title=$($proc.MainWindowTitle)"

$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[Win32]::PrintWindow($proc.MainWindowHandle, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc)
$bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "SAVED $OutPath"
