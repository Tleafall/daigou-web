// 使用者行為事件記錄（只收集、不分析；供未來推薦演算法用）。
// 寫入失敗一律吞掉，不影響主要流程。
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type EventType = "VIEW" | "ADD_TO_CART" | "SEARCH";
const ALLOWED: EventType[] = ["VIEW", "ADD_TO_CART", "SEARCH"];

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && (ALLOWED as string[]).includes(v);
}

export async function logEvent(input: {
  type: EventType;
  userId?: string | null;
  visitorId?: string | null;
  productSlug?: string | null;
  query?: string | null;
  meta?: unknown;
}): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        visitorId: input.visitorId ?? null,
        productSlug: input.productSlug ?? null,
        query: input.query ? input.query.slice(0, 200) : null,
        meta:
          input.meta === undefined
            ? undefined
            : (input.meta as Prisma.InputJsonValue),
      },
    });
  } catch {
    /* 事件記錄為輔助功能，失敗不影響主要流程 */
  }
}
