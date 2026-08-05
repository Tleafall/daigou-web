import { redirect } from "next/navigation";
import { auth } from "@/auth";

// 受保護頁面的伺服器端守門（真正的權限閘門，不靠前端隱藏）
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/"); // 一般會員擋在門外
  return session.user;
}
