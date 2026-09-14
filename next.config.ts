import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 批次匯入商品時可一次上傳整批圖片
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
