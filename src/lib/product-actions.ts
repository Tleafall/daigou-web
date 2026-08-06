"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  gradientPresets,
  type OptionGroup,
  type ProductStatus,
} from "@/lib/mock-data";
import { createProduct, getProduct, updateProduct } from "@/lib/product-store";
import type { ProductImage } from "@/lib/mock-data";

type VariantInput = { options: Record<string, string>; price: number; stock: number };

function parseVariants(raw: FormDataEntryValue | null): {
  optionGroups: OptionGroup[];
  variants: VariantInput[];
} {
  try {
    const parsed = JSON.parse(String(raw || "{}"));
    const optionGroups: OptionGroup[] = Array.isArray(parsed.optionGroups)
      ? parsed.optionGroups
      : [];
    const variants: VariantInput[] = Array.isArray(parsed.variants)
      ? parsed.variants
          .filter((v: VariantInput) => v && Number(v.price) > 0)
          .map((v: VariantInput) => ({
            options: v.options ?? {},
            price: Math.floor(Number(v.price)) || 0,
            stock: Math.max(0, Math.floor(Number(v.stock)) || 0),
          }))
      : [];
    return { optionGroups, variants };
  } catch {
    return { optionGroups: [], variants: [] };
  }
}

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

function toInt(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// 讀取多張上傳圖片轉成 data URL（原型作法；正式版改用 Cloudinary signed upload）
async function readImageDataUrls(formData: FormData): Promise<string[]> {
  const files = formData.getAll("images");
  const out: string[] = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 2_000_000) continue; // 每張 2MB 上限
    if (out.length >= 6) break; // 最多 6 張
    const buf = Buffer.from(await file.arrayBuffer());
    out.push(`data:${file.type};base64,${buf.toString("base64")}`);
  }
  return out;
}

export async function createProductAction(formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "").trim();
  const gIndex = toInt(formData.get("gradient"));
  const gradient = gradientPresets[gIndex] ?? gradientPresets[0];
  const images = await readImageDataUrls(formData);
  const { optionGroups, variants } = parseVariants(formData.get("variantsJson"));

  if (!title || !categorySlug || variants.length === 0) {
    // 基本驗證不過就退回（前端亦有 required 屬性）
    redirect("/admin/products/new?error=1");
  }

  const slug = createProduct({
    title,
    description,
    categorySlug,
    gradient,
    images,
    optionGroups,
    variants,
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products/${slug}/edit?created=1`);
}

export async function updateProductAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "").trim();
  const status = String(formData.get("status") || "ACTIVE") as ProductStatus;
  const variantIds = String(formData.get("variantIds") || "")
    .split(",")
    .filter(Boolean);

  const variants = variantIds.map((id) => ({
    id,
    price: toInt(formData.get(`price_${id}`)),
    stock: toInt(formData.get(`stock_${id}`)),
  }));
  // 重建圖片陣列：保留未刪除的既有圖（帶上新的 tag）＋ 附加新上傳的圖
  const existing = getProduct(slug)?.images ?? [];
  const removeSet = new Set(
    formData.getAll("removeIndex").map((v) => Number(v)).filter((n) => Number.isInteger(n)),
  );
  const images: ProductImage[] = [];
  existing.forEach((img, i) => {
    if (removeSet.has(i)) return;
    const tag = String(formData.get(`tag_${i}`) || "").trim();
    images.push({ url: img.url, tag: tag || undefined });
  });
  for (const url of await readImageDataUrls(formData)) images.push({ url });

  updateProduct(slug, {
    title,
    description,
    categorySlug,
    status,
    variants,
    images,
  });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  redirect("/admin/products");
}
