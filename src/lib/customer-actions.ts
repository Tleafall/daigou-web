"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  setCustomerFlag,
  setCustomerNote,
  type ManualFlag,
} from "@/lib/customer-store";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

export async function setCustomerFlagAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("userId"));
  const flag = String(formData.get("flag")) as ManualFlag;
  await setCustomerFlag(userId, flag);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}

export async function setCustomerNoteAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("userId"));
  const note = String(formData.get("note") || "").trim();
  await setCustomerNote(userId, note);
  revalidatePath(`/admin/customers/${userId}`);
}
