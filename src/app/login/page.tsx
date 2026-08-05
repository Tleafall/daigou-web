import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "會員登入" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <div className="w-full rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-brand">{site.name}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          登入以查看訂單、加快結帳
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-3 rounded-full border border-line py-3 text-sm font-medium text-ink/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285F4] ring-1 ring-line">
              G
            </span>
            使用 Google 登入
          </button>

          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-3 rounded-full py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: "#06C755" }}
          >
            <span className="grid h-5 w-5 place-items-center rounded bg-white text-xs font-bold text-[#06C755]">
              L
            </span>
            使用 LINE 登入
          </button>
        </div>

        <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-center text-xs text-ink/50">
          🔧 骨架階段：登入按鈕尚未接上金鑰。
          <br />
          取得 Google / LINE 金鑰後即可開通實際登入。
        </p>
      </div>

      <Link href="/" className="mt-6 text-sm text-ink/50 hover:text-brand">
        ← 返回首頁
      </Link>
    </div>
  );
}
