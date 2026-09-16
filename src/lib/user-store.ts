// 會員帳號：存於 PostgreSQL（User 表）。Email 直接註冊 + 帳密登入用。
import { prisma } from "@/lib/prisma";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  passwordHash: string | null;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  const u = await prisma.user.findUnique({ where: { email: e } });
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? "",
    phone: u.phone,
    role: (u.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER",
    passwordHash: u.passwordHash,
  };
}

export type AdminSummary = { id: string; email: string; name: string };

export async function listAdmins(): Promise<AdminSummary[]> {
  const rows = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((u) => ({ id: u.id, email: u.email ?? "", name: u.name ?? "" }));
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN" } });
}

// 把已註冊的會員升級為管理員（對方需先在 /register 註冊過）
export async function promoteToAdmin(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, error: "找不到此 Email 的會員，請對方先到 /register 註冊。" };
  if (user.role === "ADMIN") return { ok: false, error: "此會員已經是管理員了。" };
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return { ok: true };
}

// 取消某人的管理員權限（降為一般會員）
export async function demoteToCustomer(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "ADMIN")
    return { ok: false, error: "找不到這位管理員。" };
  if ((await countAdmins()) <= 1)
    return { ok: false, error: "這是最後一位管理員，不能移除（否則沒人能進後台）。" };
  await prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER" } });
  return { ok: true };
}

export async function createCustomer(input: {
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
}): Promise<DbUser> {
  const u = await prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      phone: input.phone.trim(),
      passwordHash: input.passwordHash,
      role: "CUSTOMER",
    },
  });
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? "",
    phone: u.phone,
    role: "CUSTOMER",
    passwordHash: u.passwordHash,
  };
}
