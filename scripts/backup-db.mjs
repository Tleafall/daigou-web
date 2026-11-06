/**
 * 資料庫備份：把整個 daigou 資料庫匯出成一個 .sql 檔，存到專案的 backups/ 資料夾。
 * 會保留所有備份（不刪舊檔；備份檔很小）。若有設定雲端資料夾，會再自動複製一份上雲。
 *
 * 執行：npm run db:backup
 * 排程（每天自動跑）：正式機用 pm2 每天凌晨 3 點執行（daigou-backup）。
 *
 * 也會備份「商品圖片」：把資料庫裡所有圖片網址下載到 backups/images/（已下載過的跳過），
 * 並附 manifest.json 記錄每張圖屬於哪個商品；有設定雲端時一併同步上去（只傳新增的）。
 *
 * 雲端備份：把備份再複製一份到「會自動同步到雲端的資料夾」。
 *   - 有裝 OneDrive（Windows 內建，登入即可）時，自動複製到 OneDrive\雨晴代購備份。
 *   - 或自己設環境變數 BACKUP_CLOUD_DIR 指到 Google Drive / Dropbox 的同步資料夾。
 *
 * 需要系統有 PostgreSQL 的 pg_dump。找不到時可用環境變數 PG_DUMP 指定完整路徑，例如：
 *   PG_DUMP="C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe"
 */
import { config as loadEnv } from "dotenv";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// 從專案根目錄載入 .env（不論從哪個資料夾或排程啟動，都讀得到 DATABASE_URL）
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(projectRoot, ".env") });

const url = new URL(process.env.DATABASE_URL ?? "");
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const host = url.hostname || "localhost";
const port = url.port || "5432";
const db = url.pathname.replace(/^\//, "").split("?")[0];

const backupDir = join(projectRoot, "backups");
mkdirSync(backupDir, { recursive: true });

// 檔名用台灣時間（UTC+8），凌晨 3 點的備份就叫 …-03-00，不會變成前一天的 19-00
const stamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
  .toISOString()
  .replace(/[:T]/g, "-")
  .replace(/\..+$/, "")
  .slice(0, 16); // 例：2026-11-06-03-00
const outFile = join(backupDir, `daigou-${stamp}.sql`);

function findPgDump() {
  if (process.env.PG_DUMP) return process.env.PG_DUMP;
  // 先找 Windows 常見安裝路徑，都沒有才退回 PATH 上的 pg_dump
  const paths = [
    "C:/Program Files/PostgreSQL/17/bin/pg_dump.exe",
    "C:/Program Files/PostgreSQL/16/bin/pg_dump.exe",
    "C:/Program Files/PostgreSQL/15/bin/pg_dump.exe",
  ];
  for (const p of paths) if (existsSync(p)) return p;
  return "pg_dump";
}

// 決定雲端備份資料夾：優先用 BACKUP_CLOUD_DIR，其次自動用 OneDrive
function cloudDir() {
  if (process.env.BACKUP_CLOUD_DIR) return process.env.BACKUP_CLOUD_DIR;
  const oneDrive = process.env.OneDrive || process.env.OneDriveConsumer;
  if (oneDrive) return join(oneDrive, "雨晴代購備份");
  return null;
}

try {
  execFileSync(findPgDump(), ["-h", host, "-p", port, "-U", user, "-f", outFile, db], {
    env: { ...process.env, PGPASSWORD: password },
    stdio: ["ignore", "inherit", "inherit"],
  });
  const kb = Math.round(statSync(outFile).size / 1024);
  console.log(`✓ 備份完成：${outFile}（${kb} KB）`);

  // 方式一：複製到會自動同步的資料夾（OneDrive / Google Drive 桌面版）
  const cloud = cloudDir();
  if (cloud) {
    try {
      mkdirSync(cloud, { recursive: true });
      copyFileSync(outFile, join(cloud, basename(outFile)));
      console.log(`✓ 已複製到雲端資料夾：${cloud}`);
    } catch (e) {
      console.warn(`⚠ 雲端複製失敗（本機備份已完成）：${e.message}`);
    }
  }

  // 方式二：用 rclone 上傳（免安裝、免管理員；適合 Google Drive）。
  // 需設環境變數 RCLONE_REMOTE（如 gdrive:daigou-backup）與 RCLONE_EXE（rclone.exe 路徑）。
  const rcloneRemote = process.env.RCLONE_REMOTE;
  if (rcloneRemote) {
    const rcloneExe = process.env.RCLONE_EXE || "rclone";
    try {
      execFileSync(rcloneExe, ["copy", outFile, rcloneRemote], {
        stdio: ["ignore", "inherit", "inherit"],
      });
      console.log(`✓ 已用 rclone 上傳到雲端：${rcloneRemote}`);
    } catch (e) {
      console.warn(`⚠ rclone 上傳失敗（本機備份已完成）：${e.message}`);
    }
  }

  if (!cloud && !rcloneRemote) {
    console.log(
      "ℹ 尚未設定雲端備份。設定 BACKUP_CLOUD_DIR 或 RCLONE_REMOTE 後，會自動再上雲一份。",
    );
  }

  // 商品圖片備份（失敗不影響上面已完成的資料庫備份）
  try {
    await backupImages(cloud, rcloneRemote);
  } catch (e) {
    console.warn(`⚠ 圖片備份失敗（資料庫備份已完成）：${e.message}`);
  }
} catch (e) {
  console.error("✗ 備份失敗：", e.message);
  console.error("  請確認 PostgreSQL 已安裝，或用環境變數 PG_DUMP 指定 pg_dump 的完整路徑。");
  process.exit(1);
}

// ---- 商品圖片備份 ----
async function backupImages(cloud, rcloneRemote) {
  const imgDir = join(backupDir, "images");
  mkdirSync(imgDir, { recursive: true });

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  let rows;
  try {
    ({ rows } = await client.query('SELECT slug, title, images FROM "Product" ORDER BY slug'));
  } finally {
    await client.end();
  }

  // 同一個網址固定對應同一個檔名，所以每天只會下載新增的圖片
  const fileFor = (url) => {
    const ext = (new URL(url).pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[0] ?? ".jpg").toLowerCase();
    return createHash("sha1").update(url).digest("hex").slice(0, 20) + ext;
  };

  const manifest = [];
  const todo = [];
  for (const r of rows) {
    const imgs = Array.isArray(r.images) ? r.images : [];
    const list = [];
    for (const im of imgs) {
      // data: 開頭的圖片是直接存在資料庫裡，已包含在上面的 .sql 備份中
      if (!im?.url || !/^https?:\/\//i.test(im.url)) continue;
      const file = fileFor(im.url);
      list.push({ url: im.url, file });
      if (!existsSync(join(imgDir, file))) todo.push({ url: im.url, file });
    }
    if (list.length) manifest.push({ slug: r.slug, title: r.title, images: list });
  }

  let ok = 0;
  let fail = 0;
  const queue = [...todo];
  async function worker() {
    for (let t = queue.shift(); t; t = queue.shift()) {
      try {
        const res = await fetch(t.url, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        writeFileSync(join(imgDir, t.file), Buffer.from(await res.arrayBuffer()));
        ok++;
      } catch {
        fail++;
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker)); // 同時下載 4 張
  writeFileSync(join(imgDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const total = manifest.reduce((n, m) => n + m.images.length, 0);
  console.log(`✓ 圖片備份：共 ${total} 張，本次新下載 ${ok} 張${fail ? `，失敗 ${fail} 張（下次會再試）` : ""}`);

  // 同步到雲端（只傳新的）
  if (cloud) {
    const dest = join(cloud, "images");
    mkdirSync(dest, { recursive: true });
    let n = 0;
    for (const f of readdirSync(imgDir)) {
      if (f === "manifest.json" || !existsSync(join(dest, f))) {
        copyFileSync(join(imgDir, f), join(dest, f));
        if (f !== "manifest.json") n++;
      }
    }
    console.log(`✓ 圖片已同步到雲端資料夾（新增 ${n} 張）`);
  }
  if (rcloneRemote) {
    const rcloneExe = process.env.RCLONE_EXE || "rclone";
    execFileSync(rcloneExe, ["copy", imgDir, `${rcloneRemote.replace(/\/+$/, "")}/images`], {
      stdio: ["ignore", "inherit", "inherit"],
    });
    console.log(`✓ 圖片已用 rclone 同步到雲端：${rcloneRemote}/images`);
  }
}
