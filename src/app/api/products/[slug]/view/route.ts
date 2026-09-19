import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { incrementProductViews } from "@/lib/product-store";
import { logEvent } from "@/lib/event-store";
import { getOrCreateVisitorId } from "@/lib/visitor";

// 記錄商品瀏覽：由商品頁在瀏覽器載入後 POST 一次（見 view-tracker.tsx）
// 1) 累計瀏覽次數（後台顯示用） 2) 記錄一筆行為事件（供未來推薦用，排除管理員）
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
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
