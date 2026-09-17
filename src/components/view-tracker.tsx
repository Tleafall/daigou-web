"use client";

import { useEffect, useRef } from "react";

// 商品頁在真正被瀏覽器打開時，記一次瀏覽次數（避免預抓/伺服器多次渲染灌水）
export function ViewTracker({ slug }: { slug: string }) {
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    fetch(`/api/products/${encodeURIComponent(slug)}/view`, { method: "POST" }).catch(
      () => {},
    );
  }, [slug]);
  return null;
}
