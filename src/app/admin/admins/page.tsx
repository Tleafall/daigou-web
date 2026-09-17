import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listAdmins } from "@/lib/user-store";
import { isOwnerEmail } from "@/lib/owner";
import { demoteAdminAction } from "@/lib/admin-user-actions";
import { PromoteForm } from "./promote-form";

export const metadata: Metadata = { title: "管理員管理" };

export default async function AdminAdminsPage() {
  const me = await requireAdmin();
  const admins = await listAdmins();
  const iAmOwner = isOwnerEmail(me.email);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">管理員管理</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">管理員管理</h1>
      <p className="mb-6 text-sm text-ink/50">
        管理員可以進後台管理訂單、商品、設定等。
        <span className="text-ink/70">只有「最高管理員」能新增或移除管理員；</span>
        要授權新的人，請對方先到{" "}
        <Link href="/register" className="text-brand hover:underline">註冊頁</Link>{" "}
        註冊會員，再由最高管理員用 Email 設為管理員。
      </p>

      {/* 目前管理員 */}
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="mb-3 text-sm font-bold">目前管理員（{admins.length}）</div>
        {admins.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            資料庫目前沒有正式管理員。正式上線前請先建立一位（下方用 Email 設定，或用指令
            <code className="mx-1">npm run create-admin</code>）。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {admins.map((a) => {
              const isSelf = a.id === me.id;
              const isLast = admins.length === 1;
              const isOwner = isOwnerEmail(a.email);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-line px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">{a.name || "（未命名）"}</span>
                    <span className="ml-2 text-ink/60">{a.email}</span>
                    {isOwner && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        最高管理員
                      </span>
                    )}
                    {isSelf && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand">
                        你自己
                      </span>
                    )}
                  </div>
                  {isOwner ? (
                    <span className="text-xs text-ink/30">擁有者，不可移除</span>
                  ) : isLast ? (
                    <span className="text-xs text-ink/30">最後一位，不可移除</span>
                  ) : iAmOwner ? (
                    <form action={demoteAdminAction}>
                      <input type="hidden" name="userId" value={a.id} />
                      <button className="text-xs text-ink/50 hover:text-red-500">
                        取消管理員
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新增管理員（只有最高管理員可用） */}
      {iAmOwner ? (
        <div className="mt-6 rounded-xl border border-line bg-white p-5">
          <div className="mb-3 text-sm font-bold">把會員設為管理員</div>
          <PromoteForm />
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-4 text-sm text-ink/50">
          只有「最高管理員」能新增或移除管理員。需要調整請洽最高管理員。
        </p>
      )}
    </div>
  );
}
