import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories, productCountForCategory } from "@/lib/category-store";
import {
  createCategoryAction,
  removeCategoryAction,
  updateCategoryAction,
} from "@/lib/category-actions";

export const metadata: Metadata = { title: "分類管理" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await listCategories();
  const counts = await Promise.all(
    categories.map((c) => productCountForCategory(c.slug)),
  );

  const inputClass =
    "rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">分類管理</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">分類管理</h1>

      {/* 現有分類 */}
      <div className="flex flex-col gap-2">
        {categories.map((c, i) => {
          const count = counts[i];
          return (
            <div key={c.slug} className="rounded-xl border border-line bg-white p-3">
              <form action={updateCategoryAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="slug" value={c.slug} />
                <input name="emoji" defaultValue={c.emoji} className={`${inputClass} w-14 text-center`} />
                <input name="name" defaultValue={c.name} className={`${inputClass} flex-1`} />
                <label className="flex items-center gap-1 text-xs text-ink/50">
                  排序
                  <input name="sortOrder" type="number" defaultValue={c.sortOrder} className={`${inputClass} w-16`} />
                </label>
                <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
                  儲存
                </button>
              </form>
              <div className="mt-2 flex items-center justify-between px-1 text-xs text-ink/50">
                <span>{count} 件商品 · /{c.slug}</span>
                {count === 0 ? (
                  <form action={removeCategoryAction}>
                    <input type="hidden" name="slug" value={c.slug} />
                    <button className="text-ink/50 hover:text-red-500">刪除</button>
                  </form>
                ) : (
                  <span className="text-ink/30">有商品，無法刪除</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 新增分類 */}
      <form action={createCategoryAction} className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-4">
        <div className="text-sm font-bold w-full mb-1">新增分類</div>
        <label className="text-sm">
          <span className="mb-1 block text-ink/60">圖示</span>
          <input name="emoji" placeholder="🛍️" className={`${inputClass} w-16 text-center`} />
        </label>
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-ink/60">分類名稱</span>
          <input name="name" required placeholder="例：保健食品" className={`${inputClass} w-full`} />
        </label>
        <button className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-600">
          新增
        </button>
      </form>
    </div>
  );
}
