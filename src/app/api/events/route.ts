import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isEventType, logEvent } from "@/lib/event-store";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// 前端行為事件收集端點（SEARCH / ADD_TO_CART）。
// 排除管理員/自己人；只收集，不做任何分析。
export async function POST(req: NextRequest) {
  // 防灌：同一 IP 每分鐘最多 60 筆事件
  if (!rateLimit(`events:${clientIp(req.headers)}`, 60, 60_000)) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let body: {
    type?: string;
    slug?: string;
    query?: string;
    meta?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!isEventType(body.type)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // 排除管理員（自己人）的行為，保持資料乾淨
  const session = await auth();
  if (session?.user?.role === "ADMIN") {
    return Response.json({ ok: true, skipped: "admin" });
  }

  const visitorId = await getOrCreateVisitorId();
  await logEvent({
    type: body.type,
    userId: session?.user?.id ?? null,
    visitorId,
    productSlug: body.slug ?? null,
    query: body.query ?? null,
    meta: body.meta,
  });

  return Response.json({ ok: true });
}
