"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addAddress, removeAddress, setDefaultAddress } from "@/lib/address-store";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("未登入");
  return session.user.id ?? session.user.email ?? "unknown";
}

export async function addAddressAction(formData: FormData) {
  const userId = await requireUserId();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const district = String(formData.get("district") || "").trim();
  const addressLine = String(formData.get("addressLine") || "").trim();

  if (!recipientName || !/^09\d{8}$/.test(recipientPhone) || !city || !district || !addressLine) {
    return; // 前端已有 required；不合格則不新增
  }

  await addAddress({ userId, recipientName, recipientPhone, city, district, addressLine });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function removeAddressAction(formData: FormData) {
  const userId = await requireUserId();
  await removeAddress(userId, String(formData.get("id")));
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function setDefaultAddressAction(formData: FormData) {
  const userId = await requireUserId();
  await setDefaultAddress(userId, String(formData.get("id")));
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
