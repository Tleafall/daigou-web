import { getSettings } from "@/lib/settings-store";

// 促銷活動橫幅：全站最上方顯示。
// 只在「活動開啟 + 還有剩餘名額」時出現，名額歸零自動收起。
export async function PromoBanner() {
  const s = await getSettings();
  if (!s.promoEnabled || s.promoRemaining <= 0 || !s.promoText.trim()) return null;

  return (
    <div className="bg-amber-400 text-center text-sm font-medium text-amber-950">
      <div className="mx-auto max-w-6xl px-4 py-2">
        {s.promoText.trim()}
        <span className="ml-1 font-bold">・僅剩 {s.promoRemaining} 名</span>
      </div>
    </div>
  );
}
