"use client";

// 編輯頁的「即時」圖片管理器：
// - 新增圖片：選檔後「直接上傳」並存進商品（不用等整張表單儲存）
// - 每張可：設定對應規格（下拉選單，免打錯字）、上/下調整順序、刪除
// 所有操作都即時寫回資料庫，再用 router.refresh() 取回最新畫面。
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductImage } from "@/lib/mock-data";
import {
  addProductImages,
  deleteProductImage,
  moveProductImage,
  setProductImageTag,
} from "@/lib/product-image-actions";

const MAX_IMAGES = 6;
const MAX_SIZE = 2_000_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ProductImageManager({
  slug,
  images,
  optionValues,
}: {
  slug: string;
  images: ProductImage[];
  optionValues: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = pending || uploading;

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setMsg(`最多 ${MAX_IMAGES} 張`);
      return;
    }
    const valid: File[] = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_SIZE) {
        setMsg(`「${f.name}」超過 2MB，已略過`);
        continue;
      }
      valid.push(f);
      if (valid.length >= room) break;
    }
    if (valid.length === 0) return;
    setUploading(true);
    setMsg("上傳中…");
    try {
      const dataUrls = await Promise.all(valid.map(readAsDataUrl));
      const res = await addProductImages(slug, dataUrls);
      setMsg(res.ok ? "已上傳" : res.error ?? "上傳失敗");
    } catch {
      setMsg("上傳失敗，請重試");
    } finally {
      setUploading(false);
      router.refresh();
      window.setTimeout(() => setMsg(null), 2500);
    }
  }

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="w-32 rounded-lg border border-line p-2">
              <div className="relative h-28 w-full overflow-hidden rounded-md ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-brand px-1 text-[10px] text-white">
                    封面
                  </span>
                )}
              </div>

              {/* 規格對應（下拉，免打錯字） */}
              <select
                value={img.tag ?? ""}
                disabled={busy}
                onChange={(e) => run(() => setProductImageTag(slug, i, e.target.value))}
                className="mt-2 w-full rounded border border-line px-1.5 py-1 text-xs outline-none focus:border-brand"
              >
                <option value="">對應規格（不指定）</option>
                {optionValues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* 順序 + 刪除 */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={busy || i === 0}
                    onClick={() => run(() => moveProductImage(slug, i, -1))}
                    className="rounded border border-line px-1.5 py-0.5 text-ink/60 hover:border-brand hover:text-brand disabled:opacity-30"
                    aria-label="往前"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={busy || i === images.length - 1}
                    onClick={() => run(() => moveProductImage(slug, i, 1))}
                    className="rounded border border-line px-1.5 py-0.5 text-ink/60 hover:border-brand hover:text-brand disabled:opacity-30"
                    aria-label="往後"
                  >
                    ▶
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => deleteProductImage(slug, i))}
                  className="text-ink/50 hover:text-red-500 disabled:opacity-30"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy || images.length >= MAX_IMAGES}
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:text-ink/30"
        >
          ＋ 新增圖片（直接上傳）
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdd}
          className="hidden"
        />
        <span className="text-xs text-ink/40">
          {images.length} / {MAX_IMAGES} 張 · 第一張為封面{msg ? ` · ${msg}` : ""}
        </span>
      </div>
    </div>
  );
}
