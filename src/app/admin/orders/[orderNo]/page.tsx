import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getOrder, riskForUser, type RiskProfile } from "@/lib/store";
import { formatTWD } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  adminAbandonAction,
  adminCancelAction,
  adminCompleteAction,
  adminConfirmAction,
  adminShipAction,
} from "@/lib/order-actions";

export const metadata: Metadata = { title: "訂單明細（後台）" };

const riskMeta: Record<RiskProfile["level"], { label: string; cls: string }> = {
  low: { label: "低風險", cls: "bg-green-100 text-green-700" },
  watch: { label: "觀察", cls: "bg-amber-100 text-amber-700" },
  high: { label: "高風險", cls: "bg-red-100 text-red-700" },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  await requireAdmin();
  const { orderNo } = await params;
  const order = getOrder(orderNo);
  if (!order) notFound();

  const risk = riskForUser(order.userId);
  const rm = riskMeta[risk.level];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/orders" className="hover:text-brand">訂單管理</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{order.orderNo}</span>
      </nav>

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        {/* 訂單本體 */}
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-ink/70">{order.orderNo}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-1 text-xs text-ink/40">
            {new Date(order.createdAt).toLocaleString("zh-TW")}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between gap-2 text-sm">
                <span className="text-ink/70">
                  {it.productTitle}
                  {it.optionLabel && <span className="text-ink/40">（{it.optionLabel}）</span>}
                  <span className="text-ink/40"> ×{it.quantity}</span>
                </span>
                <span>{formatTWD(it.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-line pt-3 font-bold">
            <span>應收（貨到付款）</span>
            <span className="text-brand">{formatTWD(order.totalAmount)}</span>
          </div>

          <div className="mt-4 border-t border-line pt-4 text-sm text-ink/70">
            <div className="mb-1 font-medium text-ink">收件資料</div>
            <div>{order.recipientName}　{order.recipientPhone}</div>
            <div>{order.city}{order.district}{order.addressLine}</div>
            {order.customerNote && <div className="mt-1 text-ink/50">備註：{order.customerNote}</div>}
          </div>

          {order.status === "CANCELLED" && (
            <div className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-ink/60">
              已取消{order.abandoned ? "（棄單/拒收）" : ""}
              {order.cancellationReason ? `：${order.cancellationReason}` : ""}
            </div>
          )}

          {order.returnRequest && (
            <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              ⚠️ 顧客已申請退換貨（
              {new Date(order.returnRequest.createdAt).toLocaleString("zh-TW")}）：
              {order.returnRequest.reason}
            </div>
          )}
        </div>

        {/* 側欄：風險 + 操作 */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="mb-2 text-sm font-bold">客戶風險（僅賣家可見）</div>
            <div className="text-sm text-ink/70">{order.userName}</div>
            <div className="mt-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rm.cls}`}>
                {rm.label}　分數 {risk.score}
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-ink/60">
              <li>總下單：{risk.totalOrders}</li>
              <li>完成：{risk.completedOrders}</li>
              <li>自行取消：{risk.customerCancelCount}</li>
              <li className={risk.codAbandonCount > 0 ? "font-medium text-red-500" : ""}>
                棄單/拒收：{risk.codAbandonCount}
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <div className="mb-3 text-sm font-bold">訂單操作</div>
            <div className="flex flex-col gap-2">
              {order.status === "PENDING" && (
                <form action={adminConfirmAction}>
                  <input type="hidden" name="orderNo" value={order.orderNo} />
                  <button className="w-full rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-600">
                    確認訂單
                  </button>
                </form>
              )}
              {order.status === "CONFIRMED" && (
                <form action={adminShipAction}>
                  <input type="hidden" name="orderNo" value={order.orderNo} />
                  <button className="w-full rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-600">
                    標記已出貨
                  </button>
                </form>
              )}
              {order.status === "SHIPPED" && (
                <>
                  <form action={adminCompleteAction}>
                    <input type="hidden" name="orderNo" value={order.orderNo} />
                    <button className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700">
                      完成訂單（已收款）
                    </button>
                  </form>
                  <form action={adminAbandonAction} className="mt-1 flex flex-col gap-1">
                    <input type="hidden" name="orderNo" value={order.orderNo} />
                    <input
                      name="reason"
                      placeholder="棄單/拒收原因"
                      className="rounded-lg border border-line px-2 py-1.5 text-xs outline-none focus:border-brand"
                    />
                    <button className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-500 hover:bg-red-50">
                      標記棄單 / 拒收
                    </button>
                  </form>
                </>
              )}
              {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                <form action={adminCancelAction} className="mt-1 flex flex-col gap-1">
                  <input type="hidden" name="orderNo" value={order.orderNo} />
                  <input
                    name="reason"
                    placeholder="取消原因"
                    className="rounded-lg border border-line px-2 py-1.5 text-xs outline-none focus:border-brand"
                  />
                  <button className="w-full rounded-lg border border-line py-2 text-sm text-ink/60 hover:border-red-400 hover:text-red-500">
                    取消訂單
                  </button>
                </form>
              )}
              {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
                <p className="text-xs text-ink/40">此訂單已結束，無可用操作。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
