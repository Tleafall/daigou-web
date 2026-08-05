// ⚠️ 原型用「伺服器記憶體」保存賣家對客戶的手動標記與備註（僅賣家可見）。
// 重啟伺服器會清空。之後接 Prisma 的 CustomerRiskProfile。

export type ManualFlag = "NORMAL" | "WATCH" | "BLOCKED";

export type CustomerProfile = {
  manualFlag: ManualFlag;
  sellerNote: string;
};

type Store = { profiles: Map<string, CustomerProfile> };

const g = globalThis as unknown as { __daigouCustomers?: Store };

function getStore(): Store {
  if (!g.__daigouCustomers) g.__daigouCustomers = { profiles: new Map() };
  return g.__daigouCustomers;
}

export function getCustomerProfile(userId: string): CustomerProfile {
  return getStore().profiles.get(userId) ?? { manualFlag: "NORMAL", sellerNote: "" };
}

export function setCustomerFlag(userId: string, flag: ManualFlag) {
  const store = getStore();
  const p = store.profiles.get(userId) ?? { manualFlag: "NORMAL", sellerNote: "" };
  p.manualFlag = flag;
  store.profiles.set(userId, p);
}

export function setCustomerNote(userId: string, note: string) {
  const store = getStore();
  const p = store.profiles.get(userId) ?? { manualFlag: "NORMAL", sellerNote: "" };
  p.sellerNote = note;
  store.profiles.set(userId, p);
}

export function isBlocked(userId: string): boolean {
  return getCustomerProfile(userId).manualFlag === "BLOCKED";
}
