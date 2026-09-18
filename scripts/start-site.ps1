# 雨晴代購 啟動網站（由 啟動網站.bat 呼叫）
# 用途：萬一網站意外被關掉或當掉，雙擊我就能把它重新叫回來（透過 pm2 背景服務，
#       不會跟 pm2 搶 3000 埠）。網站正常時雙擊我也不會有副作用。
$ErrorActionPreference = 'Continue'
try { $host.UI.RawUI.WindowTitle = '雨晴代購 啟動網站' } catch {}
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)

Write-Host ''
Write-Host '  ============================================'
Write-Host '     雨晴代購 - 啟動網站'
Write-Host '  ============================================'
Write-Host ''

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  Write-Host '  找不到 pm2（網站的背景管理工具）。' -ForegroundColor Yellow
  Write-Host '  請改雙擊「更新網站」重新安裝，或截圖找工程師協助。' -ForegroundColor Yellow
  Write-Host ''
  try { Read-Host '按 Enter 鍵關閉視窗' | Out-Null } catch {}
  exit 1
}

Write-Host '  正在確認網站狀態，需要的話把它重新啟動...'
Write-Host ''
pm2 resurrect             # 若 pm2 曾被整個關閉，從存檔還原網站
pm2 start daigou 2>$null  # 若網站是停著的，把它啟動（已在跑就不動作）
Write-Host ''
pm2 list
Write-Host ''
Write-Host '  ============================================'
Write-Host '  網站已在背景執行，這個視窗可以直接關閉，不影響網站。'
Write-Host '  （可用瀏覽器開 yuchingmakeup.com 確認）'
Write-Host '  ============================================'
Write-Host ''
try { Read-Host '按 Enter 鍵關閉視窗' | Out-Null } catch {}
