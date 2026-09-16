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
      }
    : { ...DEFAULTS };
  const next = { ...current, ...patch };
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...next },
    update: next,
  });
}
