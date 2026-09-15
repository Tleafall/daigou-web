"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isBlocked } from "@/lib/customer-store";
import { getStoreById } from "@/lib/stores-711";
import {
  adminAdvance,
  cancelOrder,
  createOrder,
  getOrder,
  requestReturn,
  restoreOrder,
  type CreateOrderResult,
} from "@/lib/store";

export type CheckoutInput = {
  items: { productSlug: string; variantId: string; quantity: number }[];
  recipientName: string;
  recipientPhone: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  customerNote?: string;
};

export async function createOrderAction(
  input: CheckoutInput,
): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "請先登入" };

  const userId = session.user.id ?? session.user.email ?? "unknown";
  if (isBlocked(userId))
    return { ok: false, error: "此帳號目前無法下單，請聯繫客服。" };

  const name = input.recipientName?.trim();
  const phone = input.recipientPhone?.trim();
  if (!name) return { ok: false, error: "請填寫收件人姓名" };
  if (!/^09\d{8}$/.test(phone))
    return { ok: false, error: "手機號碼格式不正確（需為 09 開頭共 10 碼）" };

  // 以伺服器端門市清單重新核對，不信任前端傳入的門市名稱/地址
  const store = getStoreById(input.storeId?.trim() ?? "");
  if (!store) return { ok: false, error: "請選擇取貨門市" };

  return createOrder({
    userId,
    userEmail: session.user.email ?? "",
    userName: session.user.name ?? "會員",
    items: input.items,
    recipientName: name,
    recipientPhone: phone,
    storeId: store.id,
    storeName: store.name,
    storeAddress: store.addr,
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

// 會員申請退換貨
export async function customerReturnRequestAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("未登入");
  const orderNo = String(formData.get("orderNo"));
  const order = getOrder(orderNo);
  const uid = session.user.id ?? session.user.email;
  if (!order || order.userId !== uid) throw new Error("無權操作此訂單");
  const reason = String(formData.get("reason") || "").trim() || "未填原因";
  requestReturn(orderNo, reason);
  revalidatePath(`/account/orders/${orderNo}`);
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

export async function adminRestoreAction(formData: FormData) {
  await assertAdmin();
  const orderNo = String(formData.get("orderNo"));
  restoreOrder(orderNo);
  revalidateAdmin(orderNo);
}
