import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings-store";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "註冊會員" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const site = await getSettings();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-brand">{site.name}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">
          註冊會員，下次結帳更快、可查訂單
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-ink/60">
          已經有帳號了？{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            前往登入
          </Link>
        </p>
      </div>

      <Link href="/" className="mt-6 text-sm text-ink/50 hover:text-brand">
        ← 返回首頁
      </Link>
    </div>
  );
}
