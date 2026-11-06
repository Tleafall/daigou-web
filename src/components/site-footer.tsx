import Link from "next/link";
import { getSettings } from "@/lib/settings-store";

export async function SiteFooter() {
  const site = await getSettings();
  return (
    <footer className="mt-16 border-t border-line bg-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="text-lg font-bold text-brand">{site.name}</div>
          {site.tagline && <p className="mt-2 text-sm text-ink/60">{site.tagline}</p>}
        </div>

        {/* 「品牌介紹」暫時隱藏（連 /about 頁）。要恢復：把這段取消註解即可。
        <div>
          <div className="mb-3 text-sm font-semibold">關於我們</div>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/about" className="hover:text-brand">品牌介紹</Link></li>
          </ul>
        </div>
        */}

        <div>
          <div className="mb-3 text-sm font-semibold">顧客服務</div>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/returns" className="hover:text-brand">退換貨說明</Link></li>
            <li><Link href="/terms" className="hover:text-brand">服務條款</Link></li>
            <li><Link href="/privacy" className="hover:text-brand">隱私權政策</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold">聯絡我們</div>
          <ul className="space-y-2 text-sm text-ink/60">
            {site.lineId && (
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
            )}
            {site.email && <li>Email：{site.email}</li>}
          </ul>
        </div>

        {/* 官網 QR code：電腦上逛的客人用手機一掃就能繼續看；點圖可下載分享 */}
        <div>
          <div className="mb-3 text-sm font-semibold">手機掃描逛官網</div>
          <a href="/qrcode.png" download={`${site.name}-QRcode.png`} title="點擊下載 QR code">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qrcode.svg"
              alt={`${site.name}官網 QR code`}
              width={112}
              height={112}
              className="h-28 w-28 rounded-lg border border-line bg-white p-1.5"
            />
          </a>
          <p className="mt-2 text-xs text-ink/40">點圖可下載，分享給朋友</p>
        </div>
      </div>

      <div className="border-t border-line py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} {site.name}. 版權所有。
      </div>
    </footer>
  );
}
