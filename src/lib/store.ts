// ⚠️ 原型用「伺服器記憶體」訂單庫。重啟伺服器會清空。
// 之後接 Neon + Prisma 後，這層會換成資料庫（介面刻意貼近未來做法）。
import { adjustVariantStock, getActiveProduct } from "@/lib/product-store";

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
  city: string;
  district: string;
  addressLine: string;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
};

type Store = { orders: Order[]; seq: number };

const g = globalThis as unknown as { __daigouStore?: Store };

function getStore(): Store {
  if (!g.__daigouStore) {
    g.__daigouStore = { orders: [], seq: 1 };
    seed(g.__daigouStore);
  }
  return g.__daigouStore;
}

function genOrderNo(store: Store): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const n = String(store.seq++).padStart(4, "0");
  return `D${ymd}${n}`;
}

// ---- 查詢 ----
export function listAllOrders(): Order[] {
  return [...getStore().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listOrdersByUser(userId: string): Order[] {
  return listAllOrders().filter((o) => o.userId === userId);
}

export function getOrder(orderNo: string): Order | undefined {
  return getStore().orders.find((o) => o.orderNo === orderNo);
}

export type CustomerSummary = { userId: string; userName: string; userEmail: string };

// 從訂單推導出所有下過單的顧客（去重）
export function listCustomers(): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of getStore().orders) {
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
  city: string;
  district: string;
  addressLine: string;
  customerNote?: string;
};

export const COD_MAX = 10000; // 貨到付款單筆上限
export const MAX_QTY = 10; // 單一商品購買上限
export const FREE_SHIPPING = 1000;
export const SHIPPING_FEE = 100;

export type CreateOrderResult =
  | { ok: true; orderNo: string }
  | { ok: false; error: string };

// 價格一律以伺服器端（此處為 mock-data）重算，不信任前端傳入
export function createOrder(input: CreateOrderInput): CreateOrderResult {
  if (input.items.length === 0) return { ok: false, error: "購物車是空的" };

  const items: OrderItem[] = [];
  for (const line of input.items) {
    const product = getActiveProduct(line.productSlug);
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

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const shippingFee = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  const totalAmount = subtotal + shippingFee;

  if (totalAmount > COD_MAX)
    return { ok: false, error: `貨到付款單筆上限為 NT$${COD_MAX.toLocaleString("zh-TW")}` };

  const store = getStore();
  const now = new Date().toISOString();
  const order: Order = {
    orderNo: genOrderNo(store),
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    status: "PENDING",
    items,
    subtotal,
    shippingFee,
    codFee: 0,
    totalAmount,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    city: input.city,
    district: input.district,
    addressLine: input.addressLine,
    customerNote: input.customerNote,
    createdAt: now,
    updatedAt: now,
  };

  // 下單即扣庫存（並記錄異動）
  for (const it of items) {
    adjustVariantStock(it.variantId, -it.quantity, "SALE", "下單扣庫存", order.orderNo);
  }

  store.orders.push(order);
  return { ok: true, orderNo: order.orderNo };
}

// ---- 狀態轉換（集中控管，禁止任意跳） ----
type TransitionResult = { ok: true } | { ok: false; error: string };

function touch(o: Order) {
  o.updatedAt = new Date().toISOString();
}

export function adminAdvance(
  orderNo: string,
  action: "confirm" | "ship" | "complete",
): TransitionResult {
  const o = getOrder(orderNo);
  if (!o) return { ok: false, error: "訂單不存在" };
  const map: Record<typeof action, [OrderStatus, OrderStatus]> = {
    confirm: ["PENDING", "CONFIRMED"],
    ship: ["CONFIRMED", "SHIPPED"],
    complete: ["SHIPPED", "COMPLETED"],
  };
  const [from, to] = map[action];
  if (o.status !== from)
    return { ok: false, error: `目前狀態無法執行此操作` };
  o.status = to;
  touch(o);
  return { ok: true };
}

export function cancelOrder(
  orderNo: string,
  by: "customer" | "admin",
  reason: string,
  opts?: { abandoned?: boolean },
): TransitionResult {
  const o = getOrder(orderNo);
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
  o.previousStatus = o.status; // 記住取消前狀態，供復原
  o.status = "CANCELLED";
  o.cancelledBy = by;
  o.cancellationReason = reason;
  o.abandoned = opts?.abandoned ?? false;
  // 取消/棄單回補庫存
  for (const it of o.items) {
    adjustVariantStock(
      it.variantId,
      it.quantity,
      "CANCEL",
      opts?.abandoned ? "棄單回補庫存" : "取消回補庫存",
      o.orderNo,
    );
  }
  touch(o);
  return { ok: true };
}

// 復原已取消/棄單的訂單，回到取消前的狀態
export function restoreOrder(orderNo: string): TransitionResult {
  const o = getOrder(orderNo);
  if (!o) return { ok: false, error: "訂單不存在" };
  if (o.status !== "CANCELLED") return { ok: false, error: "僅已取消的訂單可復原" };
  o.status = o.previousStatus ?? "PENDING";
  o.cancelledBy = undefined;
  o.abandoned = false;
  o.cancellationReason = undefined;
  o.previousStatus = undefined;
  // 復原訂單：重新扣回庫存
  for (const it of o.items) {
    adjustVariantStock(it.variantId, -it.quantity, "SALE", "訂單復原扣庫存", o.orderNo);
  }
  touch(o);
  return { ok: true };
}

export function requestReturn(orderNo: string, reason: string): TransitionResult {
  const o = getOrder(orderNo);
  if (!o) return { ok: false, error: "訂單不存在" };
  if (o.status !== "SHIPPED" && o.status !== "COMPLETED")
    return { ok: false, error: "僅已出貨/已完成的訂單可申請退換貨" };
  o.returnRequest = { reason, createdAt: new Date().toISOString() };
  touch(o);
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

export function riskForUser(userId: string): RiskProfile {
  const orders = getStore().orders.filter((o) => o.userId === userId);
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

// ---- 示範種子資料（讓後台/我的訂單一開始就有東西看） ----
function seed(store: Store) {
  const now = Date.now();
  const mk = (
    over: Partial<Order> & Pick<Order, "items" | "status">,
    minsAgo: number,
  ): Order => {
    const subtotal = over.items.reduce((s, it) => s + it.lineTotal, 0);
    const shippingFee = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
    const ts = new Date(now - minsAgo * 60000).toISOString();
    return {
      orderNo: genOrderNo(store),
      userId: "u-customer",
      userEmail: "customer@test.com",
      userName: "測試顧客",
      subtotal,
      shippingFee,
      codFee: 0,
      totalAmount: subtotal + shippingFee,
      recipientName: "王小明",
      recipientPhone: "0912345678",
      city: "台北市",
      district: "大安區",
      addressLine: "復興南路一段 100 號 5 樓",
      createdAt: ts,
      updatedAt: ts,
      ...over,
    };
  };

  const item = (
    slug: string,
    title: string,
    variantId: string,
    optionLabel: string,
    unitPrice: number,
    qty: number,
    gradient: [string, string],
  ): OrderItem => ({
    productSlug: slug,
    productTitle: title,
    variantId,
    optionLabel,
    unitPrice,
    quantity: qty,
    lineTotal: unitPrice * qty,
    gradient,
  });

  store.orders.push(
    mk(
      {
        status: "PENDING",
        items: [item("p5", "純棉寬鬆落肩上衣", "p5-v1", "顏色：米白、尺寸：S", 590, 1, ["#d7ecff", "#8fc4ff"])],
      },
      30,
    ),
    mk(
      {
        status: "SHIPPED",
        items: [item("p17", "無線藍牙耳機", "p17-v1", "顏色：白", 1590, 1, ["#dfe3ff", "#a2acff"])],
      },
      600,
    ),
    mk(
      {
        status: "COMPLETED",
        items: [item("p1", "日本溫和胺基酸洗面乳", "p1-v1", "容量：120ml", 390, 2, ["#ffd9c7", "#ff9e7d"])],
      },
      4320,
    ),
  );
}
