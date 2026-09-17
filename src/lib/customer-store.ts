// 賣家對客戶的手動標記與備註（僅賣家可見）：存於 PostgreSQL（CustomerProfile 表）。
import { prisma } from "@/lib/prisma";
import { isOwnerEmail } from "@/lib/owner";

export type ManualFlag = "NORMAL" | "WATCH" | "BLOCKED";

export type CustomerProfile = {
  manualFlag: ManualFlag;
  sellerNote: string;
};

export async function getCustomerProfile(userId: string): Promise<CustomerProfile> {
  const r = await prisma.customerProfile.findUnique({ where: { userId } });
  return r
    ? { manualFlag: r.manualFlag as ManualFlag, sellerNote: r.sellerNote }
    : { manualFlag: "NORMAL", sellerNote: "" };
}

export async function setCustomerFlag(userId: string, flag: ManualFlag) {
  // 最高管理員（擁有者）不可被封鎖
  if (flag === "BLOCKED") {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (isOwnerEmail(u?.email)) return;
  }
  await prisma.customerProfile.upsert({
    where: { userId },
    create: { userId, manualFlag: flag },
    update: { manualFlag: flag },
  });
}

export async function setCustomerNote(userId: string, note: string) {
  await prisma.customerProfile.upsert({
    where: { userId },
    create: { userId, sellerNote: note },
    update: { sellerNote: note },
  });
}

export async function isBlocked(userId: string): Promise<boolean> {
  return (await getCustomerProfile(userId)).manualFlag === "BLOCKED";
}
