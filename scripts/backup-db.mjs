/**
 * 資料庫備份：把整個 daigou 資料庫匯出成一個 .sql 檔，存到專案的 backups/ 資料夾。
 * 會保留所有備份（不刪舊檔；備份檔很小）。若有設定雲端資料夾，會再自動複製一份上雲。
 *
 * 執行：npm run db:backup
 * 排程（每天自動跑）：見 SETUP.md 第 7.5 節（Windows 工作排程器）。
 *
 * 雲端備份：把備份再複製一份到「會自動同步到雲端的資料夾」。
 *   - 有裝 OneDrive（Windows 內建，登入即可）時，自動複製到 OneDrive\雨晴代購備份。
 *   - 或自己設環境變數 BACKUP_CLOUD_DIR 指到 Google Drive / Dropbox 的同步資料夾。
 *
 * 需要系統有 PostgreSQL 的 pg_dump。找不到時可用環境變數 PG_DUMP 指定完整路徑，例如：
 *   PG_DUMP="C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe"
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const url = new URL(process.env.DATABASE_URL ?? "");
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const host = url.hostname || "localhost";
const port = url.port || "5432";
const db = url.pathname.replace(/^\//, "").split("?")[0];

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backupDir = join(projectRoot, "backups");
mkdirSync(backupDir, { recursive: true });

const stamp = new Date()
  .toISOString()
  .replace(/[:T]/g, "-")
  .replace(/\..+$/, "")
  .slice(0, 16); // 例：2026-09-17-02-30
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

  // 再複製一份到雲端同步資料夾（有的話）
  const cloud = cloudDir();
  if (cloud) {
    try {
      mkdirSync(cloud, { recursive: true });
      copyFileSync(outFile, join(cloud, basename(outFile)));
      console.log(`✓ 已複製到雲端資料夾：${cloud}`);
    } catch (e) {
      console.warn(`⚠ 雲端複製失敗（本機備份已完成）：${e.message}`);
    }
  } else {
    console.log(
      "ℹ 尚未設定雲端備份。裝好 OneDrive 或設環境變數 BACKUP_CLOUD_DIR 後，會自動再上雲一份。",
    );
  }
} catch (e) {
  console.error("✗ 備份失敗：", e.message);
  console.error("  請確認 PostgreSQL 已安裝，或用環境變數 PG_DUMP 指定 pg_dump 的完整路徑。");
  process.exit(1);
}
