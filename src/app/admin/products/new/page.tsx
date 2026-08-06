import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { gradientPresets } from "@/lib/mock-data";
import { listCategories } from "@/lib/category-store";
import { createProductAction } from "@/lib/product-actions";

export const metadata: Metadata = { title: "新增商品" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = listCategories();
  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/products" className="hover:text-brand">商品管理</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">新增商品</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">新增商品</h1>

      <form action={createProductAction} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">商品名稱 *</span>
          <input name="title" required className={inputClass} placeholder="例：日本人氣保濕面膜" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">分類 *</span>
          <select name="categorySlug" required className={inputClass} defaultValue="">
            <option value="" disabled>請選擇分類</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">售價（NT$）*</span>
            <input name="price" type="number" min="1" required className={inputClass} placeholder="590" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">庫存</span>
            <input name="stock" type="number" min="0" defaultValue={0} className={inputClass} />
          </label>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">商品敘述</span>
          <textarea name="description" className={`${inputClass} min-h-24`} placeholder="商品介紹、材質、代購說明…" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">商品圖片（選填，可多選，每張 ≤2MB、最多 6 張）</span>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="w-full rounded-lg border border-line px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1 file:text-white"
          />
        </label>

        <fieldset className="text-sm">
          <span className="mb-2 block text-ink/70">封面配色（未上傳圖片時的底色）</span>
          <div className="flex flex-wrap gap-2">
            {gradientPresets.map((g, i) => (
              <label key={i} className="cursor-pointer">
                <input type="radio" name="gradient" value={i} defaultChecked={i === 0} className="peer sr-only" />
                <span
                  className="block h-10 w-10 rounded-lg ring-2 ring-transparent peer-checked:ring-brand"
                  style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/40">（原型無圖片上傳，先用配色當封面）</p>
        </fieldset>

        <div className="flex gap-2">
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            建立商品
          </button>
          <Link href="/admin/products" className="rounded-full border border-line px-6 py-2.5 text-sm text-ink/60 hover:border-brand">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
