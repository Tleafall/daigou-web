// 建立（或升級）一個正式的管理員帳號（密碼會雜湊後存資料庫）。
// 用法：npm run create-admin -- <email> <密碼> [姓名]
// 例：  npm run create-admin -- boss@myshop.com MyStrongPass 姑姑
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";

const [, , emailArg, passwordArg, ...nameParts] = process.argv;

async function main() {
  const email = (emailArg ?? "").trim().toLowerCase();
  const password = passwordArg ?? "";
  const name = nameParts.join(" ").trim() || "管理員";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("✗ Email 格式不對。用法：npm run create-admin -- <email> <密碼> [姓名]");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("✗ 為了安全，管理員密碼至少 8 碼。");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash, role: "ADMIN", name },
      });
      console.log(`✓ 已把 ${email} 設為管理員並更新密碼。`);
    } else {
      await prisma.user.create({
        data: { email, name, passwordHash, role: "ADMIN" },
      });
      console.log(`✓ 已建立管理員帳號：${email}`);
    }
    console.log("  現在可以用這組 Email / 密碼登入後台。");
    console.log("  （請不要把密碼寫進任何檔案或訊息裡）");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
