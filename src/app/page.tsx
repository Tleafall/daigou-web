import Link from "next/link";
import { latestActiveProducts, listActiveProducts } from "@/lib/product-store";
import { listCategories } from "@/lib/category-store";
import { ProductCard } from "@/components/product-card";
import { HeroCarousel } from "@/components/hero-carousel";

export default function Home() {
  const categories = listCategories();
  const featured = listActiveProducts().slice(0, 5);
  const latest = latestActiveProducts().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <HeroCarousel />

      {/* 分類入口 */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">商品分類</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white py-4 transition-colors hover:border-brand hover:bg-brand-50"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs text-ink/80">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 精選 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">精選推薦</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 最新 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">最新上架</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
