import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { logoutAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "後台管理" };

export default async function AdminPage() {
  const admin = await requireAdmin();

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
        {[
          { title: "商品管理", desc: "新增/編輯商品、規格與庫存、上下架" },
          { title: "訂單管理", desc: "訂單狀態、確認、出貨、取消回補庫存" },
          { title: "客戶風險", desc: "棄單/取消次數、風險分數、封鎖" },
          { title: "分類管理", desc: "分類與排序" },
          { title: "庫存異動", desc: "庫存流水與稽核" },
          { title: "管理員權限", desc: "授權其他管理員" },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-line bg-white p-4"
          >
            <div className="font-medium">{item.title}</div>
            <div className="mt-1 text-sm text-ink/50">{item.desc}</div>
            <div className="mt-2 text-xs text-ink/40">即將推出</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm text-ink/50 hover:text-brand">
          ← 返回商店
        </Link>
      </div>
    </div>
  );
}
