// 產生網站推廣用的永久 QR code（掃描後開啟網站首頁）。
// 用法：node scripts/make-qrcode.mjs [網址]
// 產出：promo/qrcode-yuchingmakeup.svg（向量，印刷放大都清晰）
//        promo/qrcode-yuchingmakeup.png（1024px 高解析，社群/LINE 用）
import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.argv[2] || "https://yuchingmakeup.com";
const outDir = path.resolve("promo");
await mkdir(outDir, { recursive: true });

// errorCorrectionLevel "H"：容錯最高，就算中間壓上小 logo 或印刷有點髒也掃得到
const opts = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#1f1f1f", light: "#ffffff" },
};

const svg = await QRCode.toString(url, { ...opts, type: "svg", width: 1024 });
await writeFile(path.join(outDir, "qrcode-yuchingmakeup.svg"), svg, "utf8");
await QRCode.toFile(path.join(outDir, "qrcode-yuchingmakeup.png"), url, {
  ...opts,
  width: 1024,
});

console.log(`QR code 已產生（${url}）→ ${outDir}`);
console.log("  qrcode-yuchingmakeup.svg / .png");
