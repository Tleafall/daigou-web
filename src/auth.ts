import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { testUsers } from "@/lib/test-users";

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
      authorize: (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const user = testUsers.find(
          (u) => u.email === email && u.password === password,
        );
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
    // 再從 token 帶到 session，讓 server 端可讀 session.user.role
    session: ({ session, token }) => {
      if (session.user) {
        session.user.role = (token.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      }
      return session;
    },
  },
});
