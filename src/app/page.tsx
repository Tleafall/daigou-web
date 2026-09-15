import Link from "next/link";
import { latestActiveProducts, listActiveProducts } from "@/lib/product-store";
import { listCategories } from "@/lib/category-store";
import { ProductCard } from "@/components/product-card";
import { HeroCarousel } from "@/components/hero-carousel";

export default async function Home() {
  const [categories, active, latestAll] = await Promise.all([
    listCategories(),
    listActiveProducts(),
    latestActiveProducts(),
  ]);
  const featured = active.slice(0, 5);
  const latest = latestAll.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <HeroCarousel />

      {/* 特色列 */}
      <section className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white py-3 text-center">
        {[
          { icon: "🚚", label: "滿額免運", sub: "7-11 取貨" },
          { icon: "💵", label: "取貨付款", sub: "到店再付" },
          { icon: "💬", label: "專人客服", sub: "聊聊詢問" },
        ].map((f) => (
          <div key={f.label} className="px-2">
            <div className="text-xl">{f.icon}</div>
            <div className="mt-1 text-xs font-medium text-ink/80">{f.label}</div>
            <div className="text-[11px] text-ink/40">{f.sub}</div>
          </div>
        ))}
      </section>

      {/* 分類入口 */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded-full bg-brand" />商品分類
        </h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-2"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-2xl shadow-sm transition group-hover:scale-105 group-hover:bg-brand-100">
                {c.emoji}
              </span>
              <span className="text-xs text-ink/80 group-hover:text-brand">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 精選 */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded-full bg-brand" />精選推薦
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 最新 */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded-full bg-brand" />最新上架
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
