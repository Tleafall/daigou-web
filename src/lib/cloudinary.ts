// Cloudinary 圖床：把商品圖上傳到雲端 CDN，資料庫只存網址（不再塞 base64）。
// 金鑰放 .env（CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET）。
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// 是否已設定金鑰（沒設定時自動退回原本存 base64 的做法）
export function cloudinaryReady(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

// 上傳一張圖（吃 data URL 或一般網址），成功回傳 CDN 網址 + publicId，失敗回 null
export async function uploadImage(
  source: string,
  folder = "daigou/products",
): Promise<{ url: string; publicId: string } | null> {
  if (!cloudinaryReady()) return null;
  try {
    const res = await cloudinary.uploader.upload(source, {
      folder,
      resource_type: "image",
    });
    return { url: res.secure_url, publicId: res.public_id };
  } catch (err) {
    console.error("[cloudinary] 上傳失敗：", err);
    return null;
  }
}

// 把一批圖片來源（data URL）上傳到 Cloudinary；某張失敗時保留原來源當備援，不中斷。
export async function uploadImages(
  sources: string[],
  folder = "daigou/products",
): Promise<{ url: string; publicId?: string }[]> {
  const out: { url: string; publicId?: string }[] = [];
  for (const src of sources) {
    const uploaded = await uploadImage(src, folder);
    out.push(uploaded ? { url: uploaded.url, publicId: uploaded.publicId } : { url: src });
  }
  return out;
}
