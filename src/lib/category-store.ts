// 商品分類：存於 PostgreSQL（Category 表）。
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/lib/mock-data";

// 以 React cache 於單次請求內去重（分類列表在很多頁面/卡片重複用到）
export const listCategories = cache(async (): Promise<Category[]> => {
  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    emoji: r.emoji,
    sortOrder: r.sortOrder,
  }));
});

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await listCategories()).find((c) => c.slug === slug);
}

export async function categoryName(slug: string): Promise<string> {
  return (await getCategory(slug))?.name ?? "商品";
}

export async function createCategory(name: string, emoji: string): Promise<string> {
  const slug = `cat${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;
  await prisma.category.create({
    data: { slug, name, emoji: emoji || "🛍️", sortOrder },
  });
  return slug;
}

export async function updateCategory(
  slug: string,
  input: { name: string; emoji: string; sortOrder?: number },
): Promise<boolean> {
  try {
    await prisma.category.update({
      where: { slug },
      data: {
        name: input.name,
        emoji: input.emoji || "🛍️",
        // 只有明確帶入排序時才更新（排序改用拖曳，編輯名稱/圖示不動排序）
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}

// 拖曳排序：依傳入的 slug 順序重寫 sortOrder（1, 2, 3…）
export async function reorderCategories(slugs: string[]): Promise<void> {
  await prisma.$transaction(
    slugs.map((slug, i) =>
      prisma.category.update({ where: { slug }, data: { sortOrder: i + 1 } }),
    ),
  );
}

// 產品數（判斷能否刪除）
export async function productCountForCategory(slug: string): Promise<number> {
  return prisma.product.count({ where: { categorySlug: slug } });
}

export async function removeCategory(
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  if ((await productCountForCategory(slug)) > 0)
    return { ok: false, error: "此分類仍有商品，請先移除或改分類" };
  await prisma.category.delete({ where: { slug } });
  return { ok: true };
}
