// ⚠️ 原型用「伺服器記憶體」地址簿。重啟伺服器會清空。之後接 Prisma。

export type Address = {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  addressLine: string;
  isDefault: boolean;
};

type Store = { addresses: Address[]; seq: number };

const g = globalThis as unknown as { __daigouAddresses?: Store };

function getStore(): Store {
  if (!g.__daigouAddresses) g.__daigouAddresses = { addresses: [], seq: 1 };
  return g.__daigouAddresses;
}

export function listAddresses(userId: string): Address[] {
  return getStore().addresses.filter((a) => a.userId === userId);
}

export function getDefaultAddress(userId: string): Address | undefined {
  const list = listAddresses(userId);
  return list.find((a) => a.isDefault) ?? list[0];
}

export function addAddress(
  input: Omit<Address, "id" | "isDefault">,
): Address {
  const store = getStore();
  const existing = listAddresses(input.userId);
  const addr: Address = {
    ...input,
    id: `addr-${store.seq++}`,
    isDefault: existing.length === 0, // 第一筆自動設為預設
  };
  store.addresses.push(addr);
  return addr;
}

export function removeAddress(userId: string, id: string) {
  const store = getStore();
  store.addresses = store.addresses.filter(
    (a) => !(a.id === id && a.userId === userId),
  );
}

export function setDefaultAddress(userId: string, id: string) {
  for (const a of getStore().addresses) {
    if (a.userId === userId) a.isDefault = a.id === id;
  }
}
