import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import LINE from "next-auth/providers/line";
import { testUsers } from "@/lib/test-users";
import { findUserByEmail, upsertLineUser } from "@/lib/user-store";
import { verifyPassword } from "@/lib/password";

// LINE 登入：只有在 .env 有填金鑰時才啟用（沒填就只有帳密/Email 登入，不影響現況）
const lineClientId = process.env.AUTH_LINE_ID;
const lineClientSecret = process.env.AUTH_LINE_SECRET;
export const lineLoginEnabled = Boolean(lineClientId && lineClientSecret);

const oauthProviders: NextAuthConfig["providers"] = lineLoginEnabled
  ? [LINE({ clientId: lineClientId, clientSecret: lineClientSecret })]
  : [];

// 帳密測試登入 + JWT session。
// JWT 策略是刻意選的：之後加 Google/LINE + Prisma adapter 時仍可沿用，
// 且 Credentials provider 只能搭配 JWT。
export const { handlers, signIn, signOut, auth } = NextAuth({
  // 正式上線走 Cloudflare Tunnel + 自訂網域（反向代理）時，信任轉發過來的 Host，
  // 否則登入會因為 host 不符被擋。
  trustHost: true,
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

        // 內建測試帳號（admin/customer）：僅限本機開發模式，正式版一律停用，
        // 避免預設帳密在上線後被拿來登入後台。
        if (process.env.NODE_ENV !== "production") {
          const testUser = testUsers.find(
            (u) => u.email === email && u.password === password,
          );
          if (testUser) {
            return {
              id: testUser.id,
              name: testUser.name,
              email: testUser.email,
              role: testUser.role,
            };
          }
        }
        return null;
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    // 登入當下（user 存在）決定 token。LINE 登入會把會員寫進資料庫，
    // 並把 token.sub 換成資料庫 User id，讓訂單/風險/封鎖與 Email 會員一致。
    jwt: async ({ token, user, account }) => {
      if (user) {
        if (account?.provider === "line") {
          const dbUser = await upsertLineUser(account.providerAccountId, {
            name: user.name,
            email: user.email,
            image: user.image,
          });
          token.sub = dbUser.id;
          token.role = dbUser.role;
        } else {
          token.role = (user as { role?: "CUSTOMER" | "ADMIN" }).role ?? "CUSTOMER";
        }
      }
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
