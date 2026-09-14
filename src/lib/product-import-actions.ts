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
      imageMissing: string[];
      errors: RowError[];
    }
  | { ok: false; error: string };

const MAX_ROWS = 500;
const MAX_IMAGES_PER_PRODUCT = 4;
const MAX_IMAGE_BYTES = 3_000_000;

// 上傳的圖片檔 → data URL（檢查格式與大小）
async function uploadedFileToDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return null;
  const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${b64}`;
}

// 外部圖片網址 → data URL（僅 admin；含格式/大小/逾時保護）
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
    return { ok: false, error: "請先選擇 Excel/CSV 檔案" };
  if (file.size > 3_000_000) return { ok: false, error: "Excel 檔過大（上限 3MB）" };

  let rows;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    rows = parseRows(buf);
  } catch {
    return { ok: false, error: "無法讀取檔案，請確認是 Excel(.xlsx) 或 CSV 格式" };
  }
  if (rows.length === 0) return { ok: false, error: "檔案內沒有商品資料" };
  if (rows.length > MAX_ROWS) return { ok: false, error: `單次最多匯入 ${MAX_ROWS} 筆` };

  // 建立「圖片檔名 → 檔案」對照表（同時支援含/不含副檔名）
  const fileMap = new Map<string, File>();
  for (const f of formData.getAll("imageFiles")) {
    if (!(f instanceof File) || f.size === 0) continue;
    const name = f.name.toLowerCase().trim();
    fileMap.set(name, f);
    const noExt = name.replace(/\.[^.]+$/, "");
    if (noExt && !fileMap.has(noExt)) fileMap.set(noExt, f);
  }

  const categories = listCategories();
  const catByName = new Map(categories.map((c) => [c.name, c.slug]));

  let created = 0;
  let imagesOk = 0;
  let imagesFailed = 0;
  const missingSet = new Set<string>();
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // 表頭佔第 1 列

    if (!r.title && !r.category && r.price <= 0 && !r.description && !r.imageFile && !r.imageUrl)
      continue;
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

    // 圖片：優先用「上傳圖片＋檔名對應」，否則用「圖片網址」
    const imageUrls: string[] = [];
    const names = (r.imageFile || r.imageUrl)
      .split(/[,，]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_IMAGES_PER_PRODUCT);

    for (const name of names) {
      let dataUrl: string | null = null;
      if (r.imageFile) {
        const key = name.toLowerCase();
        const matched = fileMap.get(key) ?? fileMap.get(key.replace(/\.[^.]+$/, ""));
        if (matched) {
          dataUrl = await uploadedFileToDataUrl(matched);
        } else {
          missingSet.add(name);
        }
      } else {
        dataUrl = await fetchImageAsDataUrl(name);
      }
      if (dataUrl) {
        imageUrls.push(dataUrl);
        imagesOk++;
      } else {
        imagesFailed++;
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
  return {
    ok: true,
    created,
    imagesOk,
    imagesFailed,
    imageMissing: [...missingSet].slice(0, 12),
    errors,
  };
}
