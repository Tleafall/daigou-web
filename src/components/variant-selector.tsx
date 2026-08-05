"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product, Variant } from "@/lib/mock-data";
import { formatTWD } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

const MAX_QTY = 10; // 單一商品購買上限（見 PLAN.md）

export function VariantSelector({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const hasOptions = product.optionGroups.length > 0;
  const allSelected = product.optionGroups.every((g) => selected[g.name]);

  const matched: Variant | undefined = useMemo(() => {
    if (!hasOptions) return product.variants[0];
    if (!allSelected) return undefined;
    return product.variants.find((v) =>
      product.optionGroups.every((g) => v.options[g.name] === selected[g.name]),
    );
  }, [product, selected, allSelected, hasOptions]);

  // 某個選項值在目前其他選擇下，是否還有有貨的組合
  function isAvailable(groupName: string, value: string): boolean {
    return product.variants.some((v) => {
      if (v.options[groupName] !== value) return false;
      if (v.stock <= 0) return false;
      return product.optionGroups.every(
        (g) =>
          g.name === groupName ||
          !selected[g.name] ||
          v.options[g.name] === selected[g.name],
      );
    });
  }

  const priceRange = useMemo(() => {
    const prices = product.variants.map((v) => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [product]);

  const maxQty = Math.min(MAX_QTY, matched?.stock ?? MAX_QTY);
  const canAdd = !!matched && matched.stock > 0;

  function pick(groupName: string, value: string) {
    setSelected((prev) => ({ ...prev, [groupName]: value }));
    setQty(1);
  }

  function addToCart() {
    if (!matched) return;
    const optionLabel = hasOptions
      ? Object.entries(selected)
          .map(([k, v]) => `${k}：${v}`)
          .join("、")
      : "";
    addItem(
      {
        productSlug: product.slug,
        productTitle: product.title,
        variantId: matched.id,
        optionLabel,
        unitPrice: matched.price,
        gradient: product.gradient,
      },
      qty,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 3000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 價格 */}
      <div className="text-2xl font-bold text-brand">
        {matched
          ? formatTWD(matched.price)
          : priceRange.min === priceRange.max
            ? formatTWD(priceRange.min)
            : `${formatTWD(priceRange.min)} ~ ${formatTWD(priceRange.max)}`}
      </div>

      {/* 規格選擇 */}
      {product.optionGroups.map((g) => (
        <div key={g.name}>
          <div className="mb-2 text-sm font-medium text-ink/70">{g.name}</div>
          <div className="flex flex-wrap gap-2">
            {g.values.map((value) => {
              const active = selected[g.name] === value;
              const available = isAvailable(g.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => pick(g.name, value)}
                  disabled={!available && !active}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-brand bg-brand-50 text-brand"
                      : available
                        ? "border-line text-ink/80 hover:border-brand"
                        : "cursor-not-allowed border-line text-ink/30 line-through"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 庫存提示 */}
      {matched && (
        <div className="text-sm text-ink/50">
          {matched.stock > 0 ? `庫存 ${matched.stock} 件` : "此規格已售罄"}
        </div>
      )}
      {hasOptions && !allSelected && (
        <div className="text-sm text-ink/50">請選擇完整規格</div>
      )}

      {/* 數量 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink/70">數量</span>
        <div className="flex items-center rounded-lg border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="px-3 py-1.5 text-lg text-ink/60 disabled:text-ink/20"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            className="px-3 py-1.5 text-lg text-ink/60 disabled:text-ink/20"
          >
            ＋
          </button>
        </div>
      </div>

      {/* 加入購物車 */}
      <button
        type="button"
        onClick={addToCart}
        disabled={!canAdd}
        className="w-full rounded-full bg-brand py-3 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-ink/20 sm:w-auto sm:px-10"
      >
        {canAdd ? "加入購物車" : hasOptions && !allSelected ? "請先選擇規格" : "已售罄"}
      </button>

      {added && (
        <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand">
          ✓ 已加入購物車
          <Link href="/cart" className="font-medium underline">
            查看購物車
          </Link>
        </div>
      )}
    </div>
  );
}
