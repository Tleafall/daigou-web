import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listOrdersByUser } from "@/lib/store";
import { formatTWD } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const metadata: Metadata = { title: "我的訂單" };

export default async function MyOrdersPage() {
  const user = await requireUser();
  const orders = listOrdersByUser(user.id ?? user.email ?? "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/account" className="hover:text-brand">會員中心</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">我的訂單</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">我的訂單</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          目前沒有訂單
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.orderNo}
              href={`/account/orders/${o.orderNo}`}
              className="rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-ink/70">{o.orderNo}</span>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-2 text-sm text-ink/60">
                {o.items.map((i) => i.productTitle).join("、")}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-ink/40">
                  {new Date(o.createdAt).toLocaleString("zh-TW")}
                </span>
                <span className="font-bold text-brand">{formatTWD(o.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
