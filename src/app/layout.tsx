import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PromoBanner } from "@/components/promo-banner";
import { auth } from "@/auth";
import { CartProvider } from "@/lib/cart-context";
import { listCategories } from "@/lib/category-store";
import { countPendingOrders } from "@/lib/store";
import { getSettings } from "@/lib/settings-store";
import { SettingsProvider } from "@/lib/settings-context";
import { siteUrl } from "@/lib/site-url";
import { FestiveSnow } from "@/components/festive-snow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = `${settings.tagline}。日韓正品現貨，到 7-11 取貨才付款。`;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${settings.name} — ${settings.tagline}`,
      template: `%s — ${settings.name}`,
    },
    description,
    // LINE／FB 分享時的預覽卡（商品頁會改用商品圖）
    openGraph: {
      type: "website",
      locale: "zh_TW",
      siteName: settings.name,
      title: settings.name,
      description,
      images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: settings.name }],
    },
    twitter: { card: "summary_large_image" },
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
  const [categories, settings] = await Promise.all([listCategories(), getSettings()]);
  // 管理員：計算待處理（新）訂單數，供頁首紅點提示
  const pendingOrders = user?.role === "ADMIN" ? await countPendingOrders() : 0;

  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <SettingsProvider value={settings}>
          <CartProvider>
            <SiteHeader user={user} categories={categories} pendingOrders={pendingOrders} />
            <PromoBanner />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <FestiveSnow />
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
