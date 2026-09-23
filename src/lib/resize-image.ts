// 在瀏覽器端把圖片縮小 + 壓縮，大幅降低上傳量（避免上傳超時、也不會被 2MB 限制擋掉）。
// 任何失敗都退回原檔，絕不阻擋上架。
const MAX_DIM = 1600; // 最長邊上限（像素）；商品圖這個大小很夠清晰
const QUALITY = 0.82; // JPEG 壓縮品質

export async function shrinkImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // 動圖不處理，避免變靜態
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") {
    return file;
  }
  try {
    // imageOrientation: 手機拍的照片常帶旋轉資訊，這樣會自動轉正
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file; // 沒變小就用原檔

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function shrinkImageFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await shrinkImageFile(f)); // 逐張處理，記憶體較穩
  return out;
}
