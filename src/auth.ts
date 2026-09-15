import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { testUsers } from "@/lib/test-users";
import { findUserByEmail } from "@/lib/user-store";
import { verifyPassword } from "@/lib/password";

// 帳密測試登入 + JWT session。
// JWT 策略是刻意選的：之後加 Google/LINE + Prisma adapter 時仍可沿用，
// 且 Credentials provider 只能搭配 JWT。
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "帳號密碼",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "密碼", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // 先查資料庫的註冊會員（密碼經雜湊）
        const dbUser = await findUserByEmail(email);
        if (dbUser?.passwordHash) {
          const ok = await verifyPassword(password, dbUser.passwordHash);
          if (!ok) return null;
          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
          };
        }

        // 再退回內建測試帳號（admin/customer）
        const testUser = testUsers.find(
          (u) => u.email === email && u.password === password,
        );
        if (!testUser) return null;
        return {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role,
        };
      },
    }),
  ],
  callbacks: {
    // 把 role 塞進 token
    jwt: ({ token, user }) => {
      if (user) token.role = user.role;
      return token;
    },
    // 再從 token 帶到 session，讓 server 端可讀 session.user.id / role
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      }
      return session;
    },
  },
});
