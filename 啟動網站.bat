@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 雨晴代購 網站
echo.
echo   ============================================
echo      雨晴代購 - 正在啟動網站
echo   ============================================
echo.
echo   啟動後，這個黑色視窗請「保持開著」，
echo   關掉視窗網站就會停。
echo.
if not exist ".next\" (
  echo   第一次啟動，正在準備網站檔案，需要幾分鐘，請稍候...
  echo.
  call npm run build
  echo.
)
echo   網站啟動中... 稍等幾秒後，
echo   用瀏覽器打開  yuchingmakeup.com  就能看到網站。
echo.
call npm run start
echo.
echo   網站已停止。按任意鍵關閉視窗。
pause >nul
