// 全台 7-ELEVEN 門市查詢（賣貨便取貨門市用）
// 資料由 scripts/fetch-711-stores.mjs 從 7-11 官方電子地圖抓取，存於 data/stores-711.json。
// 檔案約 1MB，僅在伺服器端載入一次（勿在 client 端 import 整包）。
import raw from "./data/stores-711.json";

export type Store711 = {
  id: string; // 門市代號，例："287731"
  name: string; // 店名，例："BBS夢廣場店"
  addr: string; // 地址
  tel: string; // 電話
  city: string; // 縣市
  town: string; // 鄉鎮市區
};

const STORES = raw as Store711[];

// 7-11 API 只認「台」不認「臺」，資料已正規化；查詢關鍵字也一併正規化以免對不上
function normalize(s: string): string {
  return s.replace(/臺/g, "台").trim();
}

export function getStoreById(id: string): Store711 | undefined {
  const key = id.trim();
  return STORES.find((s) => s.id === key);
}

// 依關鍵字搜尋門市：可比對店名 / 地址 / 門市代號 / 縣市鄉鎮
// 排序：門市代號完全相符 > 店名開頭相符 > 店名包含 > 其他（地址等）
export function searchStores(keyword: string, limit = 20): Store711[] {
  const q = normalize(keyword);
  if (!q) return [];

  const scored: { s: Store711; score: number }[] = [];
  for (const s of STORES) {
    let score = 0;
    if (s.id === q) score = 100;
    else if (s.name.startsWith(q)) score = 80;
    else if (s.name.includes(q)) score = 60;
    else if (s.id.includes(q)) score = 50;
    else if (`${s.city}${s.town}`.includes(q)) score = 30;
    else if (s.addr.includes(q)) score = 20;
    if (score > 0) scored.push({ s, score });
  }

  scored.sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name, "zh-TW"));
  return scored.slice(0, limit).map((x) => x.s);
}
