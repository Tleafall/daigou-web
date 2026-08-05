"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/lib/cart-context";
import { formatTWD } from "@/lib/format";
import { site } from "@/lib/site";
import { createOrderAction } from "@/lib/order-actions";

export function CheckoutForm({ defaultName }: { defaultName: string }) {
  const { items, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    recipientName: defaultName,
    recipientPhone: "",
    city: "",
    district: "",
    addressLine: "",
    customerNote: "",
  });

  const shippingFee =
    subtotal >= site.freeShippingThreshold || subtotal === 0 ? 0 : site.shippingFee;
  const total = subtotal + shippingFee;

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOrderAction({
        items: items.map((i) => ({
          productSlug: i.productSlug,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        ...form,
      });
      if (result.ok) {
        clear();
        router.push(`/account/orders/${result.orderNo}`);
      } else {
        setError(result.error);
      }
    });
  }

  if (ready && items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-ink/60">購物車是空的，無法結帳。</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm text-white"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">結帳</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 收件資料 */}
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">收件資料</h2>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">收件人姓名 *</span>
              <input
                className={inputClass}
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">手機號碼 *</span>
              <input
                className={inputClass}
                value={form.recipientPhone}
                onChange={(e) => update("recipientPhone", e.target.value)}
                placeholder="0912345678"
                inputMode="numeric"
                required
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">縣市 *</span>
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="台北市"
                required
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink/70">鄉鎮市區 *</span>
              <input
                className={inputClass}
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="大安區"
                required
              />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">詳細地址 *</span>
            <input
              className={inputClass}
              value={form.addressLine}
              onChange={(e) => update("addressLine", e.target.value)}
              placeholder="復興南路一段 100 號 5 樓"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">訂單備註（選填）</span>
            <textarea
              className={`${inputClass} min-h-20`}
              value={form.customerNote}
              onChange={(e) => update("customerNote", e.target.value)}
            />
          </label>

          <div className="rounded-lg bg-muted px-4 py-3 text-sm">
            <div className="font-medium">付款方式</div>
            <div className="mt-1 text-ink/60">貨到付款（宅配收到商品時付款）</div>
          </div>
        </div>

        {/* 摘要 */}
        <div className="h-fit rounded-xl border border-line bg-white p-5">
          <h2 className="mb-4 font-bold">訂單摘要</h2>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {items.map((it) => (
              <div key={it.key} className="flex justify-between gap-2 text-sm">
                <span className="text-ink/70">
                  {it.productTitle}
                  <span className="text-ink/40"> ×{it.quantity}</span>
                </span>
                <span>{formatTWD(it.unitPrice * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
            <span className="text-ink/60">小計</span>
            <span>{formatTWD(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">運費</span>
            <span>{shippingFee === 0 ? "免運" : formatTWD(shippingFee)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold">
            <span>應付金額</span>
            <span className="text-brand">{formatTWD(total)}</span>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-5 block w-full rounded-full bg-brand py-3 text-center font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? "送出中…" : "確認下單"}
          </button>
        </div>
      </form>
    </div>
  );
}
