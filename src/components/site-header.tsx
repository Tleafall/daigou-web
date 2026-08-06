"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { logoutAction } from "@/lib/auth-actions";
import { useCart } from "@/lib/cart-context";
import type { Category } from "@/lib/mock-data";
import { CategoryBar, CategoryList } from "./category-nav";
import { IconCart, IconClose, IconMenu, IconSearch, IconUser } from "./icons";

type HeaderUser = {
  name?: string | null;
  role: "CUSTOMER" | "ADMIN";
} | null;

export function SiteHeader({
  user,
  categories,
}: {
  user?: HeaderUser;
  categories: Category[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      {/* 促銷條（文字可在 src/lib/site.ts 的 announcement 修改） */}
      <div className="bg-brand text-center text-xs text-white">
        <div className="mx-auto max-w-6xl px-4 py-1.5">{site.announcement}</div>
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
          action="/search"
          className="hidden flex-1 items-center rounded-full border border-line bg-muted px-4 py-2 focus-within:border-brand sm:flex"
        >
          <input
            type="search"
            name="q"
            placeholder="搜尋商品…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
          <button type="submit" aria-label="搜尋" className="text-ink/50 hover:text-brand">
            <IconSearch className="h-5 w-5" />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden rounded-md px-2 py-2 text-sm font-medium text-brand hover:bg-brand-50 sm:inline"
            >
              後台
            </Link>
          )}

          <Link
            href="/cart"
            className="relative rounded-md p-2 text-ink hover:bg-muted"
            aria-label="購物車"
          >
            <IconCart className="h-6 w-6" />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link
                href="/account"
                className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-ink hover:bg-muted"
              >
                <IconUser className="h-6 w-6" />
                <span className="hidden max-w-24 truncate sm:inline">
                  {user.name ?? "會員"}
                </span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="hidden rounded-md px-2 py-2 text-sm text-ink/60 hover:bg-muted hover:text-brand sm:inline"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-ink hover:bg-muted"
            >
              <IconUser className="h-6 w-6" />
              <span className="hidden sm:inline">登入</span>
            </Link>
          )}
        </div>
      </div>

      {/* 搜尋列（手機獨立一行） */}
      <form
        action="/search"
        className="flex items-center gap-2 border-t border-line px-4 py-2 sm:hidden"
      >
        <div className="flex flex-1 items-center rounded-full border border-line bg-muted px-4 py-2 focus-within:border-brand">
          <input
            type="search"
            name="q"
            placeholder="搜尋商品…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
          <IconSearch className="h-5 w-5 text-ink/50" />
        </div>
      </form>

      <CategoryBar categories={categories} />

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
            <CategoryList categories={categories} onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-2 flex flex-col border-t border-line">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setDrawerOpen(false)} className="px-4 py-3 hover:bg-muted">
                    會員中心（{user.name ?? "會員"}）
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setDrawerOpen(false)} className="px-4 py-3 font-medium text-brand hover:bg-muted">
                      後台管理
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button type="submit" className="w-full px-4 py-3 text-left hover:bg-muted">
                      登出
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" onClick={() => setDrawerOpen(false)} className="px-4 py-3 hover:bg-muted">
                  會員登入
                </Link>
              )}
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
