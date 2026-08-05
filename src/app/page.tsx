import Link from "next/link";
import { categories, latestProducts, products } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";
import { IconChevronRight } from "@/components/icons";
import { site } from "@/lib/site";

export default function Home() {
  const featured = products.slice(0, 5);
  const latest = latestProducts.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-12 sm:px-12 sm:py-16"
        style={{ background: "linear-gradient(120deg, #ffe3d7, #ffc3ac)" }}
      >
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            海外好物，替你嚴選
          </h1>
          <p className="mt-3 text-ink/70">
            {site.tagline}。安心下單，支援貨到付款，滿 NT$
            {site.freeShippingThreshold.toLocaleString("zh-TW")} 免運。
          </p>
          <Link
            href="/category/beauty"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            開始選購 <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

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
