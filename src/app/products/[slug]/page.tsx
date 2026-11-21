import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryName } from "@/lib/category-store";
import { getActiveProduct } from "@/lib/product-store";
import { productCountLabel } from "@/lib/store";
import { ProductView } from "@/components/product-view";
import { ViewTracker } from "@/components/view-tracker";
import { getSettings } from "@/lib/settings-store";
import { seoDescription, seoText } from "@/lib/seo";
import { cldUrl } from "@/lib/cld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getActiveProduct(slug), getSettings()]);
  if (!product) return { title: "商品" };

  // 搜尋結果／分享卡用乾淨標題（拿掉 emoji、效期字），頁面上的商品名稱不變
  const title = seoText(product.title) || product.title;
  const description = seoDescription(product.description) || settings.tagline;
  const cover = product.images[0]?.url;
  const image = cover && /^https?:\/\//i.test(cover) ? cldUrl(cover, 1200) : "/og-default.jpg";
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      locale: "zh_TW",
      siteName: settings.name,
      url: `/products/${product.slug}`,
      title,
      description,
      images: [{ url: image, alt: title }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getActiveProduct(slug);
  if (!product) notFound();

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const [countLabel, catName] = await Promise.all([
    productCountLabel(product.slug, totalStock),
    categoryName(product.categorySlug),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ViewTracker slug={product.slug} />
      {/* 麵包屑 */}
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-brand">
          {catName}
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
        <p className="whitespace-pre-line text-base leading-8 text-ink/80 sm:text-lg">
          {product.description}
        </p>
      </section>

      {/* 購買須知：依法須事先告知不適用七天猶豫期的情形，建議放在商品旁顯眼處 */}
      <section className="mt-6 rounded-xl bg-muted px-4 py-3 text-sm leading-6 text-ink/60">
        <b className="text-ink/80">購買須知：</b>
        已拆封的化妝品、保養品等個人衛生用品，以及食品等保存期限較短的商品，
        依《通訊交易解除權合理例外情事適用準則》不適用七天猶豫期；商品瑕疵或寄錯仍可退換。
        <Link href="/returns" className="ml-1 text-brand hover:underline">詳見退換貨說明</Link>
      </section>
    </div>
  );
}
