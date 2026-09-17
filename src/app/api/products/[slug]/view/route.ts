import { type NextRequest } from "next/server";
import { incrementProductViews } from "@/lib/product-store";

// 記錄商品瀏覽次數：由商品頁在瀏覽器載入後 POST 一次（見 view-tracker.tsx）
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  await incrementProductViews(slug);
  return Response.json({ ok: true });
}
