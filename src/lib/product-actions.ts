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

export async function createProductAction(formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "").trim();
  const price = toInt(formData.get("price"));
  const stock = toInt(formData.get("stock"));
  const gIndex = toInt(formData.get("gradient"));
  const gradient = gradientPresets[gIndex] ?? gradientPresets[0];

  if (!title || !categorySlug || price <= 0) {
    // 基本驗證不過就退回列表（前端亦有 required 屬性）
    redirect("/admin/products/new?error=1");
  }

  const slug = createProduct({ title, description, categorySlug, price, stock, gradient });
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

  updateProduct(slug, { title, description, categorySlug, status, variants });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  redirect("/admin/products");
}
