import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories } from "@/lib/mock-data";
import { getActiveByCategory } from "@/lib/product-store";
import { ProductCard } from "@/components/product-card";

const PAGE_SIZE = 8;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  return { title: category ? category.name : "分類" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const all = getActiveByCategory(slug);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 麵包屑 */}
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{category.name}</span>
      </nav>

      <h1 className="mb-1 text-xl font-bold">
        <span className="mr-2">{category.emoji}</span>
        {category.name}
      </h1>
      <p className="mb-6 text-sm text-ink/50">共 {all.length} 件商品</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          此分類目前尚無商品
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* 翻頁 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <PageLink slug={slug} page={page - 1} disabled={page === 1}>
            上一頁
          </PageLink>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/category/${slug}?page=${n}`}
              className={`min-w-9 rounded-md px-3 py-1.5 text-center text-sm ${
                n === page
                  ? "bg-brand text-white"
                  : "border border-line text-ink/70 hover:border-brand hover:text-brand"
              }`}
            >
              {n}
            </Link>
          ))}
          <PageLink slug={slug} page={page + 1} disabled={page === totalPages}>
            下一頁
          </PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({
  slug,
  page,
  disabled,
  children,
}: {
  slug: string;
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
      href={`/category/${slug}?page=${page}`}
      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-brand hover:text-brand"
    >
      {children}
    </Link>
  );
}
