"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { demoteToCustomer, promoteToAdmin } from "@/lib/user-store";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

export type PromoteState = { ok?: boolean; error?: string; email?: string } | undefined;

export async function promoteAdminAction(
  _prev: PromoteState,
  formData: FormData,
): Promise<PromoteState> {
  await assertAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "請輸入 Email" };
  const res = await promoteToAdmin(email);
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin/admins");
  return { ok: true, email };
}

export async function demoteAdminAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("userId") ?? "");
  await demoteToCustomer(userId); // 內含「最後一位管理員不可移除」保護
  revalidatePath("/admin/admins");
}
