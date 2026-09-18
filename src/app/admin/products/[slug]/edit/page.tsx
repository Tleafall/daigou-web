import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories } from "@/lib/category-store";
import { getProduct } from "@/lib/product-store";
import { updateProductAction } from "@/lib/product-actions";
import { ProductVariantBuilder } from "@/components/product-variant-builder";
import { ProductImageManager } from "@/components/product-image-manager";
import { AutoTextarea } from "@/components/auto-textarea";

export const metadata: Metadata = { title: "編輯商品" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const { error } = await searchParams;
  const product = await getProduct(slug);
  if (!product) notFound();

  const categories = await listCategories();
  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand";

  // 規格建構器的預填值（key 與建構器的 comboKey 一致：鍵排序後 `名稱:值` 以 | 連接）
  const cellKey = (o: Record<string, string>) =>
    Object.keys(o)
      .sort()
      .map((k) => `${k}:${o[k]}`)
      .join("|");
  const initialCells: Record<string, { price: string; stock: string }> = {};
  for (const v of product.variants) {
    initialCells[cellKey(v.options)] = {
      price: String(v.price),
      stock: String(v.stock),
    };
  }
  const only = product.variants[0];
  const initialSingle =
    product.optionGroups.length === 0 && only
      ? { price: String(only.price), stock: String(only.stock) }
      : { price: "", stock: "0" };
  const optionValues = [
    ...new Set(product.optionGroups.flatMap((g) => g.values)),
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/products" className="hover:text-brand">商品管理</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">編輯：{product.title}</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">編輯商品</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          請確認已填商品名稱、分類，且至少一個規格有設定售價。
        </div>
      )}

      {/* 圖片：即時管理（新增即上傳、可排序/刪除/設定對應規格，不用按下方「儲存變更」） */}
      <div className="mb-4 rounded-xl border border-line bg-white p-5">
        <div className="mb-1 text-sm font-medium text-ink/70">商品圖片</div>
        <p className="mb-3 text-xs text-ink/40">
          這一區是「即時儲存」：新增、刪除、調整順序、設定對應規格都會立刻生效，不需要按下方的「儲存變更」。
          第一張為封面。
        </p>
        <ProductImageManager
          slug={product.slug}
          images={product.images}
          optionValues={optionValues}
        />
      </div>

      <form action={updateProductAction} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
        <input type="hidden" name="slug" value={product.slug} />

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">商品名稱 *</span>
          <input name="title" required defaultValue={product.title} className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">分類 *</span>
            <select name="categorySlug" required defaultValue={product.categorySlug} className={inputClass}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">上架狀態</span>
            <select name="status" defaultValue={product.status} className={inputClass}>
              <option value="ACTIVE">上架中</option>
              <option value="ARCHIVED">已下架（隱藏）</option>
              <option value="DRAFT">草稿</option>
            </select>
          </label>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">商品敘述</span>
          <AutoTextarea name="description" defaultValue={product.description} className={`${inputClass} min-h-32`} />
        </label>

        {/* 規格與定價（可新增/移除/修改規格與選項） */}
        <div className="text-sm">
          <span className="mb-1 block text-ink/70">規格與定價 *</span>
          <ProductVariantBuilder
            initialGroups={product.optionGroups}
            initialCells={initialCells}
            initialSingle={initialSingle}
          />
          <p className="mt-2 text-xs text-ink/40">
            可調整規格類型、選項、售價與庫存。改動後按「儲存變更」生效；選項相同的規格會保留原庫存。
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            儲存變更
          </button>
          <Link href={`/products/${product.slug}`} className="rounded-full border border-line px-6 py-2.5 text-sm text-ink/60 hover:border-brand">
            預覽商品頁
          </Link>
        </div>
      </form>
    </div>
  );
}
