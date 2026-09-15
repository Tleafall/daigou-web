import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listOrdersByUser } from "@/lib/store";
import { formatTWD } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "我的訂單" };

export default async function MyOrdersPage() {
  const user = await requireUser();
  const orders = await listOrdersByUser(user.id ?? user.email ?? "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/account" className="hover:text-brand">會員中心</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">我的訂單</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">我的訂單</h1>

      {orders.length === 0 ? (
        <EmptyState emoji="📦" title="目前沒有訂單" subtitle="下單後就會顯示在這裡">
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            去逛逛
          </Link>
        </EmptyState>
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
