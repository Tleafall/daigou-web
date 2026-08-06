import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listConversations } from "@/lib/chat-store";

export const metadata: Metadata = { title: "客服訊息" };

export default async function AdminChatsPage() {
  await requireAdmin();
  const conversations = listConversations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">客服訊息</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">客服訊息</h1>

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
              className="rounded-xl border border-line bg-white p-4 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.userName}</span>
                <span className="text-xs text-ink/40">
                  {c.last ? new Date(c.last.createdAt).toLocaleString("zh-TW") : ""}
                </span>
              </div>
              <div className="mt-1 truncate text-sm text-ink/60">
                {c.last ? `${c.last.sender === "admin" ? "你：" : ""}${c.last.text}` : "（無訊息）"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
