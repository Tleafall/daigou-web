import Link from "next/link";
import type { Metadata } from "next";
import { latestActiveProducts } from "@/lib/product-store";
import { listCategories } from "@/lib/category-store";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "全部商品" };

const PAGE_SIZE = 48;

type Sort = "new" | "price-asc" | "price-desc";
const SORTS: { key: Sort; label: string }[] = [
  { key: "new", label: "最新" },
  { key: "price-asc", label: "價格低→高" },
  { key: "price-desc", label: "價格高→低" },
];

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; cat?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat ?? "";
  const sort: Sort =
    sp.sort === "price-asc" || sp.sort === "price-desc" ? sp.sort : "new";

  const [allActive, categories] = await Promise.all([
    latestActiveProducts(), // 預設：最新在前
    listCategories(),
  ]);

  let list = cat ? allActive.filter((p) => p.categorySlug === cat) : allActive;
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), totalPages);
  const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 組網址：切換分類/排序時回到第 1 頁；翻頁時保留分類/排序
  const urlFor = (o: { cat?: string; sort?: Sort; page?: number }) => {
    const q = new URLSearchParams();
    const c = o.cat ?? cat;
    const s = o.sort ?? sort;
    if (c) q.set("cat", c);
    if (s !== "new") q.set("sort", s);
    if (o.page && o.page > 1) q.set("page", String(o.page));
    const str = q.toString();
    return str ? `/products?${str}` : "/products";
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm ${
      active
        ? "border-brand bg-brand text-white"
        : "border-line text-ink/70 hover:border-brand hover:text-brand"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">全部商品</span>
      </nav>

      <h1 className="mb-4 text-xl font-bold">全部商品</h1>

      {/* 分類篩選 */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={urlFor({ cat: "", page: 1 })} className={chip(cat === "")}>
          全部
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={urlFor({ cat: c.slug, page: 1 })}
            className={chip(cat === c.slug)}
          >
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {/* 排序 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink/50">排序：</span>
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={urlFor({ sort: s.key, page: 1 })}
            className={`rounded-md px-2 py-1 ${
              sort === s.key
                ? "font-medium text-brand"
                : "text-ink/60 hover:text-brand"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <span className="ml-auto text-ink/50">共 {list.length} 件</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          此條件目前尚無商品
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* 翻頁 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          {page > 1 ? (
            <Link href={urlFor({ page: page - 1 })} className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-brand hover:text-brand">
              上一頁
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-md border border-line px-3 py-1.5 text-sm text-ink/30">上一頁</span>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={urlFor({ page: n })}
              className={`min-w-9 rounded-md px-3 py-1.5 text-center text-sm ${
                n === page
                  ? "bg-brand text-white"
                  : "border border-line text-ink/70 hover:border-brand hover:text-brand"
              }`}
            >
              {n}
            </Link>
          ))}
          {page < totalPages ? (
            <Link href={urlFor({ page: page + 1 })} className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-brand hover:text-brand">
              下一頁
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-md border border-line px-3 py-1.5 text-sm text-ink/30">下一頁</span>
          )}
        </div>
      )}
    </div>
  );
}
