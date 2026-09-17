"use client";

// 商品刪除按鈕（二次確認）：
// 第一次點「刪除」→ 展開紅色「確定刪除？」；再點「確定」才真的送出刪除。
// 表單 action 走伺服器端 deleteProductAction（真正的權限與刪除都在後端）。
import { useState } from "react";
import { deleteProductAction } from "@/lib/product-actions";

export function DeleteProductButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-ink/50 hover:text-red-500"
      >
        刪除
      </button>
    );
  }

  return (
    <form action={deleteProductAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="title" value={title} />
      <span className="text-xs text-red-500">確定刪除？</span>
      <button
        type="submit"
        className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-red-600"
      >
        確定
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-xs text-ink/50 hover:text-ink/80"
      >
        取消
      </button>
    </form>
  );
}
