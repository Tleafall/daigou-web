import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listConversations } from "@/lib/chat-store";

export const metadata: Metadata = { title: "客服訊息" };

export default async function AdminChatsPage() {
  await requireAdmin();
  const conversations = listConversations();
  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">客服訊息</span>
      </nav>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold">
        客服訊息
        {unreadCount > 0 && (
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-sm font-medium text-white">
            {unreadCount} 筆未讀
          </span>
        )}
      </h1>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
          目前沒有客服訊息
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.userId}
              href={`/admin/chats/${c.userId}`}
              className={`rounded-xl border bg-white p-4 hover:shadow-md ${
                c.unread ? "border-brand-200 bg-brand-50/40" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  <span className={c.unread ? "font-bold" : "font-medium"}>{c.userName}</span>
                </span>
                <span className="text-xs text-ink/40">
                  {c.last ? new Date(c.last.createdAt).toLocaleString("zh-TW") : ""}
                </span>
              </div>
              <div className={`mt-1 truncate text-sm ${c.unread ? "text-ink/80" : "text-ink/60"}`}>
                {c.last ? `${c.last.sender === "admin" ? "你：" : c.last.sender === "bot" ? "自動回覆：" : ""}${c.last.text}` : "（無訊息）"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
