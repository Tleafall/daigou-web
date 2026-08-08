import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryName } from "@/lib/category-store";
import { getActiveProduct } from "@/lib/product-store";
import { productCountLabel } from "@/lib/store";
import { ProductView } from "@/components/product-view";

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

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const countLabel = productCountLabel(product.slug, totalStock);

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

      <ProductView product={product} countLabel={countLabel} />

      {/* 商品敘述 */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 border-b border-line pb-2 text-lg font-bold">
          <span className="h-5 w-1 rounded-full bg-brand" />商品敘述
        </h2>
        <p className="whitespace-pre-line leading-7 text-ink/80">
          {product.description}
        </p>
      </section>
    </div>
  );
}
