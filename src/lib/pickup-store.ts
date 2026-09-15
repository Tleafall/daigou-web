// 常用取貨資料（賣貨便）：記住顧客上次的取貨人/電話/門市，結帳自動帶入。
// 每次成功下單後自動更新，顧客不用每次重打。
import { prisma } from "@/lib/prisma";

export type PickupProfile = {
  recipientName: string;
  recipientPhone: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
};

export async function getPickupProfile(userId: string): Promise<PickupProfile | null> {
  if (!userId) return null;
  const p = await prisma.pickupProfile.findUnique({ where: { userId } });
  if (!p) return null;
  return {
    recipientName: p.recipientName,
    recipientPhone: p.recipientPhone,
    storeId: p.storeId,
    storeName: p.storeName,
    storeAddress: p.storeAddress,
  };
}

export async function savePickupProfile(userId: string, data: PickupProfile) {
  if (!userId) return;
  await prisma.pickupProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });
}
