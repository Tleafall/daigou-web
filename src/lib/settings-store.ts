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
  email: string;
  showSoldCount: boolean; // 是否在商品旁顯示賣出數量
};

const DEFAULTS: Settings = {
  name: site.name,
  tagline: site.tagline,
  announcement: site.announcement,
  freeShippingThreshold: site.freeShippingThreshold,
  shippingFee: site.shippingFee,
  lineId: site.lineId,
  email: site.email,
  showSoldCount: false,
};

const g = globalThis as unknown as { __daigouSettings?: Settings };

export function getSettings(): Settings {
  if (!g.__daigouSettings) g.__daigouSettings = { ...DEFAULTS };
  return g.__daigouSettings;
}

export function updateSettings(patch: Partial<Settings>) {
  g.__daigouSettings = { ...getSettings(), ...patch };
}
