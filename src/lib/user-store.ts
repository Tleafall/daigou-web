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
