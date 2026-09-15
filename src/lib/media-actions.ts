"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { cloudinaryReady, uploadImage } from "@/lib/cloudinary";
import type { ProductImage } from "@/lib/mock-data";

export type MigrateState =
  | { done: true; migrated: number; failed: number; alreadyCloud: number }
  | { error: string }
  | undefined;

// 一鍵把「還存在資料庫裡的 base64 圖片」搬到 Cloudinary 雲端圖床。
// 新上架/匯入的圖已自動上雲，此按鈕是給搬家前就存進 DB 的舊圖用的安全網。
export async function migrateImagesAction(
  _prev: MigrateState,
  _formData: FormData,
): Promise<MigrateState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "需要管理員權限" };
  if (!cloudinaryReady())
    return { error: "尚未設定 Cloudinary 金鑰，請先在 .env 填好三個 CLOUDINARY_ 變數。" };

  const products = await prisma.product.findMany();
  let migrated = 0;
  let failed = 0;
  let alreadyCloud = 0;

  for (const p of products) {
    const images = (p.images as unknown as ProductImage[]) ?? [];
    let changed = false;
    const next: ProductImage[] = [];
    for (const img of images) {
      if (img.url.startsWith("data:")) {
        const up = await uploadImage(img.url);
        if (up) {
          next.push({ url: up.url, publicId: up.publicId, tag: img.tag });
          migrated++;
          changed = true;
        } else {
          next.push(img); // 上傳失敗保留原圖，不弄丟
          failed++;
        }
      } else {
        next.push(img);
        alreadyCloud++;
      }
    }
    if (changed) {
      await prisma.product.update({
        where: { slug: p.slug },
        data: { images: next as unknown as Prisma.InputJsonValue },
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { done: true, migrated, failed, alreadyCloud };
}
