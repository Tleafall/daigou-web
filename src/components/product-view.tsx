"use client";

import { useState } from "react";
import type { Product } from "@/lib/mock-data";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";

export function ProductView({
  product,
  showSold,
  soldCount,
}: {
  product: Product;
  showSold?: boolean;
  soldCount?: number;
}) {
  const [activeImage, setActiveImage] = useState(0);

  // 選到某規格值時，若有圖片標記為該值，就跳到那張
  function handleOptionSelect(value: string) {
    const idx = product.images.findIndex((im) => im.tag && im.tag === value);
    if (idx >= 0) setActiveImage(idx);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery
        images={product.images}
        gradient={product.gradient}
        title={product.title}
        activeIndex={activeImage}
        onSelect={setActiveImage}
      />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{product.title}</h1>
          {showSold && (
            <div className="mt-1 text-sm text-ink/40">已售 {soldCount}</div>
          )}
        </div>
        <VariantSelector product={product} onOptionSelect={handleOptionSelect} />
      </div>
    </div>
  );
}
