import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { site } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "會員登入" };

export default async function LoginPage() {
  // 已登入就直接回首頁
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-brand">{site.name}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          登入以查看訂單、加快結帳
        </p>

        {/* 帳密登入（測試用） */}
        <div className="mt-6">
          <LoginForm />
        </div>

        <div className="mt-3 rounded-lg bg-muted px-3 py-2.5 text-xs text-ink/60">
          🔧 測試帳號（帳密登入）：
          <br />
          管理員 <code className="text-ink/80">admin@test.com</code> /{" "}
          <code className="text-ink/80">admin1234</code>
          <br />
          一般會員 <code className="text-ink/80">customer@test.com</code> /{" "}
          <code className="text-ink/80">user1234</code>
        </div>

        {/* 分隔線 */}
        <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
          <span className="h-px flex-1 bg-line" />
          之後開通
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* OAuth（尚未接金鑰） */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-3 rounded-full border border-line py-3 text-sm font-medium text-ink/50 disabled:cursor-not-allowed"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full text-xs font-bold text-[#4285F4] ring-1 ring-line">
              G
            </span>
            使用 Google 登入（待接金鑰）
          </button>
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-3 rounded-full border border-line py-3 text-sm font-medium text-ink/50 disabled:cursor-not-allowed"
          >
            <span className="grid h-5 w-5 place-items-center rounded text-xs font-bold text-[#06C755] ring-1 ring-line">
              L
            </span>
            使用 LINE 登入（待接金鑰）
          </button>
        </div>
      </div>

      <Link href="/" className="mt-6 text-sm text-ink/50 hover:text-brand">
        ← 返回首頁
      </Link>
    </div>
  );
}
