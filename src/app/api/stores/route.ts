import { type NextRequest } from "next/server";
import { searchStores } from "@/lib/stores-711";

// 7-11 門市搜尋 API：GET /api/stores?q=關鍵字
// 供結帳頁的門市下拉選單即時查詢（店名 / 地址 / 門市代號）
export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = searchStores(q, 20);
  return Response.json(results);
}
