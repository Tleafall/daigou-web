import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { products, categoryName } from "@/lib/mock-data";
import { formatTWD } from "@/lib/format";

export const metadata: Metadata = { title: "商品管理" };

export default async function AdminProductsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">商品管理</span>
      </nav>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">商品管理</h1>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-ink/50">
          目前為唯讀（新增/編輯待接資料庫）
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-muted text-left text-xs text-ink/60">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分類</th>
              <th className="px-4 py-3">價格</th>
              <th className="px-4 py-3">規格數</th>
              <th className="px-4 py-3">總庫存</th>
              <th className="px-4 py-3">狀態</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const min = Math.min(...p.variants.map((v) => v.price));
              const max = Math.max(...p.variants.map((v) => v.price));
              return (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.slug}`} className="text-brand hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{categoryName(p.categorySlug)}</td>
                  <td className="px-4 py-3">
                    {min === max ? formatTWD(min) : `${formatTWD(min)}~${formatTWD(max)}`}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{p.variants.length}</td>
                  <td className={`px-4 py-3 ${stock === 0 ? "text-red-500" : "text-ink/60"}`}>
                    {stock}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      上架中
                    </span>
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
