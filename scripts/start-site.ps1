# 雨晴代購 啟動網站（由 啟動網站.bat 呼叫）
# 純 PowerShell，能可靠顯示中文，不受 cmd 批次檔中文編碼問題影響。
$ErrorActionPreference = 'Continue'
try { $host.UI.RawUI.WindowTitle = '雨晴代購 網站' } catch {}

# 切到專案根目錄（此腳本放在 scripts\ 底下）
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)

Write-Host ''
Write-Host '  ============================================'
Write-Host '     雨晴代購 - 正在啟動網站'
Write-Host '  ============================================'
Write-Host ''
Write-Host '  啟動後，這個視窗請「保持開著」，'
Write-Host '  關掉視窗網站就會停。'
Write-Host ''

if (-not (Test-Path '.next')) {
  Write-Host '  第一次啟動，正在準備網站檔案，需要幾分鐘，請稍候...'
  Write-Host ''
  npm run build
  Write-Host ''
}

Write-Host '  網站啟動中... 稍等幾秒後，'
Write-Host '  用瀏覽器打開  yuchingmakeup.com  就能看到網站。'
Write-Host ''
npm run start
Write-Host ''
Write-Host '  網站已停止。按 Enter 鍵關閉視窗。'
try { Read-Host | Out-Null } catch {}
