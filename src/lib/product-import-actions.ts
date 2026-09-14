"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { listCategories } from "@/lib/category-store";
import { createProduct } from "@/lib/product-store";
import { gradientPresets } from "@/lib/mock-data";
import { parseRows } from "@/lib/product-import";

export type RowError = { row: number; title: string; reason: string };
export type ImportResult =
  | { ok: true; created: number; errors: RowError[] }
  | { ok: false; error: string };

const MAX_ROWS = 500;

export async function importProductsAction(
  _prev: ImportResult | undefined,
  formData: FormData,
): Promise<ImportResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "需要管理員權限" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "請先選擇檔案" };
  if (file.size > 3_000_000)
    return { ok: false, error: "檔案過大（上限 3MB）" };

  let rows;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    rows = parseRows(buf);
  } catch {
    return { ok: false, error: "無法讀取檔案，請確認是 Excel(.xlsx) 或 CSV 格式" };
  }

  if (rows.length === 0) return { ok: false, error: "檔案內沒有商品資料" };
  if (rows.length > MAX_ROWS)
    return { ok: false, error: `單次最多匯入 ${MAX_ROWS} 筆` };

  const categories = listCategories();
  const catByName = new Map(categories.map((c) => [c.name, c.slug]));

  let created = 0;
  const errors: RowError[] = [];

  rows.forEach((r, i) => {
    const rowNo = i + 2; // 表頭佔第 1 列
    // 完全空白列：略過不算錯
    if (!r.title && !r.category && r.price <= 0 && !r.description) return;

    if (!r.title) {
      errors.push({ row: rowNo, title: "（空白）", reason: "缺少商品名稱" });
      return;
    }
    if (!r.category) {
      errors.push({ row: rowNo, title: r.title, reason: "缺少分類" });
      return;
    }
    const slug = catByName.get(r.category);
    if (!slug) {
      errors.push({ row: rowNo, title: r.title, reason: `找不到分類「${r.category}」` });
      return;
    }
    if (r.price <= 0) {
      errors.push({ row: rowNo, title: r.title, reason: "售價需大於 0" });
      return;
    }

    const gradient = gradientPresets[created % gradientPresets.length];
    createProduct({
      title: r.title,
      description: r.description,
      categorySlug: slug,
      gradient,
      images: [],
      optionGroups: [],
      variants: [{ options: {}, price: r.price, stock: r.stock }],
    });
    created++;
  });

  if (created > 0) {
    revalidatePath("/admin/products");
    revalidatePath("/");
  }
  return { ok: true, created, errors };
}
