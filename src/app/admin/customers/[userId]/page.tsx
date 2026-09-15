import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { listOrdersByUser, riskForUser, type RiskProfile } from "@/lib/store";
import { getCustomerProfile, type ManualFlag } from "@/lib/customer-store";
import {
  setCustomerFlagAction,
  setCustomerNoteAction,
} from "@/lib/customer-actions";
import { formatTWD } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const metadata: Metadata = { title: "客戶明細" };

const riskMeta: Record<RiskProfile["level"], { label: string; cls: string }> = {
  low: { label: "低風險", cls: "bg-green-100 text-green-700" },
  watch: { label: "觀察", cls: "bg-amber-100 text-amber-700" },
  high: { label: "高風險", cls: "bg-red-100 text-red-700" },
};

const flags: { value: ManualFlag; label: string }[] = [
  { value: "NORMAL", label: "正常" },
  { value: "WATCH", label: "觀察名單" },
  { value: "BLOCKED", label: "封鎖下單" },
];

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const orders = await listOrdersByUser(userId);
  if (orders.length === 0) notFound();

  const info = orders[0];
  const [risk, profile] = await Promise.all([
    riskForUser(userId),
    getCustomerProfile(userId),
  ]);
  const rm = riskMeta[risk.level];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/customers" className="hover:text-brand">客戶風險</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{info.userName}</span>
      </nav>

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        {/* 主要 */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="text-lg font-semibold">{info.userName}</div>
            <div className="text-sm text-ink/50">{info.userEmail}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rm.cls}`}>
                {rm.label}　分數 {risk.score}
              </span>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1 text-sm text-ink/60">
              <li>總下單：{risk.totalOrders}</li>
              <li>完成：{risk.completedOrders}</li>
              <li>自行取消：{risk.customerCancelCount}</li>
              <li className={risk.codAbandonCount > 0 ? "font-medium text-red-500" : ""}>
                棄單/拒收：{risk.codAbandonCount}
              </li>
            </ul>
          </div>

          {/* 訂單列表 */}
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="mb-3 text-sm font-bold">訂單紀錄</div>
            <div className="flex flex-col gap-2">
              {orders.map((o) => (
                <Link
                  key={o.orderNo}
                  href={`/admin/orders/${o.orderNo}`}
                  className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-mono text-ink/70">{o.orderNo}</span>
                  <span className="flex items-center gap-3">
                    <span>{formatTWD(o.totalAmount)}</span>
                    <OrderStatusBadge status={o.status} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 側欄：標記 + 備註 */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="mb-2 text-sm font-bold">風險標記</div>
            <div className="flex flex-col gap-2">
              {flags.map((f) => {
                const active = profile.manualFlag === f.value;
                return (
                  <form action={setCustomerFlagAction} key={f.value}>
                    <input type="hidden" name="userId" value={userId} />
                    <input type="hidden" name="flag" value={f.value} />
                    <button
                      className={`w-full rounded-lg border py-2 text-sm ${
                        active
                          ? f.value === "BLOCKED"
                            ? "border-red-400 bg-red-50 font-medium text-red-600"
                            : f.value === "WATCH"
                              ? "border-amber-400 bg-amber-50 font-medium text-amber-700"
                              : "border-brand bg-brand-50 font-medium text-brand"
                          : "border-line text-ink/60 hover:border-brand"
                      }`}
                    >
                      {active ? "● " : ""}
                      {f.label}
                    </button>
                  </form>
                );
              })}
            </div>
            {profile.manualFlag === "BLOCKED" && (
              <p className="mt-2 text-xs text-red-500">此顧客目前無法結帳下單。</p>
            )}
          </div>

          <form action={setCustomerNoteAction} className="rounded-xl border border-line bg-white p-4">
            <div className="mb-2 text-sm font-bold">賣家備註</div>
            <input type="hidden" name="userId" value={userId} />
            <textarea
              name="note"
              defaultValue={profile.sellerNote}
              placeholder="內部備註（僅賣家可見）"
              className="min-h-20 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button className="mt-2 w-full rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-600">
              儲存備註
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
