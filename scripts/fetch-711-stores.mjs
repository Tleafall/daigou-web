/**
 * 抓取全台 7-ELEVEN 門市清單（賣貨便取貨門市用）
 *
 * 資料來源：7-11 官方電子地圖 API
 *   POST https://emap.pcsc.com.tw/EMapSDK.aspx
 *   body: commandid=SearchStore&city=<縣市>&town=<鄉鎮市區>
 *   回傳 UTF-8 XML，每家門市一個 <GeoPosition>。
 *
 * 注意事項：
 *  - 這個 API 只認「台」不認「臺」（例：台北市 ✔ / 臺北市 ✘，會回 0 筆），
 *    所以縣市/鄉鎮名稱一律把「臺」正規化成「台」。
 *  - SearchStore 必須同時給 city + town；只給 city 會回 0 筆，
 *    取城市/鄉鎮清單的 meta 指令（GetCity/GetTown…）官方已關閉，全回空，
 *    因此改用固定的台灣縣市/鄉鎮清單去逐一查詢。
 *  - POIID 與 Telno 欄位尾端有全形/半形空白，需 trim。
 *
 * 執行：node scripts/fetch-711-stores.mjs
 * 產出：src/lib/data/stores-711.json
 *
 * 門市偶有增減，需要更新時重跑即可。
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/lib/data/stores-711.json");
const EMAP = "https://emap.pcsc.com.tw/EMapSDK.aspx";
const CITY_JSON =
  "https://raw.githubusercontent.com/donma/TaiwanAddressCityAreaRoadChineseEnglishJSON/master/CityCountyData.json";

const CONCURRENCY = 3;
const DELAY_MS = 120;

/** 抓單一 tag 的內文（門市欄位內都沒有 `<`，用 [^<]* 即可） */
function pick(xml, tag) {
  const m = xml.match(new RegExp("<" + tag + ">([^<]*)</" + tag + ">"));
  return m ? m[1].trim() : "";
}

async function searchStore(city, town, tries = 3) {
  const body = new URLSearchParams({ commandid: "SearchStore", city, town }).toString();
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(EMAP, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body,
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } catch (e) {
      if (i === tries - 1) {
        console.error("FAIL", city, town, String(e));
        return "";
      }
      await new Promise((res) => setTimeout(res, 800 * (i + 1)));
    }
  }
  return "";
}

function parseStores(xml, city, town) {
  const out = [];
  const blocks = xml.match(/<GeoPosition>[\s\S]*?<\/GeoPosition>/g) || [];
  for (const b of blocks) {
    const id = pick(b, "POIID");
    if (!id) continue;
    out.push({
      id,
      name: pick(b, "POIName"),
      addr: pick(b, "Address"),
      tel: pick(b, "Telno"),
      city,
      town,
    });
  }
  return out;
}

async function main() {
  const cc = await (await fetch(CITY_JSON)).json();
  const combos = [];
  for (const c of cc) {
    for (const a of c.AreaList) {
      combos.push({
        city: c.CityName.replace(/臺/g, "台"),
        town: a.AreaName.replace(/臺/g, "台"),
      });
    }
  }
  console.log("查詢組合數（縣市 × 鄉鎮）:", combos.length);

  const map = new Map();
  let idx = 0;
  async function worker() {
    while (idx < combos.length) {
      const { city, town } = combos[idx++];
      const xml = await searchStore(city, town);
      for (const s of parseStores(xml, city, town)) map.set(s.id, s);
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const stores = Array.from(map.values());
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(stores), "utf8");
  console.log(`完成：${stores.length} 家門市 -> ${OUT}`);
}

main();
