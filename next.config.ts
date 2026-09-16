import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允許用手機（同 Wi-Fi）以電腦 IP 連開發伺服器；IP 變了就改這裡
  allowedDevOrigins: ["192.168.1.103"],
  experimental: {
    serverActions: {
      // 批次匯入商品時可一次上傳整批圖片
      bodySizeLimit: "25mb",
      // 正式上線走 Cloudflare Tunnel + 自訂網域時，允許這些來源送出 server action
      // （少了這個，結帳/登入/後台表單在自訂網域下可能被擋）。換網域就改這裡。
      allowedOrigins: ["yuchingmakeup.com", "www.yuchingmakeup.com"],
    },
  },
};

export default nextConfig;
