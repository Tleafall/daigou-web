"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateSettings } from "@/lib/settings-store";

export async function updateSettingsAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");

  const toInt = (v: FormDataEntryValue | null, fallback: number) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  updateSettings({
    name: String(formData.get("name") || "").trim() || "商店",
    tagline: String(formData.get("tagline") || "").trim(),
    announcement: String(formData.get("announcement") || "").trim(),
    freeShippingThreshold: toInt(formData.get("freeShippingThreshold"), 1000),
    shippingFee: toInt(formData.get("shippingFee"), 100),
    lineId: String(formData.get("lineId") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    showSoldCount: formData.get("showSoldCount") === "on",
  });

  revalidatePath("/", "layout"); // 全站導覽/頁尾/促銷條即時更新
  redirect("/admin/settings?saved=1");
}
