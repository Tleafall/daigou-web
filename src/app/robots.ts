import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 後台、會員、購物流程與 API 不需要被搜尋引擎收錄
      disallow: ["/admin", "/account", "/cart", "/checkout", "/api", "/login", "/register"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
