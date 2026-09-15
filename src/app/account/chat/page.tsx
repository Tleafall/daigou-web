import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getConversation, markReadByCustomer } from "@/lib/chat-store";
import { customerSendMessageAction } from "@/lib/chat-actions";
import { getProduct } from "@/lib/product-store";
import { ChatProductCard } from "@/components/chat-product-card";

export const metadata: Metadata = { title: "客服聊聊" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const user = await requireUser();
  const { product: productSlug } = await searchParams;
  const uid = user.id ?? user.email ?? "";
  const conversation = getConversation(uid);
  const messages = conversation?.messages ?? [];
  markReadByCustomer(uid); // 打開就標記為已讀

  // 從商品頁點「聊聊」帶進來的商品
  const askingProduct = productSlug ? getProduct(productSlug) : undefined;
  const askingCard = askingProduct
    ? {
        slug: askingProduct.slug,
        title: askingProduct.title,
        price: askingProduct.price,
        image: askingProduct.images[0]?.url,
        gradient: askingProduct.gradient,
      }
    : undefined;

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
            <div key={m.id} className={`flex flex-col ${m.sender === "customer" ? "items-end" : "items-start"}`}>
              {m.product && (
                <div className="mb-1 w-56 max-w-[80%]">
                  <ChatProductCard product={m.product} />
                </div>
              )}
              {m.text && (
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender === "customer" ? "bg-brand text-white" : "bg-muted text-ink"
                  }`}
                >
                  {m.text}
                </div>
              )}
              <div className="mt-0.5 text-[10px] text-ink/40">
                {m.sender === "bot" ? "自動回覆 · " : m.sender === "admin" ? "賣家 · " : ""}
                {new Date(m.createdAt).toLocaleString("zh-TW")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 詢問中的商品 */}
      {askingCard && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted p-2 text-xs text-ink/60">
          <span className="shrink-0">詢問商品：</span>
          <div className="w-56">
            <ChatProductCard product={askingCard} />
          </div>
        </div>
      )}

      <form action={customerSendMessageAction} className="mt-3 flex gap-2">
        {productSlug && <input type="hidden" name="productSlug" value={productSlug} />}
        <input
          name="text"
          placeholder={askingCard ? "想問這個商品什麼呢？" : "輸入訊息…"}
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
