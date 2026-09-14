"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { listCategories } from "@/lib/category-store";
import { createProduct } from "@/lib/product-store";
import { gradientPresets } from "@/lib/mock-data";
import { parseRows } from "@/lib/product-import";

export type RowError = { row: number; title: string; reason: string };
export type ImportResult =
  | {
      ok: true;
      created: number;
      imagesOk: number;
      imagesFailed: number;
      errors: RowError[];
    }
  | { ok: false; error: string };

const MAX_ROWS = 500;
const MAX_IMAGES_PER_PRODUCT = 4;
const MAX_IMAGE_BYTES = 3_000_000;

// 抓取外部圖片轉成 data URL（僅 admin 觸發；含格式/大小/逾時保護）
async function fetchImageAsDataUrl(raw: string): Promise<string | null> {
  const url = raw.trim();
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!ct.startsWith("image/")) return null;
    const ab = await res.arrayBuffer();
    if (ab.byteLength === 0 || ab.byteLength > MAX_IMAGE_BYTES) return null;
    return `data:${ct};base64,${Buffer.from(ab).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function importProductsAction(
  _prev: ImportResult | undefined,
  formData: FormData,
): Promise<ImportResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "需要管理員權限" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "請先選擇檔案" };
  if (file.size > 3_000_000) return { ok: false, error: "檔案過大（上限 3MB）" };

  let rows;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    rows = parseRows(buf);
  } catch {
    return { ok: false, error: "無法讀取檔案，請確認是 Excel(.xlsx) 或 CSV 格式" };
  }

  if (rows.length === 0) return { ok: false, error: "檔案內沒有商品資料" };
  if (rows.length > MAX_ROWS) return { ok: false, error: `單次最多匯入 ${MAX_ROWS} 筆` };

  const categories = listCategories();
  const catByName = new Map(categories.map((c) => [c.name, c.slug]));

  let created = 0;
  let imagesOk = 0;
  let imagesFailed = 0;
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // 表頭佔第 1 列

    if (!r.title && !r.category && r.price <= 0 && !r.description && !r.imageUrl) continue;
    if (!r.title) {
      errors.push({ row: rowNo, title: "（空白）", reason: "缺少商品名稱" });
      continue;
    }
    if (!r.category) {
      errors.push({ row: rowNo, title: r.title, reason: "缺少分類" });
      continue;
    }
    const slug = catByName.get(r.category);
    if (!slug) {
      errors.push({ row: rowNo, title: r.title, reason: `找不到分類「${r.category}」` });
      continue;
    }
    if (r.price <= 0) {
      errors.push({ row: rowNo, title: r.title, reason: "售價需大於 0" });
      continue;
    }

    // 抓圖（可多張，用逗號/空白分隔）
    const imageUrls: string[] = [];
    if (r.imageUrl) {
      const urls = r.imageUrl
        .split(/[,，\s]+/)
        .filter(Boolean)
        .slice(0, MAX_IMAGES_PER_PRODUCT);
      for (const u of urls) {
        const dataUrl = await fetchImageAsDataUrl(u);
        if (dataUrl) {
          imageUrls.push(dataUrl);
          imagesOk++;
        } else {
          imagesFailed++;
        }
      }
    }

    const gradient = gradientPresets[created % gradientPresets.length];
    createProduct({
      title: r.title,
      description: r.description,
      categorySlug: slug,
      gradient,
      images: imageUrls, // createProduct 會轉成 { url } 物件
      optionGroups: [],
      variants: [{ options: {}, price: r.price, stock: r.stock }],
    });
    created++;
  }

  if (created > 0) {
    revalidatePath("/admin/products");
    revalidatePath("/");
  }
  return { ok: true, created, imagesOk, imagesFailed, errors };
}
