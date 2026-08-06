// ⚠️ 原型用「伺服器記憶體」分類庫（可增修）。重啟伺服器會回到種子資料。之後接 Prisma。
import { seedCategories, type Category } from "@/lib/mock-data";
import { listAllProducts } from "@/lib/product-store";

type Store = { categories: Category[]; seq: number };

const g = globalThis as unknown as { __daigouCategories?: Store };

function getStore(): Store {
  if (!g.__daigouCategories) {
    g.__daigouCategories = {
      categories: seedCategories.map((c) => ({ ...c })),
      seq: 1,
    };
  }
  return g.__daigouCategories;
}

export function listCategories(): Category[] {
  return [...getStore().categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategory(slug: string): Category | undefined {
  return getStore().categories.find((c) => c.slug === slug);
}

export function categoryName(slug: string): string {
  return getCategory(slug)?.name ?? "商品";
}

export function createCategory(name: string, emoji: string): string {
  const store = getStore();
  const slug = `cat${Date.now().toString(36)}`;
  const sortOrder = Math.max(0, ...store.categories.map((c) => c.sortOrder)) + 1;
  store.categories.push({ slug, name, emoji: emoji || "🛍️", sortOrder });
  return slug;
}

export function updateCategory(
  slug: string,
  input: { name: string; emoji: string; sortOrder: number },
): boolean {
  const c = getCategory(slug);
  if (!c) return false;
  c.name = input.name;
  c.emoji = input.emoji || "🛍️";
  c.sortOrder = input.sortOrder;
  return true;
}

// 產品數（判斷能否刪除）
export function productCountForCategory(slug: string): number {
  return listAllProducts().filter((p) => p.categorySlug === slug).length;
}

export function removeCategory(slug: string): { ok: boolean; error?: string } {
  if (productCountForCategory(slug) > 0)
    return { ok: false, error: "此分類仍有商品，請先移除或改分類" };
  const store = getStore();
  store.categories = store.categories.filter((c) => c.slug !== slug);
  return { ok: true };
}
