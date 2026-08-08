"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatTWD } from "@/lib/format";
import { useSettings } from "@/lib/settings-context";
import { EmptyState } from "@/components/empty-state";

export default function CartPage() {
  const { items, subtotal, ready, setQty, removeItem } = useCart();
  const site = useSettings();

  const shippingFee =
    subtotal >= site.freeShippingThreshold || subtotal === 0 ? 0 : site.shippingFee;
  const total = subtotal + shippingFee;

  if (ready && items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">購物車</h1>
        <EmptyState emoji="🛒" title="購物車還是空的" subtitle="挑幾樣喜歡的加進來吧">
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            去逛逛
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">購物車</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 品項 */}
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <div
              key={it.key}
              className="flex gap-3 rounded-xl border border-line bg-white p-3"
            >
              <Link
                href={`/products/${it.productSlug}`}
                className="h-20 w-20 shrink-0 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${it.gradient[0]}, ${it.gradient[1]})`,
                }}
              />
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${it.productSlug}`}
                  className="line-clamp-2 text-sm font-medium hover:text-brand"
                >
                  {it.productTitle}
                </Link>
                {it.optionLabel && (
                  <div className="mt-0.5 text-xs text-ink/50">{it.optionLabel}</div>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      onClick={() => setQty(it.key, it.quantity - 1)}
                      disabled={it.quantity <= 1}
                      className="px-2.5 py-1 text-ink/60 disabled:text-ink/20"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button
                      onClick={() => setQty(it.key, it.quantity + 1)}
                      disabled={it.quantity >= 10}
                      className="px-2.5 py-1 text-ink/60 disabled:text-ink/20"
                    >
                      ＋
                    </button>
                  </div>
                  <span className="font-bold text-brand">
                    {formatTWD(it.unitPrice * it.quantity)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeItem(it.key)}
                className="self-start text-xs text-ink/40 hover:text-red-500"
              >
                移除
              </button>
            </div>
          ))}
        </div>

        {/* 結帳摘要 */}
        <div className="h-fit rounded-xl border border-line bg-white p-5 lg:sticky lg:top-28">
          <h2 className="mb-4 font-bold">訂單摘要</h2>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-ink/60">商品小計</span>
            <span>{formatTWD(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-ink/60">運費</span>
            <span>{shippingFee === 0 ? "免運" : formatTWD(shippingFee)}</span>
          </div>
          {subtotal > 0 && subtotal < site.freeShippingThreshold && (
            <p className="mt-1 text-xs text-brand">
              再買 {formatTWD(site.freeShippingThreshold - subtotal)} 即可免運
            </p>
          )}
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
            <span>合計</span>
            <span className="text-brand">{formatTWD(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-5 block rounded-full bg-brand py-3 text-center font-medium text-white transition-colors hover:bg-brand-600"
          >
            前往結帳
          </Link>
          <p className="mt-2 text-center text-xs text-ink/40">付款方式：貨到付款</p>
        </div>
      </div>
    </div>
  );
}
