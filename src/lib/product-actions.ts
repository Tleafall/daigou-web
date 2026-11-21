"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  gradientPresets,
  type OptionGroup,
  type ProductStatus,
} from "@/lib/mock-data";
import {
  createProduct,
  deleteProduct,
  setProductFeatured,
  setProductStatus,
  updateProduct,
} from "@/lib/product-store";
import { uploadImages } from "@/lib/cloudinary";

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
  // 圖片自動上傳 Cloudinary（未設金鑰時退回存 data URL）
  const images = await uploadImages(await readImageDataUrls(formData));
  const { optionGroups, variants } = parseVariants(formData.get("variantsJson"));

  if (!title || !categorySlug || variants.length === 0) {
    // 基本驗證不過就退回（前端亦有 required 屬性）
    redirect("/admin/products/new?error=1");
  }

  const slug = await createProduct({
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
  // 建立成功回到商品管理頁（帶 created 參數，前端跳出成功提示）
  redirect(`/admin/products?created=1&title=${encodeURIComponent(title)}`);
}

export async function updateProductAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "").trim();
  const status = String(formData.get("status") || "ACTIVE") as ProductStatus;
  // 規格（含結構）可在編輯頁調整，改用與新增相同的 variantsJson
  const { optionGroups, variants } = parseVariants(formData.get("variantsJson"));

  if (!title || !categorySlug || variants.length === 0) {
    redirect(`/admin/products/${slug}/edit?error=1`);
  }

  await updateProduct(slug, {
    title,
    description,
    categorySlug,
    status,
    optionGroups,
    variants,
  });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  // 儲存成功回商品管理頁並提示（帶 title 供顯示）
  redirect(`/admin/products?updated=1&title=${encodeURIComponent(title)}`);
}

// 快速隱藏／顯示商品（ARCHIVED＝隱藏、不上架；ACTIVE＝顯示）。
// 暫時缺貨可先隱藏，不用刪除。
export async function toggleProductVisibilityAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "").trim();
  const current = String(formData.get("current") || "");
  const next = current === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  if (slug) await setProductStatus(slug, next);
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
}

// 加入／移除「首頁精選推薦」（後台商品管理的星號按鈕）
export async function toggleProductFeaturedAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "").trim();
  const current = String(formData.get("current") || "") === "1";
  if (slug) await setProductFeatured(slug, !current);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// 永久刪除商品（後台商品管理的「刪除」按鈕，前端有二次確認）
export async function deleteProductAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  if (slug) await deleteProduct(slug);
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/products?deleted=1&title=${encodeURIComponent(title)}`);
}
