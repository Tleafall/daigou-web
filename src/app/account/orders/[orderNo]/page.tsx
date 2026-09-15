import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getOrder } from "@/lib/store";
import { formatTWD } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderProgress } from "@/components/order-progress";
import {
  customerCancelOrderAction,
  customerReturnRequestAction,
} from "@/lib/order-actions";

export const metadata: Metadata = { title: "訂單明細" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const user = await requireUser();
  const { orderNo } = await params;
  const order = getOrder(orderNo);
  if (!order || order.userId !== (user.id ?? user.email)) notFound();

  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
  const canReturn = order.status === "SHIPPED" || order.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/account/orders" className="hover:text-brand">我的訂單</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{order.orderNo}</span>
      </nav>

      {order.status === "PENDING" && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ 訂單已成立，等待賣家確認。商品將寄到您選的 7-11 門市，到店取貨付款。
        </div>
      )}

      <div className="rounded-xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-ink/70">{order.orderNo}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-1 text-xs text-ink/40">
          下單時間：{new Date(order.createdAt).toLocaleString("zh-TW")}
        </div>

        <div className="mt-5">
          <OrderProgress status={order.status} abandoned={order.abandoned} />
        </div>

        {/* 品項 */}
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex gap-3">
              <div
                className="h-14 w-14 shrink-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${it.gradient[0]}, ${it.gradient[1]})` }}
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">{it.productTitle}</div>
                {it.optionLabel && <div className="text-xs text-ink/50">{it.optionLabel}</div>}
                <div className="text-xs text-ink/50">
                  {formatTWD(it.unitPrice)} × {it.quantity}
                </div>
              </div>
              <div className="text-sm font-medium">{formatTWD(it.lineTotal)}</div>
            </div>
          ))}
        </div>

        {/* 金額 */}
        <div className="mt-4 border-t border-line pt-4 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-ink/60">商品小計</span>
            <span>{formatTWD(order.subtotal)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-ink/60">運費</span>
            <span>{order.shippingFee === 0 ? "免運" : formatTWD(order.shippingFee)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-line pt-2 font-bold">
            <span>應付金額（取貨付款）</span>
            <span className="text-brand">{formatTWD(order.totalAmount)}</span>
          </div>
        </div>

        {/* 取貨資料 */}
        <div className="mt-4 border-t border-line pt-4 text-sm text-ink/70">
          <div className="mb-1 font-medium text-ink">取貨資料</div>
          <div>{order.recipientName}　{order.recipientPhone}</div>
          <div className="mt-1">
            7-11 {order.storeName}
            <span className="ml-2 font-mono text-xs text-ink/40">#{order.storeId}</span>
          </div>
          <div className="text-ink/50">{order.storeAddress}</div>
          {order.customerNote && <div className="mt-1 text-ink/50">備註：{order.customerNote}</div>}
        </div>

        {order.status === "CANCELLED" && order.cancellationReason && (
          <div className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-ink/60">
            取消原因：{order.cancellationReason}
          </div>
        )}
      </div>

      {canCancel && (
        <form action={customerCancelOrderAction} className="mt-4">
          <input type="hidden" name="orderNo" value={order.orderNo} />
          <button className="rounded-full border border-line px-5 py-2 text-sm text-ink/70 hover:border-red-400 hover:text-red-500">
            取消訂單
          </button>
        </form>
      )}

      {/* 退換貨 */}
      {order.returnRequest ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          已申請退換貨（{new Date(order.returnRequest.createdAt).toLocaleString("zh-TW")}）
          <div className="mt-1 text-amber-600">原因：{order.returnRequest.reason}</div>
          <div className="mt-1 text-xs text-amber-600/80">賣家將盡快與您聯繫。</div>
        </div>
      ) : (
        canReturn && (
          <form action={customerReturnRequestAction} className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
            <div className="text-sm font-medium">申請退換貨</div>
            <input type="hidden" name="orderNo" value={order.orderNo} />
            <input
              name="reason"
              placeholder="請說明退換貨原因"
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button className="self-start rounded-full border border-line px-5 py-2 text-sm text-ink/70 hover:border-brand hover:text-brand">
              送出申請
            </button>
          </form>
        )
      )}
    </div>
  );
}
