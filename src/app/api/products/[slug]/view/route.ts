import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { incrementProductViews } from "@/lib/product-store";
import { logEvent } from "@/lib/event-store";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { clientIp, firstWithin, rateLimit } from "@/lib/rate-limit";

// 記錄商品瀏覽：由商品頁在瀏覽器載入後 POST 一次（見 view-tracker.tsx）
// 1) 累計瀏覽次數（後台顯示用） 2) 記錄一筆行為事件（供未來推薦用，排除管理員）
// 防灌：同一 IP 對同一商品 30 分鐘內只算一次；同一 IP 每分鐘最多 60 次請求。
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const ip = clientIp(req.headers);
  if (!rateLimit(`view:${ip}`, 60, 60_000)) {
    return Response.json({ ok: false }, { status: 429 });
  }
  if (!firstWithin(`view:${ip}:${slug}`, 30 * 60_000)) {
    return Response.json({ ok: true, counted: false });
  }

  await incrementProductViews(slug);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    const visitorId = await getOrCreateVisitorId();
    await logEvent({
      type: "VIEW",
      userId: session?.user?.id ?? null,
      visitorId,
      productSlug: slug,
    });
  }

  return Response.json({ ok: true });
}
