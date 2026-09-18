"use client";

// 分類清單：可用拖曳調整順序（放開即自動儲存）。
// 每一列仍可就地編輯圖示／名稱、以及刪除（沿用原本的 server actions）。
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from "@/lib/category-actions";

type Row = { slug: string; name: string; emoji: string; count: number };

const inputClass =
  "rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-brand";

export function CategoryReorderList({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(categories);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // server 端刷新後（router.refresh）同步最新資料
  useEffect(() => {
    setRows(categories);
  }, [categories]);

  function handleDragEnter(i: number) {
    const from = dragFrom.current;
    setDragOver(i);
    if (from === null || from === i) return;
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragFrom.current = i;
  }

  function persist() {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    setDragOver(null);
    const order = rows.map((r) => r.slug);
    setSaving(true);
    reorderCategoriesAction(order).finally(() => {
      setSaving(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-ink/40">
        拖曳左側 <span className="text-ink/60">⠿</span> 可調整分類順序，放開就會自動儲存
        {saving ? "（儲存中…）" : ""}
      </p>
      {rows.map((c, i) => (
        <div
          key={c.slug}
          draggable
          onDragStart={() => {
            dragFrom.current = i;
          }}
          onDragEnter={() => handleDragEnter(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={persist}
          onDragEnd={persist}
          className={`rounded-xl border bg-white p-3 transition ${
            dragOver === i ? "border-brand ring-1 ring-brand/30" : "border-line"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="cursor-grab select-none px-1 text-lg leading-none text-ink/30"
              title="拖曳調整順序"
              aria-hidden
            >
              ⠿
            </span>
            <form action={updateCategoryAction} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="slug" value={c.slug} />
              <input name="emoji" defaultValue={c.emoji} className={`${inputClass} w-14 text-center`} />
              <input name="name" defaultValue={c.name} className={`${inputClass} min-w-0 flex-1`} />
              <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
                儲存
              </button>
            </form>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-xs text-ink/50">
            <span>
              {c.count} 件商品 · /{c.slug}
            </span>
            {c.count === 0 ? (
              <form action={removeCategoryAction}>
                <input type="hidden" name="slug" value={c.slug} />
                <button className="text-ink/50 hover:text-red-500">刪除</button>
              </form>
            ) : (
              <span className="text-ink/30">有商品，無法刪除</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
