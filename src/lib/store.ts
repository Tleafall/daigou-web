// 訂單：存於 PostgreSQL（Order 表；品項/退換貨以 JSON 欄位保存快照）。
import { cache } from "react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adjustVariantStock, getActiveProduct } from "@/lib/product-store";
import { getSettings } from "@/lib/settings-store";
import { shippingFeeFor } from "@/lib/shipping";

export type OrderStatus =
  | "PENDING" // 待確認
  | "CONFIRMED" // 已確認
  | "SHIPPED" // 已出貨
  | "COMPLETED" // 已完成
  | "CANCELLED"; // 已取消

export type OrderItem = {
  productSlug: string;
  productTitle: string;
  variantId: string;
  optionLabel: string; // 例："顏色：紅、尺寸：M"
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  gradient: [string, string];
};

export type Order = {
  orderNo: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: OrderStatus;
  cancelledBy?: "customer" | "admin";
  abandoned?: boolean; // 貨到付款棄單/拒收
  cancellationReason?: string;
  previousStatus?: OrderStatus; // 取消前的狀態，供復原用
  returnRequest?: { reason: string; createdAt: string }; // 退換貨申請
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  // 賣貨便 7-11 取貨門市（取代原宅配地址）
  storeId: string;
  storeName: string;
  storeAddress: string;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
};

function json(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

type OrderRow = {
  orderNo: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  cancelledBy: string | null;
  abandoned: boolean;
  cancellationReason: string | null;
  previousStatus: string | null;
  returnRequest: Prisma.JsonValue;
  items: Prisma.JsonValue;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  customerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toOrder(r: OrderRow): Order {
  return {
    orderNo: r.orderNo,
    userId: r.userId,
    userEmail: r.userEmail,
    userName: r.userName,
    status: r.status as OrderStatus,
    cancelledBy: (r.cancelledBy as "customer" | "admin" | null) ?? undefined,
    abandoned: r.abandoned,
    cancellationReason: r.cancellationReason ?? undefined,
    previousStatus: (r.previousStatus as OrderStatus | null) ?? undefined,
    returnRequest:
      (r.returnRequest as unknown as { reason: string; createdAt: string } | null) ??
      undefined,
    items: r.items as unknown as OrderItem[],
    subtotal: r.subtotal,
    shippingFee: r.shippingFee,
    codFee: r.codFee,
    totalAmount: r.totalAmount,
    recipientName: r.recipientName,
    recipientPhone: r.recipientPhone,
    storeId: r.storeId,
    storeName: r.storeName,
    storeAddress: r.storeAddress,
    customerNote: r.customerNote ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// 訂單編號：D + 今天日期 + 4 碼流水號（流水號存 Counter 表，全域遞增）
async function nextSeq(): Promise<number> {
  const c = await prisma.counter.upsert({
    where: { name: "orderNo" },
    create: { name: "orderNo", value: 1 },
    update: { value: { increment: 1 } },
  });
  return c.value;
}

function orderNoFromSeq(seq: number): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  return `D${ymd}${String(seq).padStart(4, "0")}`;
}

// ---- 查詢 ----
// 以 React cache 於單次請求內去重（多處衍生統計會重複讀全部訂單）
const allOrders = cache(async (): Promise<Order[]> => {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toOrder);
});

export async function listAllOrders(): Promise<Order[]> {
  return allOrders();
}

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  return (await allOrders()).filter((o) => o.userId === userId);
}

export async function getOrder(orderNo: string): Promise<Order | undefined> {
  return (await allOrders()).find((o) => o.orderNo === orderNo);
}

// 商品累計賣出數量（不計已取消訂單）
export async function soldCountForProduct(slug: string): Promise<number> {
  let n = 0;
  for (const o of await allOrders()) {
    if (o.status === "CANCELLED") continue;
    for (const it of o.items) if (it.productSlug === slug) n += it.quantity;
  }
  return n;
}

// 依後台設定，回傳商品旁要顯示的文字（已售 / 剩餘 / 不顯示）
export async function productCountLabel(
  slug: string,
  totalStock: number,
): Promise<string | null> {
  const s = await getSettings();
  if (s.productCountDisplay === "sold") return `已售 ${await soldCountForProduct(slug)}`;
  if (s.productCountDisplay === "stock") {
    // 只在庫存低於門檻時顯示「僅剩 X 件」催單；庫存充足或 0 都不顯示
    return totalStock > 0 && totalStock <= s.lowStockThreshold
      ? `僅剩 ${totalStock} 件`
      : null;
  }
  return null;
}

export type CustomerSummary = { userId: string; userName: string; userEmail: string };

// 從訂單推導出所有下過單的顧客（去重）
export async function listCustomers(): Promise<CustomerSummary[]> {
  const map = new Map<string, CustomerSummary>();
  for (const o of await allOrders()) {
    if (!map.has(o.userId)) {
      map.set(o.userId, { userId: o.userId, userName: o.userName, userEmail: o.userEmail });
    }
  }
  return [...map.values()];
}

// ---- 建立訂單 ----
export type NewOrderItemInput = { productSlug: string; variantId: string; quantity: number };

export type CreateOrderInput = {
  userId: string;
  userEmail: string;
  userName: string;
  items: NewOrderItemInput[];
  recipientName: string;
  recipientPhone: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  customerNote?: string;
};

export const COD_MAX = 10000; // 取貨付款單筆上限
export const MAX_QTY = 10; // 單一商品購買上限
export const FREE_SHIPPING = 1000;
export const SHIPPING_FEE = 100;

export type CreateOrderResult =
  | { ok: true; orderNo: string }
  | { ok: false; error: string };

// 價格一律以伺服器端重算，不信任前端傳入
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.items.length === 0) return { ok: false, error: "購物車是空的" };

  const items: OrderItem[] = [];
  for (const line of input.items) {
    const product = await getActiveProduct(line.productSlug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) return { ok: false, error: "商品已下架或不存在" };
    if (line.quantity < 1 || line.quantity > MAX_QTY)
      return { ok: false, error: `每項商品最多購買 ${MAX_QTY} 件` };
    if (variant.stock < line.quantity)
      return { ok: false, error: `「${product.title}」庫存不足` };

    const optionLabel = Object.entries(variant.options)
      .map(([k, v]) => `${k}：${v}`)
      .join("、");
    items.push({
      productSlug: product.slug,
      productTitle: product.title,
      variantId: variant.id,
      optionLabel,
      unitPrice: variant.price,
      quantity: line.quantity,
      lineTotal: variant.price * line.quantity,
      gradient: product.gradient,
    });
  }

  const settings = await getSettings();
  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const shippingFee = shippingFeeFor(subtotal, settings);
  const totalAmount = subtotal + shippingFee;

  if (totalAmount > COD_MAX)
    return { ok: false, error: `取貨付款單筆上限為 NT$${COD_MAX.toLocaleString("zh-TW")}` };

  const orderNo = orderNoFromSeq(await nextSeq());
  await prisma.order.create({
    data: {
      orderNo,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      status: "PENDING",
      items: json(items),
      subtotal,
      shippingFee,
      codFee: 0,
      totalAmount,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      storeId: input.storeId,
      storeName: input.storeName,
      storeAddress: input.storeAddress,
      customerNote: input.customerNote ?? null,
    },
  });

  // 下單即扣庫存（並記錄異動）
  for (const it of items) {
    await adjustVariantStock(it.variantId, -it.quantity, "SALE", "下單扣庫存", orderNo);
  }

  return { ok: true, orderNo };
}

// ---- 狀態轉換（集中控管，禁止任意跳） ----
type TransitionResult = { ok: true } | { ok: false; error: string };

export async function adminAdvance(
  orderNo: string,
  action: "confirm" | "ship" | "complete",
): Promise<TransitionResult> {
  const o = await prisma.order.findUnique({ where: { orderNo } });
  if (!o) return { ok: false, error: "訂單不存在" };
  const map: Record<typeof action, [OrderStatus, OrderStatus]> = {
    confirm: ["PENDING", "CONFIRMED"],
    ship: ["CONFIRMED", "SHIPPED"],
    complete: ["SHIPPED", "COMPLETED"],
  };
  const [from, to] = map[action];
  if (o.status !== from) return { ok: false, error: `目前狀態無法執行此操作` };
  await prisma.order.update({ where: { orderNo }, data: { status: to } });
  return { ok: true };
}

// 回上一步：把狀態往回退一格（防止誤觸，例如不小心點成已完成）。
// 只在正常流程 CONFIRMED/SHIPPED/COMPLETED 之間回退；不影響庫存
// （庫存是在建立訂單時就扣、取消時才回補，狀態前後移動不動庫存）。
export async function adminRevert(orderNo: string): Promise<TransitionResult> {
  const o = await prisma.order.findUnique({ where: { orderNo } });
  if (!o) return { ok: false, error: "訂單不存在" };
  const back: Record<string, OrderStatus> = {
    CONFIRMED: "PENDING",
    SHIPPED: "CONFIRMED",
    COMPLETED: "SHIPPED",
  };
  const to = back[o.status];
  if (!to) return { ok: false, error: "目前狀態無法回上一步" };
  await prisma.order.update({ where: { orderNo }, data: { status: to } });
  return { ok: true };
}

export async function cancelOrder(
  orderNo: string,
  by: "customer" | "admin",
  reason: string,
  opts?: { abandoned?: boolean },
): Promise<TransitionResult> {
  const o = await prisma.order.findUnique({ where: { orderNo } });
  if (!o) return { ok: false, error: "訂單不存在" };

  if (opts?.abandoned) {
    // 棄單/拒收：僅已出貨可標記
    if (o.status !== "SHIPPED")
      return { ok: false, error: "僅已出貨的訂單可標記棄單/拒收" };
  } else {
    // 一般取消：僅待確認/已確認且尚未出貨
    if (o.status !== "PENDING" && o.status !== "CONFIRMED")
      return { ok: false, error: "此訂單狀態無法取消" };
  }

  await prisma.order.update({
    where: { orderNo },
    data: {
      previousStatus: o.status, // 記住取消前狀態，供復原
      status: "CANCELLED",
      cancelledBy: by,
      cancellationReason: reason,
      abandoned: opts?.abandoned ?? false,
    },
  });

  // 取消/棄單回補庫存
  const items = o.items as unknown as OrderItem[];
  for (const it of items) {
    await adjustVariantStock(
      it.variantId,
      it.quantity,
      "CANCEL",
      opts?.abandoned ? "棄單回補庫存" : "取消回補庫存",
      o.orderNo,
    );
  }
  return { ok: true };
}

// 復原已取消/棄單的訂單，回到取消前的狀態
export async function restoreOrder(orderNo: string): Promise<TransitionResult> {
  const o = await prisma.order.findUnique({ where: { orderNo } });
  if (!o) return { ok: false, error: "訂單不存在" };
  if (o.status !== "CANCELLED") return { ok: false, error: "僅已取消的訂單可復原" };

  await prisma.order.update({
    where: { orderNo },
    data: {
      status: (o.previousStatus as OrderStatus | null) ?? "PENDING",
      cancelledBy: null,
      abandoned: false,
      cancellationReason: null,
      previousStatus: null,
    },
  });

  // 復原訂單：重新扣回庫存
  const items = o.items as unknown as OrderItem[];
  for (const it of items) {
    await adjustVariantStock(it.variantId, -it.quantity, "SALE", "訂單復原扣庫存", o.orderNo);
  }
  return { ok: true };
}

export async function requestReturn(
  orderNo: string,
  reason: string,
): Promise<TransitionResult> {
  const o = await prisma.order.findUnique({ where: { orderNo } });
  if (!o) return { ok: false, error: "訂單不存在" };
  if (o.status !== "SHIPPED" && o.status !== "COMPLETED")
    return { ok: false, error: "僅已出貨/已完成的訂單可申請退換貨" };
  await prisma.order.update({
    where: { orderNo },
    data: { returnRequest: json({ reason, createdAt: new Date().toISOString() }) },
  });
  return { ok: true };
}

// ---- 客戶風險分數（僅賣家可見） ----
export type RiskProfile = {
  totalOrders: number;
  completedOrders: number;
  customerCancelCount: number;
  codAbandonCount: number;
  score: number;
  level: "low" | "watch" | "high";
};

export async function riskForUser(userId: string): Promise<RiskProfile> {
  const orders = (await allOrders()).filter((o) => o.userId === userId);
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
  const customerCancelCount = orders.filter(
    (o) => o.status === "CANCELLED" && o.cancelledBy === "customer",
  ).length;
  const codAbandonCount = orders.filter((o) => o.abandoned).length;
  const score = Math.max(
    0,
    Math.min(100, 100 + completedOrders * 2 - customerCancelCount * 10 - codAbandonCount * 25),
  );
  const level: RiskProfile["level"] = score >= 70 ? "low" : score >= 40 ? "watch" : "high";
  return {
    totalOrders: orders.length,
    completedOrders,
    customerCancelCount,
    codAbandonCount,
    score,
    level,
  };
}
