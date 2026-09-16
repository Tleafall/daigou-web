"use client";

import { useState } from "react";
import type { Product } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-context";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";
import { LineContact } from "./line-contact";

export function ProductView({
  product,
  countLabel,
}: {
  product: Product;
  countLabel?: string | null;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const settings = useSettings();

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
          {countLabel && (
            <div className="mt-1 text-sm text-ink/40">{countLabel}</div>
          )}
        </div>
        <VariantSelector product={product} onOptionSelect={handleOptionSelect} />

        <LineContact
          lineUrl={settings.lineUrl}
          lineId={settings.lineId}
          label="用 LINE 詢問此商品"
          message={`您好，我想詢問這個商品：${product.title}（商品編號 ${product.slug}）`}
        />
      </div>
    </div>
  );
}
