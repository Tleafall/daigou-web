import type { MetadataRoute } from "next";
import { listActiveProducts } from "@/lib/product-store";
import { listCategories } from "@/lib/category-store";
import { siteUrl } from "@/lib/site-url";

// 每次請求即時產生，商品上下架後 Google 抓到的就是最新清單
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([listActiveProducts(), listCategories()]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/returns`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
