# 建置與上線指南（交接用）

這份文件是給「在另一台電腦重新把這個網站架起來」用的。
對象可以是人，也可以是新電腦上的 Claude — 照著步驟做即可精準完成。

> 這是姑姑的**代購**電商網站（賣貨便 7-11 取貨付款）。技術：Next.js 16 + TypeScript +
> Tailwind 4 + Prisma 7 + 本機 PostgreSQL + Auth.js。

---

## 0. 先讀這幾點（重要提醒）

- **這是「客製版」的 Next.js**：專案根目錄有 `AGENTS.md`，動程式前要先看
  `node_modules/next/dist/docs/` 的對應文件，不要照舊版 Next.js 的記憶寫。
- **資料層已接資料庫**：商品/訂單/分類/設定/庫存/會員/取貨資料都存 PostgreSQL；
  只有「站內客服聊天」還在記憶體（已停用，改用官方 LINE）。
- **賣貨便是半自動**：網站只負責收單＋記錄客人選的 7-11 門市；實際寄件仍由賣家自己到
  7-11 賣貨便後台建立。網站沒有串到賣貨便出貨系統。
- **`prisma db push` 有 AI 安全閘**：若由 AI 代跑且涉及資料清除，需使用者明確同意並帶
  `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` 環境變數。單純新增資料表（無資料遺失）
  不會被擋。

---

## 1. 需要先安裝的東西（新電腦）

1. **Node.js 20 以上**（含 npm）— https://nodejs.org 下載 LTS。
   驗證：`node -v`、`npm -v`
2. **PostgreSQL 17**（本機資料庫）— https://www.postgresql.org/download/windows/
   安裝時記住你設的 postgres 密碼。裝完確認 `psql --version`。
3. **Git**（如果用 git 取得程式）— https://git-scm.com

---

## 2. 取得程式碼

**方法 A（推薦）— 用 Git：**
```bash
git clone https://github.com/Tleafall/daigou-web.git
cd daigou-web
```

**方法 B — 用隨身碟：**
把整個專案資料夾複製過去，但**不要**複製 `node_modules/` 和 `.next/`（很大且會重裝）。
`.env` 有機密、通常不在資料夾裡（見下一步）。

---

## 3. 安裝套件

```bash
npm install
```
（`postinstall` 會自動跑 `prisma generate` 產生資料庫 client。）

---

## 4. 設定環境變數 `.env`

1. 複製範本：`cp .env.example .env`（Windows PowerShell：`Copy-Item .env.example .env`）
2. 打開 `.env` 把值填好：
   - `DATABASE_URL`：把密碼換成你在步驟 1 設的 postgres 密碼。
   - `AUTH_SECRET`：跑 `npx auth secret` 產生一段，或 `openssl rand -base64 32`。
   - `CLOUDINARY_*` 三個：**沿用原本同一組**（用隨身碟/密碼管理器帶過來，別用 email 傳）。
     沒有的話商品圖片會退回存進資料庫（能用，只是較肥）。

---

## 5. 建立資料庫

1. 建一個空資料庫（名稱 `daigou`）：
   ```bash
   psql -U postgres -c "CREATE DATABASE daigou;"
   ```
2. 把資料表結構建起來（二選一）：
   - 全新資料庫用 migration：`npx prisma migrate deploy`
   - 或直接同步 schema：`npm run db:push`
3. 放示範資料（分類/商品/示範訂單）：
   ```bash
   npm run db:seed
   ```

> 想把「舊電腦的實際資料」也搬過來：在舊電腦跑
> `pg_dump -U postgres daigou > daigou.sql`，帶到新電腦後
> `psql -U postgres daigou < daigou.sql`（就不需要跑 db:seed）。

---

## 6. 啟動

- **開發模式**（改東西即時看）：
  ```bash
  npm run dev
  ```
  瀏覽器開 http://localhost:3000

- **正式版模式**（對外營運要用這個，較快）：
  ```bash
  npm run build
  npm run start
  ```

**帳號**：
- 內建測試帳號 `admin@test.com / admin1234`、`customer@test.com / user1234`
  **只在開發模式(`npm run dev`)能用；正式版(`npm run start`)會自動停用**，
  避免預設帳密被拿來登入後台。
- 一般客人可在 `/register` 自行註冊。
- **正式上線前，先建立你自己的管理員帳號**（正式版只有這種帳號進得了後台）：
  ```bash
  npm run create-admin -- 你的email 你的強密碼 你的名字
  ```

---

## 7. 對外上線：Cloudflare Tunnel → 網域 yuchingmakeup.com

讓外面的人連得到家裡電腦跑的網站，免固定 IP、免開防火牆、自帶 HTTPS。
**前提**：這台電腦已照第 1～6 步把網站架好、也建好正式管理員；網域 `yuchingmakeup.com`
已在 Cloudflare 帳號底下（買的時候就自動歸戶）。以下都在**這台要當主機的電腦**上做。

> ⚠️ 主機要 **24 小時開機**、且**同時跑著兩個東西**：網站(`npm run start`) + cloudflared。
> 兩個都設成開機自動啟動，才不用每次手動開。

**步驟 A — 先把正式版網站跑起來（聽 3000 埠）**
```bash
npm run build
npm run start
```
（先確認 http://localhost:3000 打得開、能登入後台，再往下。）

**步驟 B — 安裝 cloudflared**
```bash
winget install --id Cloudflare.cloudflared
```
（裝完關掉再開一個新的終端機，讓 `cloudflared` 指令生效。）

**步驟 C — 登入並授權（會開瀏覽器）**
```bash
cloudflared tunnel login
```
瀏覽器會跳出來，選 `yuchingmakeup.com` 這個網域授權。

**步驟 D — 建立 tunnel**
```bash
cloudflared tunnel create yuqing
```
記下印出來的 **Tunnel UUID**（一長串），以及憑證檔路徑
（通常在 `C:\Users\你的帳號\.cloudflared\<UUID>.json`）。

**步驟 E — 建立設定檔** `C:\Users\你的帳號\.cloudflared\config.yml`，內容：
```yaml
tunnel: <上一步的 UUID>
credentials-file: C:\Users\你的帳號\.cloudflared\<UUID>.json

ingress:
  - hostname: yuchingmakeup.com
    service: http://localhost:3000
  - hostname: www.yuchingmakeup.com
    service: http://localhost:3000
  - service: http_status:404
```

**步驟 F — 把網域指到這個 tunnel**
```bash
cloudflared tunnel route dns yuqing yuchingmakeup.com
cloudflared tunnel route dns yuqing www.yuchingmakeup.com
```

**步驟 G — 先手動跑起來測試**
```bash
cloudflared tunnel run yuqing
```
然後用手機／別台電腦開 `https://yuchingmakeup.com`，能看到網站就成功了。

**步驟 H — 設成開機自動啟動（常駐）**
- Tunnel：`cloudflared service install`（裝成 Windows 服務，開機自動跑，讀上面的 config.yml）。
- 網站：讓 `npm run start` 也開機自動跑。最簡單一種：
  ```bash
  npm i -g pm2 pm2-windows-startup
  pm2 start "npm run start" --name daigou
  pm2 save
  pm2-startup install
  ```
  （或用 Windows「工作排程器」在登入時執行一個跑 `npm run start` 的 .bat。）

> 之後想省事、不想一直開電腦，可改租 VPS：把這套裝上去、資料用 `pg_dump` 搬過去，
> 網域一樣指過去即可（詳見第 9 節的方向）。

---

## 7.5 資料備份（強烈建議設定）

家用電腦硬碟會壞，正式營運一定要備份訂單/客戶資料。

**手動備份一次：**
```bash
npm run db:backup
```
會在專案的 `backups/` 產生一個 `daigou-日期.sql`，**保留所有備份不刪**（備份檔很小）。
（若出現找不到 pg_dump，設環境變數 `PG_DUMP` 指到
`C:\Program Files\PostgreSQL\17\bin\pg_dump.exe`。）

**雲端備份（會自動做）：**
- 這台電腦若有登入 **OneDrive**（Windows 內建），備份會自動再複製一份到
  `OneDrive\雨晴代購備份`，OneDrive 就會自動同步上雲——**不用另外設定**。
- 想改用 Google Drive / Dropbox：裝好它的桌面同步程式，在 `.env` 加一行
  `BACKUP_CLOUD_DIR="同步資料夾的完整路徑"`，備份就會改複製到那裡。

**設成每天自動備份（Windows 工作排程器）：**
1. 開「工作排程器」→ 建立基本工作 → 名稱「daigou 每日備份」。
2. 觸發：每天，選一個離峰時間（如凌晨 3:00）。
3. 動作：啟動程式
   - 程式：`C:\Program Files\nodejs\node.exe`
   - 引數：`scripts/backup-db.mjs`
   - 開始位置：專案資料夾（`...\daigou-web`）
4. 完成。之後每天會自動存一份。

**還原備份（電腦換機或資料壞掉時）：**
```bash
psql -U postgres -d daigou -f backups\daigou-那個檔.sql
```

> 有了上面的雲端備份，就算整台電腦壞了，雲端還有一份，資料就安全了。

---

## 8. 常用指令速查

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發模式啟動 |
| `npm run build` / `npm run start` | 正式版打包 / 啟動 |
| `npm run db:push` | 把 schema 同步到資料庫 |
| `npm run db:seed` | 重置示範資料（分類/商品/訂單） |
| `npm run db:studio` | 開視覺化資料庫管理介面 |
| `npm run db:backup` | 備份資料庫到 backups/（保留最近 14 份） |
| `npm run create-admin -- <email> <密碼> [姓名]` | 建立/升級正式管理員帳號 |
| `npm run stores:fetch` | 重新抓全台 7-11 門市清單 |

---

## 9. 還沒做、之後可加

- **LINE 登入**：需到 LINE Developers 申請金鑰後接上（按鈕目前 disabled）。
- **服務條款 / 隱私權**頁：目前是「即將推出」佔位，正式對外前建議補上。
- 圖片已可自動上 Cloudinary（後台也有「圖片雲端化」一鍵搬移舊圖）。
