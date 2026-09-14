"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  importProductsAction,
  type ImportResult,
} from "@/lib/product-import-actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportResult | undefined, FormData>(
    importProductsAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">選擇檔案（.xlsx 或 .csv）</span>
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            required
            className="w-full rounded-lg border border-line px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1 file:text-white"
          />
        </label>
        <button
          disabled={pending}
          className="self-start rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "匯入中…" : "開始匯入"}
        </button>
      </form>

      {state && !state.ok && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {state && state.ok && (
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              成功匯入 {state.created} 筆
            </span>
            {state.errors.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                {state.errors.length} 筆未匯入
              </span>
            )}
          </div>

          {(state.imagesOk > 0 || state.imagesFailed > 0) && (
            <p className="mt-2 text-sm text-ink/60">
              圖片：成功抓取 {state.imagesOk} 張
              {state.imagesFailed > 0 &&
                `，${state.imagesFailed} 張抓不到（該網站可能擋外部連結；可稍後在編輯頁手動補上）`}
            </p>
          )}

          {state.errors.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-ink/70">未匯入的資料（請修正後重新上傳）</div>
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[360px] text-sm">
                  <thead className="bg-muted text-left text-xs text-ink/60">
                    <tr>
                      <th className="px-3 py-2">第幾列</th>
                      <th className="px-3 py-2">商品</th>
                      <th className="px-3 py-2">原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.errors.map((e, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-2 text-ink/60">第 {e.row} 列</td>
                        <td className="px-3 py-2">{e.title}</td>
                        <td className="px-3 py-2 text-red-500">{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {state.created > 0 && (
            <Link
              href="/admin/products"
              className="mt-4 inline-block rounded-full border border-line px-5 py-2 text-sm text-ink/70 hover:border-brand hover:text-brand"
            >
              前往商品管理查看 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
