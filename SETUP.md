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

## 7. 對外上線：Cloudflare Tunnel（從家用電腦）

讓外面的人連得到家裡電腦跑的網站，免固定 IP、免開防火牆、自帶 HTTPS。

1. 註冊 Cloudflare 帳號（免費）：https://dash.cloudflare.com
2. 安裝 cloudflared：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   （Windows 可用 `winget install --id Cloudflare.cloudflared`）
3. 登入並授權：
   ```bash
   cloudflared tunnel login
   ```
4. 建立 tunnel：
   ```bash
   cloudflared tunnel create daigou
   ```
5. 先用正式版把網站跑起來（步驟 6 的 build + start，聽 3000 埠）。
6. 快速測試（會給一個臨時網址）：
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
7. 要綁自己的網域、開機自動啟動：照 Cloudflare 文件設定 `config.yml` 的
   `ingress` 指到 `http://localhost:3000`，再 `cloudflared tunnel route dns daigou 你的網域`，
   並把 cloudflared 設成 Windows 服務常駐。

> 網站要一直開著才連得到，所以家用電腦要維持開機＋跑著 `npm run start` 和 cloudflared。
> 之後嫌麻煩可改租 VPS，資料用 `pg_dump` 搬過去即可。

---

## 8. 常用指令速查

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發模式啟動 |
| `npm run build` / `npm run start` | 正式版打包 / 啟動 |
| `npm run db:push` | 把 schema 同步到資料庫 |
| `npm run db:seed` | 重置示範資料（分類/商品/訂單） |
| `npm run db:studio` | 開視覺化資料庫管理介面 |
| `npm run create-admin -- <email> <密碼> [姓名]` | 建立/升級正式管理員帳號 |
| `npm run stores:fetch` | 重新抓全台 7-11 門市清單 |

---

## 9. 還沒做、之後可加

- **LINE 登入**：需到 LINE Developers 申請金鑰後接上（按鈕目前 disabled）。
- **服務條款 / 隱私權**頁：目前是「即將推出」佔位，正式對外前建議補上。
- 圖片已可自動上 Cloudinary（後台也有「圖片雲端化」一鍵搬移舊圖）。
