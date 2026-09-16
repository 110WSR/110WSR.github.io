# 启动打包后的桌面 exe（通过通配符定位，避免脚本内嵌中文）
$exe = (Get-ChildItem 'D:\F\5ednd\desktop\release\win-unpacked\*.exe')[0].FullName
Start-Process -FilePath $exe -ArgumentList '--remote-debugging-port=9224'
Write-Output "launched: $exe"
