/**
 * 資料庫備份：把整個 daigou 資料庫匯出成一個 .sql 檔，存到專案的 backups/ 資料夾。
 * 自動保留最近 14 份，更舊的自動刪除。
 *
 * 執行：npm run db:backup
 * 排程（每天自動跑）：見 SETUP.md 第 10 節（Windows 工作排程器）。
 *
 * 需要系統有 PostgreSQL 的 pg_dump。找不到時可用環境變數 PG_DUMP 指定完整路徑，例如：
 *   PG_DUMP="C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe"
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KEEP = 14; // 保留最近幾份

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

function rotate() {
  const files = readdirSync(backupDir)
    .filter((f) => f.startsWith("daigou-") && f.endsWith(".sql"))
    .map((f) => ({ f, t: statSync(join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { f } of files.slice(KEEP)) {
    unlinkSync(join(backupDir, f));
    console.log("刪除舊備份:", f);
  }
}

try {
  execFileSync(findPgDump(), ["-h", host, "-p", port, "-U", user, "-f", outFile, db], {
    env: { ...process.env, PGPASSWORD: password },
    stdio: ["ignore", "inherit", "inherit"],
  });
  const kb = Math.round(statSync(outFile).size / 1024);
  console.log(`✓ 備份完成：${outFile}（${kb} KB）`);
  rotate();
} catch (e) {
  console.error("✗ 備份失敗：", e.message);
  console.error("  請確認 PostgreSQL 已安裝，或用環境變數 PG_DUMP 指定 pg_dump 的完整路徑。");
  process.exit(1);
}
