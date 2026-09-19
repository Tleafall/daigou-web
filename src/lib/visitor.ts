// 匿名訪客編號：讓「同一位未登入客人」的行為能串起來（不含個資，只是一組隨機碼）。
// 只能在 route handler / server action 內寫入 cookie。
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE = "vid";

export async function getOrCreateVisitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  try {
    jar.set(COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 2, // 2 年
      path: "/",
    });
  } catch {
    /* 某些情境無法寫 cookie（例如已送出 header）：忽略即可 */
  }
  return id;
}
