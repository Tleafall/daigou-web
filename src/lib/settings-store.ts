// ⚠️ 原型用「伺服器記憶體」保存網站設定（後台可改）。重啟伺服器會回到預設值。
// 之後接 Prisma 後改存資料庫，姑姑改的設定就會永久保留。
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
  botEnabled: boolean; // 客服自動回覆是否啟用
  botMessage: string; // 自動回覆內容
};

const DEFAULTS: Settings = {
  name: site.name,
  tagline: site.tagline,
  announcement: site.announcement,
  freeShippingThreshold: site.freeShippingThreshold,
  shippingFee: site.shippingFee,
  lineId: site.lineId,
  lineUrl: "",
  email: site.email,
  productCountDisplay: "none",
  lowStockThreshold: 5,
  botEnabled: false,
  botMessage: "您好，感謝來訊！小幫手先為您服務，賣家看到後會盡快親自回覆您 😊",
};

const g = globalThis as unknown as { __daigouSettings?: Settings };

export function getSettings(): Settings {
  if (!g.__daigouSettings) g.__daigouSettings = { ...DEFAULTS };
  return g.__daigouSettings;
}

export function updateSettings(patch: Partial<Settings>) {
  g.__daigouSettings = { ...getSettings(), ...patch };
}
