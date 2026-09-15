import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { cloudinaryReady } from "@/lib/cloudinary";
import { MediaForm } from "./media-form";

export const metadata: Metadata = { title: "圖片雲端化" };

export default async function AdminMediaPage() {
  await requireAdmin();
  const ready = cloudinaryReady();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">圖片雲端化</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">商品圖片雲端化（Cloudinary）</h1>
      <p className="mb-6 text-sm text-ink/50">
        之後新增/批次匯入的商品圖片會<b>自動</b>上傳雲端圖床，不用手動操作。
        這個按鈕只是給「搬家前就已經存進資料庫的舊圖」做一次性搬移用。
      </p>

      <div className="rounded-xl border border-line bg-white p-5">
        {ready ? (
          <>
            <p className="mb-3 text-sm text-ink/70">
              按下後，系統會把資料庫裡還是 base64 的商品圖逐一上傳到 Cloudinary，
              並把圖片網址換成雲端連結。過程可能需要一點時間，請不要關掉頁面。
            </p>
            <MediaForm />
          </>
        ) : (
          <p className="text-sm text-red-600">
            尚未設定 Cloudinary 金鑰。請先在專案的 <code>.env</code> 填好{" "}
            <code>CLOUDINARY_CLOUD_NAME</code>、<code>CLOUDINARY_API_KEY</code>、
            <code>CLOUDINARY_API_SECRET</code> 再重啟伺服器。
          </p>
        )}
      </div>
    </div>
  );
}
