import { auth } from "@/auth";
import { listAllOrders, type OrderStatus } from "@/lib/store";

const statusLabel: Record<OrderStatus, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  SHIPPED: "已出貨",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const orders = await listAllOrders();
  const header = [
    "訂單編號",
    "下單時間",
    "狀態",
    "顧客",
    "Email",
    "取貨人",
    "電話",
    "取貨門市",
    "門市地址",
    "商品明細",
    "小計",
    "運費",
    "合計",
    "付款方式",
    "備註",
  ];

  const rows = orders.map((o) => [
    o.orderNo,
    new Date(o.createdAt).toLocaleString("zh-TW"),
    statusLabel[o.status],
    o.userName,
    o.userEmail,
    o.recipientName,
    o.recipientPhone,
    `7-11 ${o.storeName}(#${o.storeId})`,
    o.storeAddress,
    o.items.map((i) => `${i.productTitle}${i.optionLabel ? `(${i.optionLabel})` : ""} x${i.quantity}`).join("；"),
    o.subtotal,
    o.shippingFee,
    o.totalAmount,
    "賣貨便取貨付款",
    o.customerNote ?? "",
  ]);

  // 前置 BOM 讓 Excel 正確辨識 UTF-8 中文
  const csv =
    "﻿" +
    [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${today}.csv"`,
    },
  });
}
