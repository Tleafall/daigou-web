import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { logoutAction } from "@/lib/auth-actions";
import { getSettings } from "@/lib/settings-store";
import { LineContact } from "@/components/line-contact";

export const metadata: Metadata = { title: "會員中心" };

export default async function AccountPage() {
  const user = await requireUser();
  const settings = getSettings();

  const cards = [
    { title: "我的訂單", desc: "查看訂單與出貨狀態", href: "/account/orders" },
    { title: "常用收件地址", desc: "管理宅配地址", href: "/account/addresses" },
    { title: "取消 / 退換貨申請", desc: "售後服務（於訂單內操作）", href: "/account/orders" },
    { title: "帳號設定", desc: "個資與帳號刪除", href: undefined as string | undefined },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">會員中心</h1>
        <form action={logoutAction}>
          <button className="rounded-full border border-line px-4 py-1.5 text-sm text-ink/70 hover:border-brand hover:text-brand">
            登出
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white p-5">
        <div className="text-sm text-ink/60">歡迎回來</div>
        <div className="mt-1 text-lg font-semibold">{user.name}</div>
        <div className="text-sm text-ink/60">{user.email}</div>
        <span className="mt-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand">
          身分：{user.role === "ADMIN" ? "管理員" : "一般會員"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
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

      {/* 客服：加官方 LINE */}
      <div className="mt-4 rounded-xl border border-line bg-white p-5">
        <div className="font-medium">聯絡客服</div>
        <p className="mb-3 mt-1 text-sm text-ink/50">有任何問題，歡迎加官方 LINE 詢問，我們會盡快回覆。</p>
        <LineContact lineUrl={settings.lineUrl} lineId={settings.lineId} label="加 LINE 詢問" />
      </div>
    </div>
  );
}
