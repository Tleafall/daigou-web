import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings-store";
import { updateSettingsAction } from "@/lib/settings-actions";

export const metadata: Metadata = { title: "網站設定" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const s = getSettings();
  const { saved } = await searchParams;

  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/admin" className="hover:text-brand">後台</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">網站設定</span>
      </nav>
      <h1 className="mb-1 text-xl font-bold">網站設定</h1>
      <p className="mb-6 text-sm text-ink/50">改這裡的內容，全站文字會立即更新，不用改程式。</p>

      {saved && (
        <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          ✓ 已儲存
        </div>
      )}

      <form action={updateSettingsAction} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">店名</span>
          <input name="name" defaultValue={s.name} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">標語（首頁/頁尾顯示）</span>
          <input name="tagline" defaultValue={s.tagline} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">最上方跑馬燈文字</span>
          <input name="announcement" defaultValue={s.announcement} className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">滿額免運門檻（NT$）</span>
            <input name="freeShippingThreshold" type="number" min="0" defaultValue={s.freeShippingThreshold} className={inputClass} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">宅配運費（NT$）</span>
            <input name="shippingFee" type="number" min="0" defaultValue={s.shippingFee} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">LINE 帳號</span>
            <input name="lineId" defaultValue={s.lineId} className={inputClass} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">客服 Email</span>
            <input name="email" defaultValue={s.email} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">商品旁顯示數量</span>
            <select name="productCountDisplay" defaultValue={s.productCountDisplay} className={inputClass}>
              <option value="none">不顯示</option>
              <option value="sold">顯示已售數（例：已售 12）</option>
              <option value="stock">顯示剩餘數（例：僅剩 3 件）</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">剩餘幾件以下才顯示</span>
            <input
              name="lowStockThreshold"
              type="number"
              min="1"
              defaultValue={s.lowStockThreshold}
              className={inputClass}
            />
          </label>
        </div>
        <p className="-mt-2 text-xs text-ink/40">
          「顯示剩餘數」時，只有庫存 ≤ 上面的數字才會顯示「僅剩 N 件」，避免庫存很多時反而沒急迫感。
        </p>

        {/* 客服自動回覆 */}
        <div className="rounded-lg border border-line p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="botEnabled"
              defaultChecked={s.botEnabled}
              className="h-4 w-4"
            />
            啟用客服自動回覆（客人第一次來訊時，先自動回一則）
          </label>
          <textarea
            name="botMessage"
            defaultValue={s.botMessage}
            className="mt-2 min-h-20 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="自動回覆的文字…"
          />
          <p className="mt-1 text-xs text-ink/40">
            例：「您好，感謝來訊！賣家看到後會盡快回覆您 😊」
          </p>
        </div>

        <button className="self-start rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          儲存設定
        </button>
      </form>

      <p className="mt-4 text-xs text-ink/40">
        （原型階段：設定存在記憶體，重開伺服器會回到預設；接資料庫後就會永久保存。）
      </p>
    </div>
  );
}
