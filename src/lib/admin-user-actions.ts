"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isOwnerEmail } from "@/lib/owner";
import { demoteToCustomer, promoteToAdmin } from "@/lib/user-store";

// 只有「最高管理員（擁有者）」能新增/移除管理員（真正的權限閘，不只靠前端隱藏）
async function isOwner() {
  const session = await auth();
  return session?.user?.role === "ADMIN" && isOwnerEmail(session.user.email);
}

export type PromoteState = { ok?: boolean; error?: string; email?: string } | undefined;

export async function promoteAdminAction(
  _prev: PromoteState,
  formData: FormData,
): Promise<PromoteState> {
  if (!(await isOwner())) return { error: "只有最高管理員能新增管理員。" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "請輸入 Email" };
  const res = await promoteToAdmin(email);
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin/admins");
  return { ok: true, email };
}

export async function demoteAdminAction(formData: FormData) {
  if (!(await isOwner())) throw new Error("只有最高管理員能移除管理員。");
  const userId = String(formData.get("userId") ?? "");
  await demoteToCustomer(userId); // 內含「擁有者/最後一位管理員不可移除」保護
  revalidatePath("/admin/admins");
}
