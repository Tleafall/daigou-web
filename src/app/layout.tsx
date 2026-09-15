import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { auth } from "@/auth";
import { CartProvider } from "@/lib/cart-context";
import { listCategories } from "@/lib/category-store";
import { getSettings } from "@/lib/settings-store";
import { SettingsProvider } from "@/lib/settings-context";
import { adminUnreadCount, customerHasUnread } from "@/lib/chat-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    title: {
      default: `${settings.name} — ${settings.tagline}`,
      template: `%s — ${settings.name}`,
    },
    description: settings.tagline,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, role: session.user.role }
    : null;
  const categories = listCategories();
  const settings = getSettings();

  // 客服未讀：賣家看待處理對話數，顧客看是否有新回覆
  let adminChatUnread = 0;
  let hasUnreadReply = false;
  if (session?.user?.role === "ADMIN") {
    adminChatUnread = adminUnreadCount();
  } else if (session?.user) {
    hasUnreadReply = customerHasUnread(session.user.id ?? session.user.email ?? "");
  }

  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <SettingsProvider value={settings}>
          <CartProvider>
            <SiteHeader
            user={user}
            categories={categories}
            adminChatUnread={adminChatUnread}
            hasUnreadReply={hasUnreadReply}
          />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
