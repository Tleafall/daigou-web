@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 雨晴代購 更新網站
echo.
echo   ============================================
echo      雨晴代購 - 更新網站
echo   ============================================
echo   會自動抓最新版、更新資料庫、重新打包、重啟。
echo   需要幾分鐘，請耐心等候，不要關視窗。
echo.

echo   [1/5] 下載最新版本...
git pull
if errorlevel 1 (
  echo.
  echo   ✗ 下載失敗。若顯示 conflict/衝突，請截圖找工程師協助，先不要繼續。
  pause
  exit /b 1
)
echo.

echo   [2/5] 更新套件...
call npm install
echo.

echo   [3/5] 更新資料庫（若這次有加欄位）...
call npm run db:push
echo.

echo   [4/5] 重新打包網站...
call npm run build
if errorlevel 1 (
  echo.
  echo   ✗ 打包失敗，網站可能有問題。請截圖找工程師協助。
  pause
  exit /b 1
)
echo.

echo   [5/5] 重新啟動網站...
call pm2 restart daigou
if errorlevel 1 (
  echo.
  echo   （若上一步顯示找不到 pm2 或 daigou：表示網站不是用 pm2 常駐。
  echo     請關掉舊的「啟動網站」黑色視窗，再重新開一次「啟動網站」即可。）
)
echo.
echo   ============================================
echo      ✓ 更新完成！
echo   ============================================
echo.
pause
