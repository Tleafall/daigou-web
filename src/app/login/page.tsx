import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings-store";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "會員登入" };

export default async function LoginPage() {
  // 已登入就直接回首頁
  const session = await auth();
  if (session?.user) redirect("/");

  const site = await getSettings();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-brand">{site.name}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          登入以查看訂單、加快結帳
        </p>

        {/* 帳密登入 */}
        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-ink/60">
          還沒有帳號？{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            註冊會員
          </Link>
        </p>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-3 rounded-lg bg-muted px-3 py-2.5 text-xs text-ink/60">
            🔧 測試帳號（僅開發模式，正式版停用）：
            <br />
            管理員 <code className="text-ink/80">admin@test.com</code> /{" "}
            <code className="text-ink/80">admin1234</code>
            <br />
            一般會員 <code className="text-ink/80">customer@test.com</code> /{" "}
            <code className="text-ink/80">user1234</code>
          </div>
        )}
      </div>

      <Link href="/" className="mt-6 text-sm text-ink/50 hover:text-brand">
        ← 返回首頁
      </Link>
    </div>
  );
}
