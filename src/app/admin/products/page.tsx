import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { type ProductStatus } from "@/lib/mock-data";
import { listCategories } from "@/lib/category-store";
import { listAllProducts } from "@/lib/product-store";
import { formatTWD } from "@/lib/format";

export const metadata: Metadata = { title: "商品管理" };

const statusMeta: Record<ProductStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "上架中", cls: "bg-green-100 text-green-700" },
  ARCHIVED: { label: "已下架", cls: "bg-zinc-200 text-zinc-600" },
  DRAFT: { label: "草稿", cls: "bg-amber-100 text-amber-700" },
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const [products, categories] = await Promise.all([
    listAllProducts(),
    listCategories(),
  ]);
  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? "商品";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">商品管理</span>
      </nav>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">商品管理</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/70 hover:border-brand hover:text-brand"
          >
            ⬆ 批次匯入
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            ＋ 新增商品
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-line bg-muted text-left text-xs text-ink/60">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分類</th>
              <th className="px-4 py-3">價格</th>
              <th className="px-4 py-3">規格</th>
              <th className="px-4 py-3">總庫存</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const min = Math.min(...p.variants.map((v) => v.price));
              const max = Math.max(...p.variants.map((v) => v.price));
              const sm = statusMeta[p.status];
              return (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 text-ink/60">{catName(p.categorySlug)}</td>
                  <td className="px-4 py-3">
                    {min === max ? formatTWD(min) : `${formatTWD(min)}~${formatTWD(max)}`}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{p.variants.length}</td>
                  <td className={`px-4 py-3 ${stock === 0 ? "text-red-500" : "text-ink/60"}`}>
                    {stock}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sm.cls}`}>
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.slug}/edit`}
                      className="text-brand hover:underline"
                    >
                      編輯
                    </Link>
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
