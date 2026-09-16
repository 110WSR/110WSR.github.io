@echo off
cd /d D:\F\5ednd\desktop
set CARDDY_MULTI_INSTANCE=1
set CARDDY_STATIC_PORT=26581
start "dnd-debug" node_modules\.bin\electron.cmd . --remote-debugging-port=9223
