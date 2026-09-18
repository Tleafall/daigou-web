"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createCategory,
  removeCategory,
  reorderCategories,
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
  await createCategory(name, emoji);
  refresh();
}

export async function updateCategoryAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim();
  if (!name) return;
  await updateCategory(slug, { name, emoji }); // 排序改用拖曳，這裡不動 sortOrder
  refresh();
}

export async function reorderCategoriesAction(slugs: string[]) {
  await assertAdmin();
  if (!Array.isArray(slugs) || slugs.length === 0) return;
  await reorderCategories(slugs.map(String));
  refresh();
}

export async function removeCategoryAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  await removeCategory(slug); // 有商品時 store 會拒絕
  refresh();
}
