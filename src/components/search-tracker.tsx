"use client";

import { useEffect, useRef } from "react";

// 記錄一次搜尋關鍵字（供未來推薦用）。同一組關鍵字只記一次。
export function SearchTracker({ query }: { query: string }) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    const q = query.trim();
    if (!q || last.current === q) return;
    last.current = q;
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SEARCH", query: q }),
    }).catch(() => {});
  }, [query]);
  return null;
}
