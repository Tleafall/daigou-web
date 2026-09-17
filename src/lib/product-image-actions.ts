"use server";

// 商品圖片的「即時」操作：新增（直接上傳）、刪除、排序、設定規格對應。
// 這些都會馬上寫回資料庫，不必等整張表單「儲存變更」，讓後台編輯圖片更直覺。
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { ProductImage } from "@/lib/mock-data";
import { getProduct, updateProductImages } from "@/lib/product-store";
import { deleteImage, uploadImages } from "@/lib/cloudinary";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

function revalidate(slug: string) {
  revalidatePath(`/admin/products/${slug}/edit`);
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
}

const MAX_IMAGES = 6;

// 新增圖片（前端把檔案讀成 data URL 傳進來）→ 直接上傳並附加到商品
export async function addProductImages(
  slug: string,
  dataUrls: string[],
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const product = await getProduct(slug);
  if (!product) return { ok: false, error: "找不到商品" };
  const room = MAX_IMAGES - product.images.length;
  if (room <= 0) return { ok: false, error: `最多 ${MAX_IMAGES} 張` };
  const uploaded = await uploadImages(dataUrls.slice(0, room));
  const next: ProductImage[] = [
    ...product.images,
    ...uploaded.map((u) => ({ url: u.url, publicId: u.publicId })),
  ];
  await updateProductImages(slug, next);
  revalidate(slug);
  return { ok: true };
}

// 刪除某張圖（同時嘗試清掉雲端那張）
export async function deleteProductImage(slug: string, index: number) {
  await assertAdmin();
  const product = await getProduct(slug);
  if (!product) return;
  const target = product.images[index];
  if (!target) return;
  const next = product.images.filter((_, i) => i !== index);
  await updateProductImages(slug, next);
  await deleteImage(target.publicId);
  revalidate(slug);
}

// 調整圖片順序（dir = -1 往前、+1 往後；第一張為封面）
export async function moveProductImage(slug: string, index: number, dir: -1 | 1) {
  await assertAdmin();
  const product = await getProduct(slug);
  if (!product) return;
  const images = [...product.images];
  const to = index + dir;
  if (index < 0 || index >= images.length || to < 0 || to >= images.length) return;
  [images[index], images[to]] = [images[to], images[index]];
  await updateProductImages(slug, images);
  revalidate(slug);
}

// 設定某張圖對應的規格（空字串＝不指定）
export async function setProductImageTag(
  slug: string,
  index: number,
  tag: string,
) {
  await assertAdmin();
  const product = await getProduct(slug);
  if (!product) return;
  const images = product.images.map((img, i) =>
    i === index ? { ...img, tag: tag.trim() || undefined } : img,
  );
  await updateProductImages(slug, images);
  revalidate(slug);
}
