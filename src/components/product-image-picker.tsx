"use client";

// 可累加的商品圖片上傳器：
// 原本的 <input type="file" multiple> 每次重選都會「取代」上一批，沒辦法一張一張加。
// 這個元件把選到的檔案累加起來、顯示預覽、可個別刪除，最後同步到一個隱藏的
// <input name="images" multiple> 一起送出（用 DataTransfer 把檔案清單塞回 input）。
import { useEffect, useRef, useState } from "react";
import { shrinkImageFile } from "@/lib/resize-image";

export function ProductImagePicker({
  name = "images",
  max = 6,
}: {
  name?: string;
  max?: number;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // 依目前檔案清單重建預覽網址，並在變動/卸載時釋放舊網址
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  // 把檔案清單寫回真正會送出的隱藏 input
  function syncToHiddenInput(next: File[]) {
    if (!hiddenRef.current) return;
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    hiddenRef.current.files = dt.files;
  }

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // 清掉暫存選擇，讓同一張也能再次被選、且可再次打開檔案框
    if (picked.length === 0) return;
    setProcessing(true);
    const merged = [...files];
    for (const f of picked) {
      if (merged.length >= max) break;
      if (!f.type.startsWith("image/")) continue;
      // 送出前先自動縮小 + 壓縮，避免上傳太慢/超時
      const small = await shrinkImageFile(f);
      // 用「檔名+大小」去重，避免重複加同一張
      if (merged.some((m) => m.name === small.name && m.size === small.size)) continue;
      merged.push(small);
    }
    setFiles(merged);
    syncToHiddenInput(merged);
    setProcessing(false);
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    syncToHiddenInput(next);
  }

  const full = files.length >= max;

  return (
    <div>
      {/* 真正送出的欄位（隱藏），內容由上面 DataTransfer 同步 */}
      <input ref={hiddenRef} type="file" name={name} multiple accept="image/*" className="hidden" />

      {previews.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={i} className="relative w-24">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-brand px-1 text-[10px] text-white">
                    封面
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-600"
                aria-label="移除這張"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm ${
          full ? "cursor-not-allowed text-ink/30" : "text-ink/70 hover:border-brand hover:text-brand"
        }`}
      >
        {processing ? "處理中…" : "＋ 新增圖片"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={full || processing}
          onChange={handlePick}
          className="hidden"
        />
      </label>
      <span className="ml-2 text-xs text-ink/40">
        已選 {files.length} / {max} 張 · 可一次多選或分次新增 · 會自動壓縮、免擔心大小 · 第一張為封面
      </span>
    </div>
  );
}
