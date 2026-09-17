// 運費計算（前台購物車、結帳、後端下單都用這個，確保一致）。
//
// 規則：
//  - 購物車為空：運費 0。
//  - 「滿額免運門檻」> 0 且小計已達標：免運（0）。
//  - 「滿額免運門檻」設為 0（或以下）：代表「沒有滿額免運」，一律收運費。
//  - 想「一律免運」：把「運費」設為 0 即可。

export type ShippingOpts = { freeShippingThreshold: number; shippingFee: number };

export function shippingFeeFor(subtotal: number, opts: ShippingOpts): number {
  if (subtotal <= 0) return 0;
  if (opts.freeShippingThreshold > 0 && subtotal >= opts.freeShippingThreshold) return 0;
  return Math.max(0, opts.shippingFee);
}

// 是否有「滿額免運」活動（門檻 > 0 才算）
export function hasFreeShippingPromo(opts: ShippingOpts): boolean {
  return opts.freeShippingThreshold > 0 && opts.shippingFee > 0;
}
