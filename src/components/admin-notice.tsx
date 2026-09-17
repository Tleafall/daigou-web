"use client";

// 後台操作成功提示：跳出一條訊息、數秒後自動消失，並清掉網址上的參數
// （避免重新整理又跳一次）。
import { useEffect, useState } from "react";

export function AdminNotice({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // 清掉 ?created=… / ?deleted=… 參數
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      // 忽略
    }
    const t = window.setTimeout(() => setShow(false), 5000);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      <span>✓ {message}</span>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="ml-3 text-green-700/50 hover:text-green-700"
        aria-label="關閉"
      >
        ×
      </button>
    </div>
  );
}
