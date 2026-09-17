# 雨晴代購 更新網站（由 更新網站.bat 呼叫）
# 純 PowerShell，能可靠顯示中文，不受 cmd 批次檔中文編碼問題影響。
$ErrorActionPreference = 'Continue'
try { $host.UI.RawUI.WindowTitle = '雨晴代購 更新網站' } catch {}

# 切到專案根目錄（此腳本放在 scripts\ 底下）
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)

function Stop-Here($code) {
  Write-Host ''
  try { Read-Host '按 Enter 鍵關閉視窗' | Out-Null } catch {}
  exit $code
}

Write-Host ''
Write-Host '  ============================================'
Write-Host '     雨晴代購 - 更新網站'
Write-Host '  ============================================'
Write-Host '  會自動抓最新版、更新資料庫、重新打包、重啟。'
Write-Host '  需要幾分鐘，請耐心等候，不要關視窗。'
Write-Host ''

Write-Host '  [1/5] 下載最新版本...'
git pull
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host '  [錯誤] 下載失敗。若顯示 conflict/衝突，請截圖找工程師協助，先不要繼續。' -ForegroundColor Red
  Stop-Here 1
}
Write-Host ''

Write-Host '  [2/5] 更新套件...'
npm install
Write-Host ''

Write-Host '  [3/5] 更新資料庫（若這次有加欄位）...'
npm run db:push
Write-Host ''

Write-Host '  [4/5] 重新打包網站...'
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host '  [錯誤] 打包失敗，網站可能有問題。請截圖找工程師協助。' -ForegroundColor Red
  Stop-Here 1
}
Write-Host ''

Write-Host '  [5/5] 重新啟動網站...'
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
  pm2 restart daigou
  if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host '  （找不到 daigou 這個常駐程序：表示網站可能不是用 pm2 常駐。' -ForegroundColor Yellow
    Write-Host '    請關掉舊的「啟動網站」黑色視窗，再重新開一次「啟動網站」即可。）' -ForegroundColor Yellow
  }
} else {
  Write-Host ''
  Write-Host '  （這台電腦沒有安裝 pm2：表示網站不是用 pm2 常駐。' -ForegroundColor Yellow
  Write-Host '    請關掉舊的「啟動網站」黑色視窗，再重新開一次「啟動網站」即可。）' -ForegroundColor Yellow
}
Write-Host ''
Write-Host '  ============================================'
Write-Host '     [完成] 更新完成！' -ForegroundColor Green
Write-Host '  ============================================'
Stop-Here 0
