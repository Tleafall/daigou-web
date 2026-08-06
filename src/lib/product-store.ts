// ⚠️ 原型用「伺服器記憶體」商品庫（可增修）。重啟伺服器會回到種子資料。
// 之後接 Prisma 後換成資料庫。
import {
  seedProducts,
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

type Store = { products: Product[] };

const g = globalThis as unknown as { __daigouProducts?: Store };

function getStore(): Store {
  if (!g.__daigouProducts) {
    g.__daigouProducts = { products: seedProducts.map((p) => structuredClone(p)) };
  }
  return g.__daigouProducts;
}

function recalcPrice(p: Product) {
  p.price = Math.min(...p.variants.map((v) => v.price));
}

// ---- 查詢 ----
export function listAllProducts(): Product[] {
  return getStore().products;
}

export function listActiveProducts(): Product[] {
  return getStore().products.filter((p) => p.status === "ACTIVE");
}

export function latestActiveProducts(): Product[] {
  return [...listActiveProducts()].reverse();
}

export function getActiveByCategory(slug: string): Product[] {
  return listActiveProducts().filter((p) => p.categorySlug === slug);
}

// 供結帳/訂單使用：任何狀態都找得到（歷史訂單需要）
export function getProduct(slug: string): Product | undefined {
  return getStore().products.find((p) => p.slug === slug);
}

export function getActiveProduct(slug: string): Product | undefined {
  const p = getProduct(slug);
  return p && p.status === "ACTIVE" ? p : undefined;
}

export function getVariant(
  variantId: string,
): { product: Product; variant: Variant } | undefined {
  for (const p of getStore().products) {
    const variant = p.variants.find((v) => v.id === variantId);
    if (variant) return { product: p, variant };
  }
  return undefined;
}

// 調整庫存並記錄異動（下單扣、取消補、盤點調整都走這裡）
export function adjustVariantStock(
  variantId: string,
  delta: number,
  type: "SALE" | "CANCEL" | "RESTOCK" | "ADJUST",
  reason: string,
  orderNo?: string,
): boolean {
  const found = getVariant(variantId);
  if (!found) return false;
  found.variant.stock = Math.max(0, found.variant.stock + delta);
  recordMovement({
    variantId,
    productTitle: found.product.title,
    optionLabel: variantOptionLabel(found.variant),
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
  images?: string[];
  optionGroups: OptionGroup[];
  variants: { options: Record<string, string>; price: number; stock: number }[];
};

export function createProduct(input: CreateProductInput): string {
  const store = getStore();
  const slug = `c${Date.now().toString(36)}`;
  const variants: Variant[] = input.variants.map((v, i) => ({
    id: `${slug}-v${i + 1}`,
    options: v.options,
    price: v.price,
    stock: v.stock,
  }));
  const product: Product = {
    id: slug,
    slug,
    title: input.title,
    categorySlug: input.categorySlug,
    description: input.description,
    price: Math.min(...variants.map((v) => v.price)),
    gradient: input.gradient,
    images: (input.images ?? []).map((url) => ({ url })),
    optionGroups: input.optionGroups,
    variants,
    status: "ACTIVE",
  };
  store.products.push(product);
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

export function updateProduct(slug: string, input: UpdateProductInput): boolean {
  const p = getProduct(slug);
  if (!p) return false;
  p.title = input.title;
  p.description = input.description;
  p.categorySlug = input.categorySlug;
  p.status = input.status;
  p.images = input.images;
  for (const vi of input.variants) {
    const v = p.variants.find((x) => x.id === vi.id);
    if (v) {
      v.price = vi.price;
      if (vi.stock !== v.stock) {
        const delta = vi.stock - v.stock;
        v.stock = vi.stock;
        recordMovement({
          variantId: v.id,
          productTitle: p.title,
          optionLabel: variantOptionLabel(v),
          type: "ADJUST",
          delta,
          reason: "後台庫存調整",
        });
      }
    }
  }
  recalcPrice(p);
  return true;
}

export function setProductStatus(slug: string, status: ProductStatus): boolean {
  const p = getProduct(slug);
  if (!p) return false;
  p.status = status;
  return true;
}
