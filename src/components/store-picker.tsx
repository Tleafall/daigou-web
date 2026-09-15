"use client";

import { useEffect, useRef, useState } from "react";
import type { Store711 } from "@/lib/stores-711";
import { IconSearch, IconClose } from "./icons";

// 7-11 賣貨便取貨門市選擇器：輸入關鍵字（店名 / 地址 / 門市代號）即時搜尋並選取
export function StorePicker({
  value,
  onChange,
}: {
  value: Store711 | null;
  onChange: (store: Store711 | null) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Store711[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 點擊元件外面時關閉下拉
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 關鍵字防抖後查詢（setState 都放在非同步 callback 內，避免同步觸發連鎖 render）
  useEffect(() => {
    const q = keyword.trim();
    if (q.length < 1) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stores?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* 中斷或網路錯誤：忽略 */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [keyword]);

  function select(store: Store711) {
    onChange(store);
    setOpen(false);
    setKeyword("");
    setResults([]);
  }

  // 已選門市：顯示卡片 + 可重新選擇
  if (value) {
    return (
      <div className="rounded-lg border border-brand/40 bg-brand-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm">
            <div className="font-medium text-ink">
              7-11 {value.name}
              <span className="ml-2 font-mono text-xs text-ink/50">#{value.id}</span>
            </div>
            <div className="mt-0.5 text-xs text-ink/60">{value.addr}</div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded-full px-2 py-1 text-xs text-ink/50 hover:bg-white hover:text-ink"
          >
            重新選擇
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 focus-within:border-brand">
        <IconSearch className="h-4 w-4 shrink-0 text-ink/40" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="輸入門市店名、地址或門市代號搜尋"
          autoComplete="off"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => {
              setKeyword("");
              setResults([]);
            }}
            className="shrink-0 text-ink/40 hover:text-ink"
            aria-label="清除"
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && keyword.trim() && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
          {loading && results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-ink/40">搜尋中…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-ink/40">
              找不到符合的門市，換個關鍵字試試
            </div>
          ) : (
            results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => select(s)}
                className="block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-brand-50"
              >
                <div className="text-sm font-medium text-ink">
                  {s.name}
                  <span className="ml-2 font-mono text-xs text-ink/40">#{s.id}</span>
                </div>
                <div className="mt-0.5 text-xs text-ink/50">
                  {s.city}
                  {s.town}・{s.addr}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
