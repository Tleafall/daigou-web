import Link from "next/link";
import { getSettings } from "@/lib/settings-store";

export async function SiteFooter() {
  const site = await getSettings();
  return (
    <footer className="mt-16 border-t border-line bg-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="text-lg font-bold text-brand">{site.name}</div>
          <p className="mt-2 text-sm text-ink/60">{site.tagline}</p>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold">關於我們</div>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/about" className="hover:text-brand">品牌介紹</Link></li>
            <li><span className="text-ink/40">服務條款（即將推出）</span></li>
            <li><span className="text-ink/40">隱私權政策（即將推出）</span></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold">購物須知</div>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><span className="text-ink/40">付款與配送（即將推出）</span></li>
            <li><span className="text-ink/40">退換貨政策（即將推出）</span></li>
            <li><span className="text-ink/40">常見問題（即將推出）</span></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold">聯絡我們</div>
          <ul className="space-y-2 text-sm text-ink/60">
            <li>
              LINE：
              {site.lineUrl && /^https?:\/\//i.test(site.lineUrl) ? (
                <a
                  href={site.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand hover:underline"
                >
                  點我加入 {site.lineId}
                </a>
              ) : (
                site.lineId
              )}
            </li>
            <li>Email：{site.email}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} {site.name}. 本網站為代購示範站。
      </div>
    </footer>
  );
}
