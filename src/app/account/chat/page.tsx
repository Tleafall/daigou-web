import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getConversation } from "@/lib/chat-store";
import { customerSendMessageAction } from "@/lib/chat-actions";

export const metadata: Metadata = { title: "客服聊聊" };

export default async function ChatPage() {
  const user = await requireUser();
  const conversation = getConversation(user.id ?? user.email ?? "");
  const messages = conversation?.messages ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/account" className="hover:text-brand">會員中心</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">客服聊聊</span>
      </nav>
      <h1 className="mb-4 text-xl font-bold">客服聊聊</h1>

      <div className="flex min-h-[300px] flex-col gap-2 rounded-xl border border-line bg-white p-4">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-ink/40">有任何問題都可以在這裡留言，賣家會盡快回覆 🙂</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.sender === "customer" ? "self-end" : "self-start"}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender === "customer"
                    ? "bg-brand text-white"
                    : "bg-muted text-ink"
                }`}
              >
                {m.text}
              </div>
              <div className={`mt-0.5 text-[10px] text-ink/40 ${m.sender === "customer" ? "text-right" : ""}`}>
                {m.sender === "admin" ? "賣家 · " : ""}
                {new Date(m.createdAt).toLocaleString("zh-TW")}
              </div>
            </div>
          ))
        )}
      </div>

      <form action={customerSendMessageAction} className="mt-3 flex gap-2">
        <input
          name="text"
          placeholder="輸入訊息…"
          autoComplete="off"
          className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          送出
        </button>
      </form>
    </div>
  );
}
