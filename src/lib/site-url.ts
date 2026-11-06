// 網站對外網址（sitemap / robots 用）。可用環境變數 SITE_URL 覆寫。
export function siteUrl(): string {
  const u = process.env.SITE_URL || process.env.AUTH_URL || "https://yuchingmakeup.com";
  return u.replace(/\/+$/, "");
}
