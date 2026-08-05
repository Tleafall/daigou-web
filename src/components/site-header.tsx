"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { CategoryBar, CategoryList } from "./category-nav";
import { IconCart, IconClose, IconMenu, IconSearch, IconUser } from "./icons";

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      {/* 促銷條 */}
      <div className="bg-brand text-center text-xs text-white">
        <div className="mx-auto max-w-6xl px-4 py-1.5">
          全館滿 NT${site.freeShippingThreshold.toLocaleString("zh-TW")} 免運 · 支援貨到付款
        </div>
      </div>

      {/* 主列 */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-md p-1.5 text-ink hover:bg-muted md:hidden"
          aria-label="開啟選單"
        >
          <IconMenu className="h-6 w-6" />
        </button>

        <Link href="/" className="shrink-0 text-lg font-bold text-brand sm:text-xl">
          {site.name}
        </Link>

        {/* 搜尋列（桌機內嵌） */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden flex-1 items-center rounded-full border border-line bg-muted px-4 py-2 focus-within:border-brand sm:flex"
        >
          <input
            type="search"
            placeholder="搜尋商品…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
          <button type="submit" aria-label="搜尋" className="text-ink/50 hover:text-brand">
            <IconSearch className="h-5 w-5" />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Link
            href="/cart"
            className="relative rounded-md p-2 text-ink hover:bg-muted"
            aria-label="購物車"
          >
            <IconCart className="h-6 w-6" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-ink hover:bg-muted"
          >
            <IconUser className="h-6 w-6" />
            <span className="hidden sm:inline">登入</span>
          </Link>
        </div>
      </div>

      {/* 搜尋列（手機獨立一行） */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex items-center gap-2 border-t border-line px-4 py-2 sm:hidden"
      >
        <div className="flex flex-1 items-center rounded-full border border-line bg-muted px-4 py-2 focus-within:border-brand">
          <input
            type="search"
            placeholder="搜尋商品…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
          <IconSearch className="h-5 w-5 text-ink/50" />
        </div>
      </form>

      <CategoryBar />

      {/* 手機抽屜 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-bold text-brand">{site.name}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="關閉選單"
                className="rounded-md p-1 hover:bg-muted"
              >
                <IconClose className="h-6 w-6" />
              </button>
            </div>
            <div className="px-4 py-2 text-xs font-medium text-ink/50">商品分類</div>
            <CategoryList onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-2 flex flex-col border-t border-line">
              <Link href="/login" onClick={() => setDrawerOpen(false)} className="px-4 py-3 hover:bg-muted">
                會員登入
              </Link>
              <Link href="/cart" onClick={() => setDrawerOpen(false)} className="px-4 py-3 hover:bg-muted">
                購物車
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
