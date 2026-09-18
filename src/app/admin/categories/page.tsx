import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories, productCountForCategory } from "@/lib/category-store";
import { createCategoryAction } from "@/lib/category-actions";
import { CategoryReorderList } from "@/components/category-reorder-list";

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

      {/* 現有分類（可拖曳排序） */}
      <CategoryReorderList
        categories={categories.map((c, i) => ({
          slug: c.slug,
          name: c.name,
          emoji: c.emoji,
          count: counts[i],
        }))}
      />

      {/* 新增分類 */}
      <form action={createCategoryAction} className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-4">
        <div className="text-sm font-bold w-full mb-1">新增分類</div>
        <label className="text-sm">
          <span className="mb-1 block text-ink/60">圖示（emoji）</span>
          <input name="emoji" placeholder="🛍️" className={`${inputClass} w-16 text-center`} />
          <span className="mt-1 block text-[11px] text-ink/40">Windows 按 ⊞ Win + .</span>
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
