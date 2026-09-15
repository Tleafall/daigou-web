"use client";

import { useActionState } from "react";
import { migrateImagesAction, type MigrateState } from "@/lib/media-actions";

export function MediaForm() {
  const [state, action, pending] = useActionState<MigrateState, FormData>(
    migrateImagesAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "搬移中…請稍候" : "一鍵把商品圖片搬到雲端"}
      </button>

      {state && "error" in state && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state && "done" in state && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          完成！本次搬上雲端 {state.migrated} 張
          {state.failed > 0 && `，失敗 ${state.failed} 張（已保留原圖）`}
          {state.alreadyCloud > 0 && `，已在雲端 ${state.alreadyCloud} 張`}。
        </div>
      )}
    </form>
  );
}
