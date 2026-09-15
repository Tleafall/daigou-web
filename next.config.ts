import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允許用手機（同 Wi-Fi）以電腦 IP 連開發伺服器；IP 變了就改這裡
  allowedDevOrigins: ["192.168.1.103"],
  experimental: {
    serverActions: {
      // 批次匯入商品時可一次上傳整批圖片
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
