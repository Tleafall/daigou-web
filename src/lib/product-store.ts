// 商品：存於 PostgreSQL（Product 表；規格/選項/圖片以 JSON 欄位保存）。
import { cache } from "react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type OptionGroup,
  type Product,
  type ProductImage,
  type ProductStatus,
  type Variant,
} from "@/lib/mock-data";
import { recordMovement } from "@/lib/inventory-store";

function variantOptionLabel(v: Variant): string {
  return (
    Object.entries(v.options)
      .map(([k, val]) => `${k}：${val}`)
      .join("、") || "預設規格"
  );
}

// JSON 欄位寫入型別轉換小工具
function json(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  description: string;
  price: number;
  gradient: Prisma.JsonValue;
  images: Prisma.JsonValue;
  optionGroups: Prisma.JsonValue;
  variants: Prisma.JsonValue;
  status: string;
};

// DB 列 → 應用型別（id 對外沿用 slug，全站以 slug 為商品識別）
function toProduct(r: ProductRow): Product {
  return {
    id: r.slug,
    slug: r.slug,
    title: r.title,
    categorySlug: r.categorySlug,
    description: r.description,
    price: r.price,
    gradient: r.gradient as unknown as [string, string],
    images: r.images as unknown as ProductImage[],
    optionGroups: r.optionGroups as unknown as OptionGroup[],
    variants: r.variants as unknown as Variant[],
    status: r.status as ProductStatus,
  };
}

// ---- 查詢 ----
// 以 React cache 於單次請求內去重（列表頁 + 卡片會多次讀取）
export const listAllProducts = cache(async (): Promise<Product[]> => {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toProduct);
});

export async function listActiveProducts(): Promise<Product[]> {
  return (await listAllProducts()).filter((p) => p.status === "ACTIVE");
}

export async function latestActiveProducts(): Promise<Product[]> {
  return [...(await listActiveProducts())].reverse();
}

export async function getActiveByCategory(slug: string): Promise<Product[]> {
  return (await listActiveProducts()).filter((p) => p.categorySlug === slug);
}

// 供結帳/訂單使用：任何狀態都找得到（歷史訂單需要）
export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await listAllProducts()).find((p) => p.slug === slug);
}

export async function getActiveProduct(slug: string): Promise<Product | undefined> {
  const p = await getProduct(slug);
  return p && p.status === "ACTIVE" ? p : undefined;
}

export async function getVariant(
  variantId: string,
): Promise<{ product: Product; variant: Variant } | undefined> {
  for (const p of await listAllProducts()) {
    const variant = p.variants.find((v) => v.id === variantId);
    if (variant) return { product: p, variant };
  }
  return undefined;
}

// 變體 id 形如 `${slug}-v${n}`，可反推所屬商品 slug（slug 本身不含 -v 數字結尾）
function slugFromVariantId(variantId: string): string {
  return variantId.replace(/-v\d+$/, "");
}

// 調整庫存並記錄異動（下單扣、取消補、盤點調整都走這裡）
// 每次都從 DB 讀取最新商品，確保同一商品多變體連續調整不會互相覆蓋
export async function adjustVariantStock(
  variantId: string,
  delta: number,
  type: "SALE" | "CANCEL" | "RESTOCK" | "ADJUST",
  reason: string,
  orderNo?: string,
): Promise<boolean> {
  const slug = slugFromVariantId(variantId);
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row) return false;
  const variants = row.variants as unknown as Variant[];
  const v = variants.find((x) => x.id === variantId);
  if (!v) return false;
  v.stock = Math.max(0, v.stock + delta);
  await prisma.product.update({
    where: { slug },
    data: { variants: json(variants) },
  });
  await recordMovement({
    variantId,
    productTitle: row.title,
    optionLabel: variantOptionLabel(v),
    type,
    delta,
    reason,
    orderNo,
  });
  return true;
}

// ---- 異動 ----
export type CreateProductInput = {
  title: string;
  description: string;
  categorySlug: string;
  gradient: [string, string];
  images?: ProductImage[];
  optionGroups: OptionGroup[];
  variants: { options: Record<string, string>; price: number; stock: number }[];
};

export async function createProduct(input: CreateProductInput): Promise<string> {
  // 時間 + 隨機碼，避免兩人同時（或批次匯入同毫秒）產生相同編號而撞號
  const slug = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const variants: Variant[] = input.variants.map((v, i) => ({
    id: `${slug}-v${i + 1}`,
    options: v.options,
    price: v.price,
    stock: v.stock,
  }));
  const images: ProductImage[] = input.images ?? [];
  await prisma.product.create({
    data: {
      slug,
      title: input.title,
      categorySlug: input.categorySlug,
      description: input.description,
      price: Math.min(...variants.map((v) => v.price)),
      gradient: json(input.gradient),
      images: json(images),
      optionGroups: json(input.optionGroups),
      variants: json(variants),
      status: "ACTIVE",
    },
  });
  return slug;
}

export type UpdateProductInput = {
  title: string;
  description: string;
  categorySlug: string;
  status: ProductStatus;
  variants: { id: string; price: number; stock: number }[];
  images: ProductImage[]; // 更新後的完整圖片陣列（含 tag）
};

export async function updateProduct(
  slug: string,
  input: UpdateProductInput,
): Promise<boolean> {
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row) return false;
  const variants = row.variants as unknown as Variant[];
  const movements: Parameters<typeof recordMovement>[0][] = [];
  for (const vi of input.variants) {
    const v = variants.find((x) => x.id === vi.id);
    if (v) {
      v.price = vi.price;
      if (vi.stock !== v.stock) {
        const delta = vi.stock - v.stock;
        v.stock = vi.stock;
        movements.push({
          variantId: v.id,
          productTitle: input.title,
          optionLabel: variantOptionLabel(v),
          type: "ADJUST",
          delta,
          reason: "後台庫存調整",
        });
      }
    }
  }
  await prisma.product.update({
    where: { slug },
    data: {
      title: input.title,
      description: input.description,
      categorySlug: input.categorySlug,
      status: input.status,
      images: json(input.images),
      variants: json(variants),
      price: Math.min(...variants.map((v) => v.price)),
    },
  });
  for (const m of movements) await recordMovement(m);
  return true;
}

export async function setProductStatus(
  slug: string,
  status: ProductStatus,
): Promise<boolean> {
  try {
    await prisma.product.update({ where: { slug }, data: { status } });
    return true;
  } catch {
    return false;
  }
}
