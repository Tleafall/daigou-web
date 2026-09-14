import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories } from "@/lib/category-store";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "批次匯入商品" };

export default async function ImportProductsPage() {
  await requireAdmin();
  const categories = listCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/products" className="hover:text-brand">商品管理</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">批次匯入</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">用 Excel 批次匯入商品</h1>
      <p className="mb-6 text-sm text-ink/50">一列一個商品，適合一次鍵入大量商品。多規格商品請用「新增商品」頁單獨建立。</p>

      {/* 步驟 */}
      <ol className="mb-6 flex flex-col gap-3">
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">1</span>
          <div className="text-sm">
            <b>下載範本</b>
            <div className="mt-2">
              <a
                href="/admin/products/import/template"
                className="inline-block rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                ⬇ 下載 Excel 範本
              </a>
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">2</span>
          <div className="text-sm">
            <b>在 Excel 填寫</b>
            <p className="mt-1 text-ink/60">
              每列一個商品，欄位：<code className="rounded bg-muted px-1">商品名稱</code>、
              <code className="rounded bg-muted px-1">分類</code>、
              <code className="rounded bg-muted px-1">售價</code>、
              <code className="rounded bg-muted px-1">庫存</code>、
              <code className="rounded bg-muted px-1">商品敘述</code>、
              <code className="rounded bg-muted px-1">圖片網址</code>。
              商品名稱、分類、售價必填。
            </p>
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-ink/60">
              🖼️ <b>圖片網址</b>（選填）：貼上商品在來源網站的圖片連結，匯入時會自動抓圖。多張可用逗號分隔。
              有些網站會擋外部抓圖，抓不到就先沒圖、商品照樣建立，之後可在編輯頁手動上傳。
            </p>
            <p className="mt-2 text-ink/60">
              「分類」請填以下現有名稱之一：
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c.slug} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-ink/70">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">3</span>
          <div className="text-sm">
            <b>上傳檔案</b>
            <p className="mt-1 text-ink/60">上傳後會立即建立商品，並回報哪些列成功、哪些需要修正。</p>
          </div>
        </li>
      </ol>

      <ImportForm />
    </div>
  );
}
