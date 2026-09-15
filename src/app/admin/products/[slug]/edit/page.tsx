import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories } from "@/lib/category-store";
import { getProduct } from "@/lib/product-store";
import { updateProductAction } from "@/lib/product-actions";

export const metadata: Metadata = { title: "編輯商品" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const categories = await listCategories();
  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/products" className="hover:text-brand">商品管理</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">編輯：{product.title}</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">編輯商品</h1>

      <form action={updateProductAction} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
        <input type="hidden" name="slug" value={product.slug} />
        <input type="hidden" name="variantIds" value={product.variants.map((v) => v.id).join(",")} />

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
              <option value="ARCHIVED">已下架</option>
              <option value="DRAFT">草稿</option>
            </select>
          </label>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">商品敘述</span>
          <textarea name="description" defaultValue={product.description} className={`${inputClass} min-h-24`} />
        </label>

        {/* 商品圖片 */}
        <div className="text-sm">
          <span className="mb-1 block text-ink/70">商品圖片</span>
          {product.images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {product.images.map((img, i) => (
                <div key={i} className="w-24">
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg ring-1 ring-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-brand px-1 text-[10px] text-white">
                        封面
                      </span>
                    )}
                  </div>
                  <input
                    name={`tag_${i}`}
                    defaultValue={img.tag ?? ""}
                    placeholder="對應規格"
                    className="mt-1 w-24 rounded border border-line px-1.5 py-1 text-xs outline-none focus:border-brand"
                  />
                  <label className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                    <input type="checkbox" name="removeIndex" value={i} /> 刪除
                  </label>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="w-full rounded-lg border border-line px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1 file:text-white"
          />
          <p className="mt-1 text-xs text-ink/40">
            新選的圖會加在後面（第一張為封面）；勾選「刪除」可移除既有圖。每張 ≤2MB。
            <br />
            「對應規格」填規格選項（如 <span className="text-ink/60">紅色</span>），顧客選到該規格時圖庫會自動跳到這張。
          </p>
        </div>

        {/* 規格價格 / 庫存 */}
        <div className="text-sm">
          <span className="mb-2 block text-ink/70">規格價格與庫存</span>
          <div className="flex flex-col gap-2">
            {product.variants.map((v) => {
              const label =
                Object.entries(v.options)
                  .map(([k, val]) => `${k}：${val}`)
                  .join("、") || "預設規格";
              return (
                <div key={v.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                  <span className="flex-1 text-ink/70">{label}</span>
                  <label className="flex items-center gap-1">
                    <span className="text-xs text-ink/50">價</span>
                    <input
                      name={`price_${v.id}`}
                      type="number"
                      min="0"
                      defaultValue={v.price}
                      className="w-24 rounded border border-line px-2 py-1 text-sm outline-none focus:border-brand"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-xs text-ink/50">庫存</span>
                    <input
                      name={`stock_${v.id}`}
                      type="number"
                      min="0"
                      defaultValue={v.stock}
                      className="w-20 rounded border border-line px-2 py-1 text-sm outline-none focus:border-brand"
                    />
                  </label>
                </div>
              );
            })}
          </div>
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
