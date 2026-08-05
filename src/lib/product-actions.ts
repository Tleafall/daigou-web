"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { gradientPresets, type ProductStatus } from "@/lib/mock-data";
import { createProduct, updateProduct } from "@/lib/product-store";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

function toInt(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// 讀取上傳圖片轉成 data URL（原型作法；正式版改用 Cloudinary signed upload）
async function readImageDataUrl(formData: FormData): Promise<string | undefined> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (!file.type.startsWith("image/")) return undefined;
  if (file.size > 2_000_000) return undefined; // 2MB 上限
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buf.toString("base64")}`;
}

export async function createProductAction(formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "").trim();
  const price = toInt(formData.get("price"));
  const stock = toInt(formData.get("stock"));
  const gIndex = toInt(formData.get("gradient"));
  const gradient = gradientPresets[gIndex] ?? gradientPresets[0];
  const imageDataUrl = await readImageDataUrl(formData);

  if (!title || !categorySlug || price <= 0) {
    // 基本驗證不過就退回列表（前端亦有 required 屬性）
    redirect("/admin/products/new?error=1");
  }

  const slug = createProduct({
    title,
    description,
    categorySlug,
    price,
    stock,
    gradient,
    imageDataUrl,
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
  const imageDataUrl = await readImageDataUrl(formData);

  updateProduct(slug, {
    title,
    description,
    categorySlug,
    status,
    variants,
    imageDataUrl,
  });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  redirect("/admin/products");
}
