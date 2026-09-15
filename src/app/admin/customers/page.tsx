import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCustomers, riskForUser, type RiskProfile } from "@/lib/store";
import { getCustomerProfile, type ManualFlag } from "@/lib/customer-store";

export const metadata: Metadata = { title: "客戶風險" };

const riskMeta: Record<RiskProfile["level"], { label: string; cls: string }> = {
  low: { label: "低風險", cls: "bg-green-100 text-green-700" },
  watch: { label: "觀察", cls: "bg-amber-100 text-amber-700" },
  high: { label: "高風險", cls: "bg-red-100 text-red-700" },
};

const flagMeta: Record<ManualFlag, { label: string; cls: string } | null> = {
  NORMAL: null,
  WATCH: { label: "觀察名單", cls: "bg-amber-100 text-amber-700" },
  BLOCKED: { label: "已封鎖", cls: "bg-red-100 text-red-700" },
};

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await listCustomers();
  const rows = await Promise.all(
    customers.map(async (c) => ({
      c,
      risk: await riskForUser(c.userId),
      profile: await getCustomerProfile(c.userId),
    })),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">客戶風險</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">客戶風險</h1>
      <p className="mb-6 text-sm text-ink/50">依訂單紀錄自動計算，僅賣家可見。</p>

      {customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          目前沒有下過單的顧客
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-line bg-muted text-left text-xs text-ink/60">
              <tr>
                <th className="px-4 py-3">顧客</th>
                <th className="px-4 py-3">風險分數</th>
                <th className="px-4 py-3">完成</th>
                <th className="px-4 py-3">取消</th>
                <th className="px-4 py-3">棄單</th>
                <th className="px-4 py-3">標記</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, risk, profile }) => {
                const rm = riskMeta[risk.level];
                const flag = flagMeta[profile.manualFlag];
                return (
                  <tr key={c.userId} className="border-b border-line last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.userName}</div>
                      <div className="text-xs text-ink/50">{c.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rm.cls}`}>
                        {rm.label} {risk.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{risk.completedOrders}</td>
                    <td className="px-4 py-3 text-ink/60">{risk.customerCancelCount}</td>
                    <td className={`px-4 py-3 ${risk.codAbandonCount > 0 ? "font-medium text-red-500" : "text-ink/60"}`}>
                      {risk.codAbandonCount}
                    </td>
                    <td className="px-4 py-3">
                      {flag && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${flag.cls}`}>
                          {flag.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/customers/${c.userId}`} className="text-brand hover:underline">
                        管理
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
