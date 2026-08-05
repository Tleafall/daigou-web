// ⚠️ 原型用「伺服器記憶體」商品庫（可增修）。重啟伺服器會回到種子資料。
// 之後接 Prisma 後換成資料庫。
import {
  seedProducts,
  type Product,
  type ProductStatus,
} from "@/lib/mock-data";

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

// ---- 異動 ----
export type CreateProductInput = {
  title: string;
  description: string;
  categorySlug: string;
  price: number;
  stock: number;
  gradient: [string, string];
  imageDataUrl?: string;
};

export function createProduct(input: CreateProductInput): string {
  const store = getStore();
  const slug = `c${Date.now().toString(36)}`;
  const product: Product = {
    id: slug,
    slug,
    title: input.title,
    categorySlug: input.categorySlug,
    description: input.description,
    price: input.price,
    gradient: input.gradient,
    imageDataUrl: input.imageDataUrl,
    optionGroups: [],
    variants: [{ id: `${slug}-v1`, options: {}, price: input.price, stock: input.stock }],
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
  imageDataUrl?: string; // 有值才覆蓋（沒上傳新圖就維持原圖）
};

export function updateProduct(slug: string, input: UpdateProductInput): boolean {
  const p = getProduct(slug);
  if (!p) return false;
  p.title = input.title;
  p.description = input.description;
  p.categorySlug = input.categorySlug;
  p.status = input.status;
  if (input.imageDataUrl !== undefined) p.imageDataUrl = input.imageDataUrl;
  for (const vi of input.variants) {
    const v = p.variants.find((x) => x.id === vi.id);
    if (v) {
      v.price = vi.price;
      v.stock = vi.stock;
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
