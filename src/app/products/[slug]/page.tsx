import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryName } from "@/lib/mock-data";
import { getActiveProduct } from "@/lib/product-store";
import { VariantSelector } from "@/components/variant-selector";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getActiveProduct(slug);
  return {
    title: product ? product.title : "商品",
    description: product?.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getActiveProduct(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 麵包屑 */}
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-brand">
          {categoryName(product.categorySlug)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{product.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 圖片 */}
        <div className="flex flex-col gap-3">
          <div
            className="aspect-square w-full overflow-hidden rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${product.gradient[0]}, ${product.gradient[1]})`,
            }}
          >
            {product.imageDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageDataUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg border border-line"
                style={{
                  background: `linear-gradient(${135 + i * 30}deg, ${product.gradient[0]}, ${product.gradient[1]})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* 資訊 + 選規格 */}
        <div className="flex flex-col gap-5">
          <h1 className="text-xl font-bold sm:text-2xl">{product.title}</h1>
          <VariantSelector product={product} />
        </div>
      </div>

      {/* 商品敘述 */}
      <section className="mt-10">
        <h2 className="mb-3 border-b border-line pb-2 text-lg font-bold">商品敘述</h2>
        <p className="whitespace-pre-line leading-7 text-ink/80">
          {product.description}
        </p>
      </section>
    </div>
  );
}
