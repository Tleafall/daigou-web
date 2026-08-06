"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendMessage } from "@/lib/chat-store";

export async function customerSendMessageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("未登入");
  const text = String(formData.get("text") || "").trim();
  if (!text) return;
  const userId = session.user.id ?? session.user.email ?? "unknown";
  sendMessage(
    userId,
    "customer",
    text,
    session.user.name ?? "會員",
    session.user.email ?? "",
  );
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
