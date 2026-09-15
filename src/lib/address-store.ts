// 常用收件地址（宅配用）：存於 PostgreSQL（Address 表）。
// 目前結帳走 7-11 賣貨便門市，此地址簿保留供日後宅配選項。
import { prisma } from "@/lib/prisma";

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

function toAddress(r: {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  addressLine: string;
  isDefault: boolean;
}): Address {
  return {
    id: r.id,
    userId: r.userId,
    recipientName: r.recipientName,
    recipientPhone: r.recipientPhone,
    city: r.city,
    district: r.district,
    addressLine: r.addressLine,
    isDefault: r.isDefault,
  };
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toAddress);
}

export async function getDefaultAddress(userId: string): Promise<Address | undefined> {
  const list = await listAddresses(userId);
  return list.find((a) => a.isDefault) ?? list[0];
}

export async function addAddress(
  input: Omit<Address, "id" | "isDefault">,
): Promise<Address> {
  const existing = await prisma.address.count({ where: { userId: input.userId } });
  const row = await prisma.address.create({
    data: {
      userId: input.userId,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      city: input.city,
      district: input.district,
      addressLine: input.addressLine,
      isDefault: existing === 0, // 第一筆自動設為預設
    },
  });
  return toAddress(row);
}

export async function removeAddress(userId: string, id: string) {
  await prisma.address.deleteMany({ where: { id, userId } });
}

export async function setDefaultAddress(userId: string, id: string) {
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { userId, id }, data: { isDefault: true } }),
  ]);
}
