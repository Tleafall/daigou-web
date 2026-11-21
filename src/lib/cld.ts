// Cloudinary 圖片網址加上自動格式／品質／寬度，手機載入更快。
// 只處理 Cloudinary 網址；其他網址（例如舊的 data: 圖片）原樣回傳。
export function cldUrl(url: string | undefined | null, width: number): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  // 已經加過轉換參數就不重複加
  if (/\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
