import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { logoutAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "後台管理" };

export default async function AdminPage() {
  const admin = await requireAdmin();

  const cards: { title: string; desc: string; href?: string }[] = [
    { title: "訂單管理", desc: "訂單狀態、確認、出貨、取消、客戶風險", href: "/admin/orders" },
    { title: "商品管理", desc: "商品、規格與庫存、批次匯入", href: "/admin/products" },
    { title: "客戶風險", desc: "棄單/取消次數、風險分數、封鎖", href: "/admin/customers" },
    { title: "庫存異動", desc: "庫存流水與稽核", href: "/admin/inventory" },
    { title: "分類管理", desc: "分類與排序", href: "/admin/categories" },
    { title: "網站設定", desc: "店名、促銷字、運費、LINE、聯絡方式", href: "/admin/settings" },
    { title: "管理員權限", desc: "授權其他管理員", href: undefined },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">後台管理</h1>
          <p className="mt-1 text-sm text-ink/60">
            管理員：{admin.name}（僅 ADMIN 可見此頁）
          </p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-full border border-line px-4 py-1.5 text-sm text-ink/70 hover:border-brand hover:text-brand">
            登出
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) =>
          item.href ? (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand hover:bg-brand-50"
            >
              <div className="font-medium">{item.title}</div>
              <div className="mt-1 text-sm text-ink/50">{item.desc}</div>
              <div className="mt-2 text-xs font-medium text-brand">前往 →</div>
            </Link>
          ) : (
            <div key={item.title} className="rounded-xl border border-line bg-white p-4">
              <div className="font-medium">{item.title}</div>
              <div className="mt-1 text-sm text-ink/50">{item.desc}</div>
              <div className="mt-2 text-xs text-ink/40">即將推出</div>
            </div>
          ),
        )}
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm text-ink/50 hover:text-brand">
          ← 返回商店
        </Link>
      </div>
    </div>
  );
}
