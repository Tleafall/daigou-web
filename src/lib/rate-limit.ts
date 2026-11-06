// 簡易頻率限制（存在記憶體）：網站只跑一個程序，用不到 Redis 這類外部服務。
// 重啟伺服器會清空計數，對「防灌瀏覽數／事件紀錄」來說已足夠。
const hits = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  if (hits.size < 5000) return;
  for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
}

// 取得訪客 IP：經 Cloudflare 時用 cf-connecting-ip，其次 x-forwarded-for
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

// 固定時間窗內最多 limit 次；回傳 true＝允許、false＝超過上限
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const cur = hits.get(key);
  if (!cur || cur.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  cur.count += 1;
  return cur.count <= limit;
}

// 同一個 key 在 ms 內只算第一次（例：同一人反覆重新整理同一商品，只算一次瀏覽）
export function firstWithin(key: string, ms: number): boolean {
  return rateLimit(`once:${key}`, 1, ms);
}
