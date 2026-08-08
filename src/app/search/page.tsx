import type { Metadata } from "next";
import { listActiveProducts } from "@/lib/product-store";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "搜尋" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query
    ? listActiveProducts().filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">搜尋結果</h1>
      <p className="mb-6 text-sm text-ink/50">
        {query ? `關鍵字「${query}」，共 ${results.length} 件` : "請輸入關鍵字"}
      </p>

      {query && results.length === 0 ? (
        <EmptyState emoji="🔍" title={`找不到符合「${query}」的商品`} subtitle="換個關鍵字試試看" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
