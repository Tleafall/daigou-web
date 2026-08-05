import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listMovements, type MovementType } from "@/lib/inventory-store";

export const metadata: Metadata = { title: "庫存異動" };

const typeMeta: Record<MovementType, { label: string; cls: string }> = {
  SALE: { label: "銷售", cls: "bg-blue-100 text-blue-700" },
  CANCEL: { label: "取消回補", cls: "bg-amber-100 text-amber-700" },
  RESTOCK: { label: "補貨", cls: "bg-green-100 text-green-700" },
  ADJUST: { label: "調整", cls: "bg-zinc-200 text-zinc-600" },
};

export default async function AdminInventoryPage() {
  await requireAdmin();
  const movements = listMovements();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">庫存異動</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">庫存異動紀錄</h1>
      <p className="mb-6 text-sm text-ink/50">
        下單扣庫存、取消/棄單回補、後台調整都會留下紀錄。
      </p>

      {movements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          目前沒有庫存異動紀錄
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-line bg-muted text-left text-xs text-ink/60">
              <tr>
                <th className="px-4 py-3">時間</th>
                <th className="px-4 py-3">商品 / 規格</th>
                <th className="px-4 py-3">類型</th>
                <th className="px-4 py-3">數量</th>
                <th className="px-4 py-3">原因 / 訂單</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const tm = typeMeta[m.type];
                return (
                  <tr key={m.id} className="border-b border-line last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-xs text-ink/50">
                      {new Date(m.createdAt).toLocaleString("zh-TW")}
                    </td>
                    <td className="px-4 py-3">
                      <div>{m.productTitle}</div>
                      <div className="text-xs text-ink/50">{m.optionLabel}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tm.cls}`}>
                        {tm.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${m.delta < 0 ? "text-red-500" : "text-green-600"}`}>
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/60">
                      {m.reason}
                      {m.orderNo && (
                        <Link href={`/admin/orders/${m.orderNo}`} className="ml-1 text-brand hover:underline">
                          {m.orderNo}
                        </Link>
                      )}
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
