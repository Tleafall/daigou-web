"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  adminAdvance,
  cancelOrder,
  createOrder,
  getOrder,
  type CreateOrderResult,
} from "@/lib/store";

export type CheckoutInput = {
  items: { productSlug: string; variantId: string; quantity: number }[];
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  addressLine: string;
  customerNote?: string;
};

export async function createOrderAction(
  input: CheckoutInput,
): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "請先登入" };

  const name = input.recipientName?.trim();
  const phone = input.recipientPhone?.trim();
  if (!name) return { ok: false, error: "請填寫收件人姓名" };
  if (!/^09\d{8}$/.test(phone))
    return { ok: false, error: "手機號碼格式不正確（需為 09 開頭共 10 碼）" };
  if (!input.city?.trim() || !input.district?.trim() || !input.addressLine?.trim())
    return { ok: false, error: "請填寫完整收件地址" };

  return createOrder({
    userId: session.user.id ?? session.user.email ?? "unknown",
    userEmail: session.user.email ?? "",
    userName: session.user.name ?? "會員",
    items: input.items,
    recipientName: name,
    recipientPhone: phone,
    city: input.city.trim(),
    district: input.district.trim(),
    addressLine: input.addressLine.trim(),
    customerNote: input.customerNote?.trim() || undefined,
  });
}

// 會員取消自己的訂單
export async function customerCancelOrderAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("未登入");
  const orderNo = String(formData.get("orderNo"));
  const order = getOrder(orderNo);
  const uid = session.user.id ?? session.user.email;
  if (!order || order.userId !== uid) throw new Error("無權操作此訂單");
  cancelOrder(orderNo, "customer", "會員自行取消");
  revalidatePath(`/account/orders/${orderNo}`);
  revalidatePath("/account/orders");
}

// ---- 後台操作（僅 ADMIN） ----
async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

function revalidateAdmin(orderNo: string) {
  revalidatePath(`/admin/orders/${orderNo}`);
  revalidatePath("/admin/orders");
}

export async function adminConfirmAction(formData: FormData) {
  await assertAdmin();
  const orderNo = String(formData.get("orderNo"));
  adminAdvance(orderNo, "confirm");
  revalidateAdmin(orderNo);
}

export async function adminShipAction(formData: FormData) {
  await assertAdmin();
  const orderNo = String(formData.get("orderNo"));
  adminAdvance(orderNo, "ship");
  revalidateAdmin(orderNo);
}

export async function adminCompleteAction(formData: FormData) {
  await assertAdmin();
  const orderNo = String(formData.get("orderNo"));
  adminAdvance(orderNo, "complete");
  revalidateAdmin(orderNo);
}

export async function adminCancelAction(formData: FormData) {
  await assertAdmin();
  const orderNo = String(formData.get("orderNo"));
  const reason = String(formData.get("reason") || "管理員取消");
  cancelOrder(orderNo, "admin", reason);
  revalidateAdmin(orderNo);
}

export async function adminAbandonAction(formData: FormData) {
  await assertAdmin();
  const orderNo = String(formData.get("orderNo"));
  const reason = String(formData.get("reason") || "貨到付款棄單/拒收");
  cancelOrder(orderNo, "admin", reason, { abandoned: true });
  revalidateAdmin(orderNo);
}
