// 庫存異動流水：存於 PostgreSQL（InventoryMovement 表）。
import { prisma } from "@/lib/prisma";

export type MovementType = "SALE" | "CANCEL" | "RESTOCK" | "ADJUST";

export type Movement = {
  id: string;
  variantId: string;
  productTitle: string;
  optionLabel: string;
  type: MovementType;
  delta: number; // 帶正負：SALE 為負、CANCEL/RESTOCK 為正、ADJUST 視情況
  reason: string;
  orderNo?: string;
  createdAt: string;
};

export async function recordMovement(input: Omit<Movement, "id" | "createdAt">) {
  await prisma.inventoryMovement.create({
    data: {
      variantId: input.variantId,
      productTitle: input.productTitle,
      optionLabel: input.optionLabel,
      type: input.type,
      delta: input.delta,
      reason: input.reason,
      orderNo: input.orderNo ?? null,
    },
  });
}

export async function listMovements(): Promise<Movement[]> {
  const rows = await prisma.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    variantId: r.variantId,
    productTitle: r.productTitle,
    optionLabel: r.optionLabel,
    type: r.type as MovementType,
    delta: r.delta,
    reason: r.reason,
    orderNo: r.orderNo ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}
