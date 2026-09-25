// 網站設定：存於 PostgreSQL（SiteSettings 單列，id = "singleton"）。
// 後台改的設定會永久保留；尚未初始化時回退到 src/lib/site.ts 的預設值。
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

export type Settings = {
  name: string;
  tagline: string;
  announcement: string;
  freeShippingThreshold: number;
  shippingFee: number;
  lineId: string;
  lineUrl: string; // 官方 LINE 加入好友連結
  email: string;
  productCountDisplay: "none" | "sold" | "stock"; // 商品旁顯示：不顯示/已售數/剩餘數
  lowStockThreshold: number; // 「剩餘」模式：庫存 ≤ 此數才顯示（催單）
  botEnabled: boolean; // 客服自動回覆是否啟用（客服已改用官方 LINE，保留欄位）
  botMessage: string;
  promoEnabled: boolean; // 促銷活動橫幅開關
  promoText: string; // 活動文字（橫幅會在後面自動接「・僅剩 X 名」）
  promoRemaining: number; // 剩餘名額；下單自動 -1、可手動調整；≤0 自動收起
};

export const DEFAULTS: Settings = {
  name: site.name,
  tagline: site.tagline,
  announcement: site.announcement,
  freeShippingThreshold: site.freeShippingThreshold,
  shippingFee: site.shippingFee,
  lineId: site.lineId,
  lineUrl: site.lineUrl,
  email: site.email,
  productCountDisplay: "none",
  lowStockThreshold: 5,
  botEnabled: false,
  botMessage: "您好，感謝來訊！小幫手先為您服務，賣家看到後會盡快親自回覆您 😊",
  promoEnabled: false,
  promoText: "🎁 開幕慶・前 10 名下單送小禮",
  promoRemaining: 10,
};

// 讀取（未初始化回預設）；以 React cache 於單次請求內去重，避免列表 N+1 查詢
export const getSettings = cache(async (): Promise<Settings> => {
  const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return { ...DEFAULTS };
  return {
    name: row.name,
    tagline: row.tagline,
    announcement: row.announcement,
    freeShippingThreshold: row.freeShippingThreshold,
    shippingFee: row.shippingFee,
    lineId: row.lineId,
    lineUrl: row.lineUrl,
    email: row.email,
    productCountDisplay: row.productCountDisplay as Settings["productCountDisplay"],
    lowStockThreshold: row.lowStockThreshold,
    botEnabled: row.botEnabled,
    botMessage: row.botMessage,
    promoEnabled: row.promoEnabled,
    promoText: row.promoText,
    promoRemaining: row.promoRemaining,
  };
});

export async function updateSettings(patch: Partial<Settings>) {
  const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const current: Settings = row
    ? {
        name: row.name,
        tagline: row.tagline,
        announcement: row.announcement,
        freeShippingThreshold: row.freeShippingThreshold,
        shippingFee: row.shippingFee,
        lineId: row.lineId,
        lineUrl: row.lineUrl,
        email: row.email,
        productCountDisplay: row.productCountDisplay as Settings["productCountDisplay"],
        lowStockThreshold: row.lowStockThreshold,
        botEnabled: row.botEnabled,
        botMessage: row.botMessage,
        promoEnabled: row.promoEnabled,
        promoText: row.promoText,
        promoRemaining: row.promoRemaining,
      }
    : { ...DEFAULTS };
  const next = { ...current, ...patch };
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...next },
    update: next,
  });
}

// 下單時把促銷剩餘名額 -1（只在活動開啟且還有名額時）。
// 用單一條件式 UPDATE：不會扣成負數、也避免同時多筆訂單互相蓋掉。
export async function decrementPromoRemaining(): Promise<void> {
  try {
    await prisma.siteSettings.updateMany({
      where: { id: "singleton", promoEnabled: true, promoRemaining: { gt: 0 } },
      data: { promoRemaining: { decrement: 1 } },
    });
  } catch {
    /* 促銷計數為輔助功能，失敗不影響下單 */
  }
}
