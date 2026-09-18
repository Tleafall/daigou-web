import Link from "next/link";
import type { Metadata } from "next";
import { latestActiveProducts } from "@/lib/product-store";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "全部商品" };

const PAGE_SIZE = 48;

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const all = await latestActiveProducts();
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 麵包屑 */}
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">全部商品</span>
      </nav>

      <h1 className="mb-1 text-xl font-bold">全部商品</h1>
      <p className="mb-6 text-sm text-ink/50">共 {all.length} 件商品</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          目前尚無商品
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
          <PageLink page={page - 1} disabled={page === 1}>
            上一頁
          </PageLink>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/products?page=${n}`}
              className={`min-w-9 rounded-md px-3 py-1.5 text-center text-sm ${
                n === page
                  ? "bg-brand text-white"
                  : "border border-line text-ink/70 hover:border-brand hover:text-brand"
              }`}
            >
              {n}
            </Link>
          ))}
          <PageLink page={page + 1} disabled={page === totalPages}>
            下一頁
          </PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md border border-line px-3 py-1.5 text-sm text-ink/30">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/products?page=${page}`}
      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-brand hover:text-brand"
    >
      {children}
    </Link>
  );
}
