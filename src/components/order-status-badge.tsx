import type { OrderStatus } from "@/lib/store";

const map: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING: { label: "待確認", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "已確認", cls: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "已出貨", cls: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "已完成", cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "已取消", cls: "bg-zinc-200 text-zinc-600" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = map[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
