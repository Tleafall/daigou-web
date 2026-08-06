import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getConversation } from "@/lib/chat-store";
import { adminReplyAction } from "@/lib/chat-actions";

export const metadata: Metadata = { title: "客服對話" };

export default async function AdminChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const conversation = getConversation(userId);
  if (!conversation) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin/chats" className="hover:text-brand">客服訊息</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{conversation.userName}</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">{conversation.userName}</h1>
      <p className="mb-4 text-sm text-ink/50">{conversation.userEmail}</p>

      <div className="flex min-h-[300px] flex-col gap-2 rounded-xl border border-line bg-white p-4">
        {conversation.messages.map((m) => (
          <div key={m.id} className={m.sender === "admin" ? "self-end" : "self-start"}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.sender === "admin" ? "bg-brand text-white" : "bg-muted text-ink"
              }`}
            >
              {m.text}
            </div>
            <div className={`mt-0.5 text-[10px] text-ink/40 ${m.sender === "admin" ? "text-right" : ""}`}>
              {m.sender === "customer" ? "顧客 · " : ""}
              {new Date(m.createdAt).toLocaleString("zh-TW")}
            </div>
          </div>
        ))}
      </div>

      <form action={adminReplyAction} className="mt-3 flex gap-2">
        <input type="hidden" name="userId" value={conversation.userId} />
        <input
          name="text"
          placeholder="回覆顧客…"
          autoComplete="off"
          className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          回覆
        </button>
      </form>
    </div>
  );
}
