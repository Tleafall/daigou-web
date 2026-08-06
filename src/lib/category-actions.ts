"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createCategory,
  removeCategory,
  updateCategory,
} from "@/lib/category-store";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("需要管理員權限");
}

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout"); // 刷新全站導覽列
}

export async function createCategoryAction(formData: FormData) {
  await assertAdmin();
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim();
  if (!name) return;
  createCategory(name, emoji);
  refresh();
}

export async function updateCategoryAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim();
  const sortOrder = Math.floor(Number(formData.get("sortOrder"))) || 0;
  if (!name) return;
  updateCategory(slug, { name, emoji, sortOrder });
  refresh();
}

export async function removeCategoryAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  removeCategory(slug); // 有商品時 store 會拒絕
  refresh();
}
