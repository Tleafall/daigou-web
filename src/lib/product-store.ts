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
  views: number;
  featured: boolean;
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
    views: r.views,
    featured: r.featured,
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

// 首頁「精選推薦」：管理員在後台勾選的上架商品
export async function listFeaturedProducts(): Promise<Product[]> {
  return (await listActiveProducts()).filter((p) => p.featured);
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

// 商品頁被看一次就 +1（找不到商品就安靜略過，不影響頁面）
export async function incrementProductViews(slug: string): Promise<void> {
  try {
    await prisma.product.update({ where: { slug }, data: { views: { increment: 1 } } });
  } catch {
    /* 商品不存在等狀況：忽略 */
  }
}

// 變體 id 形如 `${slug}-v${n}`，可反推所屬商品 slug（slug 本身不含 -v 數字結尾）
function slugFromVariantId(variantId: string): string {
  return variantId.replace(/-v\d+$/, "");
}

// 調整庫存並記錄異動（下單扣、取消補、盤點調整都走這裡）
// 用交易 + 「SELECT ... FOR UPDATE」鎖住該商品那一列：同一件商品的庫存變動會排隊
// 一個一個進行，避免兩筆同時發生時互相蓋掉（不同商品之間不會互相卡）。
export async function adjustVariantStock(
  variantId: string,
  delta: number,
  type: "SALE" | "CANCEL" | "RESTOCK" | "ADJUST",
  reason: string,
  orderNo?: string,
): Promise<boolean> {
  const slug = slugFromVariantId(variantId);
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ variants: Variant[]; title: string }[]>`
      SELECT variants, title FROM "Product" WHERE slug = ${slug} FOR UPDATE
    `;
    if (rows.length === 0) return false;
    const variants = rows[0].variants;
    const v = variants.find((x) => x.id === variantId);
    if (!v) return false;
    v.stock = Math.max(0, v.stock + delta);
    await tx.product.update({ where: { slug }, data: { variants: json(variants) } });
    await tx.inventoryMovement.create({
      data: {
        variantId,
        productTitle: rows[0].title,
        optionLabel: variantOptionLabel(v),
        type,
        delta,
        reason,
        orderNo: orderNo ?? null,
      },
    });
    return true;
  });
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
  optionGroups: OptionGroup[];
  // 完整的新規格集合（可新增/移除/改選項）；沿用選項相同者的既有 id 與庫存
  variants: { options: Record<string, string>; price: number; stock: number }[];
};

// 用排序後的選項組成簽章，讓「同一組選項」不論鍵順序都對得起來
function optionsSig(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join("|");
}

export async function updateProduct(
  slug: string,
  input: UpdateProductInput,
): Promise<boolean> {
  if (input.variants.length === 0) return false;
  // 鎖住該商品那一列，避免後台改規格與客人下單扣庫存同時發生時互相蓋掉
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ variants: Variant[] }[]>`
      SELECT variants FROM "Product" WHERE slug = ${slug} FOR UPDATE
    `;
    if (rows.length === 0) return false;
    const existing = rows[0].variants;
    const existingBySig = new Map(existing.map((v) => [optionsSig(v.options), v]));
    // 目前最大的 -vN 流水號，供新規格編號（保持 `${slug}-v\d+` 格式，庫存調整才反查得到 slug）
    let maxN = 0;
    for (const v of existing) {
      const m = v.id.match(/-v(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    }

    const movements: { variantId: string; optionLabel: string; delta: number }[] = [];
    const nextVariants: Variant[] = input.variants.map((vi) => {
      const prev = existingBySig.get(optionsSig(vi.options));
      if (prev) {
        // 沿用既有 id；庫存有變就記一筆異動
        if (vi.stock !== prev.stock) {
          movements.push({
            variantId: prev.id,
            optionLabel: variantOptionLabel({ ...prev, options: vi.options }),
            delta: vi.stock - prev.stock,
          });
        }
        return { id: prev.id, options: vi.options, price: vi.price, stock: vi.stock };
      }
      // 新規格：給新的流水號
      const id = `${slug}-v${++maxN}`;
      return { id, options: vi.options, price: vi.price, stock: vi.stock };
    });

    await tx.product.update({
      where: { slug },
      data: {
        title: input.title,
        description: input.description,
        categorySlug: input.categorySlug,
        status: input.status,
        optionGroups: json(input.optionGroups),
        variants: json(nextVariants),
        price: Math.min(...nextVariants.map((v) => v.price)),
      },
    });
    for (const m of movements) {
      await tx.inventoryMovement.create({
        data: {
          variantId: m.variantId,
          productTitle: input.title,
          optionLabel: m.optionLabel,
          type: "ADJUST",
          delta: m.delta,
          reason: "後台庫存調整",
          orderNo: null,
        },
      });
    }
    return true;
  });
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

// 設定／取消「精選推薦」（首頁精選區顯示）。
export async function setProductFeatured(
  slug: string,
  featured: boolean,
): Promise<boolean> {
  try {
    await prisma.product.update({ where: { slug }, data: { featured } });
    return true;
  } catch {
    return false;
  }
}

// 只更新商品圖片陣列（供編輯頁的即時圖片管理：新增/刪除/排序/規格對應）。
export async function updateProductImages(
  slug: string,
  images: ProductImage[],
): Promise<boolean> {
  try {
    await prisma.product.update({ where: { slug }, data: { images: json(images) } });
    return true;
  } catch {
    return false;
  }
}

// 永久刪除商品。歷史訂單以 JSON 快照保存、不參照 Product，故刪除不影響既有訂單。
export async function deleteProduct(slug: string): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { slug } });
    return true;
  } catch {
    return false;
  }
}
