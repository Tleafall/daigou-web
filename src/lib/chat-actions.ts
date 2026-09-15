"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasSellerReply, sendMessage } from "@/lib/chat-store";
import { getProduct } from "@/lib/product-store";
import { getSettings } from "@/lib/settings-store";

export async function customerSendMessageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("未登入");
  const text = String(formData.get("text") || "").trim();
  const productSlug = String(formData.get("productSlug") || "").trim();
  if (!text && !productSlug) return;

  const userId = session.user.id ?? session.user.email ?? "unknown";

  // 帶入詢問中的商品（蝦皮式）
  let product;
  if (productSlug) {
    const p = await getProduct(productSlug);
    if (p) {
      product = {
        slug: p.slug,
        title: p.title,
        price: p.price,
        image: p.images[0]?.url,
        gradient: p.gradient,
      };
    }
  }

  // 機器人自動回覆：只在賣家（含機器人）尚未回覆過時，於顧客發言後補一則
  const shouldBot = !hasSellerReply(userId);

  sendMessage(userId, "customer", text || "（詢問此商品）", {
    userName: session.user.name ?? "會員",
    userEmail: session.user.email ?? "",
    product,
  });

  const settings = await getSettings();
  if (shouldBot && settings.botEnabled && settings.botMessage.trim()) {
    sendMessage(userId, "bot", settings.botMessage.trim());
  }

  revalidatePath("/account/chat");
  revalidatePath(`/admin/chats/${userId}`);
  revalidatePath("/admin/chats");
}

export async function adminReplyAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
  const userId = String(formData.get("userId"));
  const text = String(formData.get("text") || "").trim();
  if (!text || !userId) return;
  sendMessage(userId, "admin", text);
  revalidatePath(`/admin/chats/${userId}`);
  revalidatePath("/admin/chats");
  revalidatePath("/account/chat");
}
