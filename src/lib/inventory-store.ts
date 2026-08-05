// ⚠️ 原型用「伺服器記憶體」庫存異動流水。重啟伺服器會清空。之後接 Prisma。

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

type Store = { movements: Movement[]; seq: number };

const g = globalThis as unknown as { __daigouInventory?: Store };

function getStore(): Store {
  if (!g.__daigouInventory) g.__daigouInventory = { movements: [], seq: 1 };
  return g.__daigouInventory;
}

export function recordMovement(input: Omit<Movement, "id" | "createdAt">) {
  const store = getStore();
  store.movements.push({
    ...input,
    id: `mv-${store.seq++}`,
    createdAt: new Date().toISOString(),
  });
}

export function listMovements(): Movement[] {
  return [...getStore().movements].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
