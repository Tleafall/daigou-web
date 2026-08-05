import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listAllOrders, riskForUser, type RiskProfile } from "@/lib/store";
import { formatTWD } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const metadata: Metadata = { title: "訂單管理" };

const riskMeta: Record<RiskProfile["level"], { label: string; cls: string }> = {
  low: { label: "低風險", cls: "bg-green-100 text-green-700" },
  watch: { label: "觀察", cls: "bg-amber-100 text-amber-700" },
  high: { label: "高風險", cls: "bg-red-100 text-red-700" },
};

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = listAllOrders();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">訂單管理</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">訂單管理</h1>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-muted text-left text-xs text-ink/60">
            <tr>
              <th className="px-4 py-3">訂單編號</th>
              <th className="px-4 py-3">顧客</th>
              <th className="px-4 py-3">金額</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">客戶風險</th>
              <th className="px-4 py-3">時間</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const risk = riskForUser(o.userId);
              const rm = riskMeta[risk.level];
              return (
                <tr key={o.orderNo} className="border-b border-line last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.orderNo}`} className="font-mono text-brand hover:underline">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{o.userName}</td>
                  <td className="px-4 py-3 font-medium">{formatTWD(o.totalAmount)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rm.cls}`}>
                      {rm.label} {risk.score}
                    </span>
                    {risk.codAbandonCount > 0 && (
                      <span className="ml-1 text-xs text-red-500">棄單{risk.codAbandonCount}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/50">
                    {new Date(o.createdAt).toLocaleDateString("zh-TW")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
