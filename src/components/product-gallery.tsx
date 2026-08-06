"use client";

import type { ProductImage } from "@/lib/mock-data";

export function ProductGallery({
  images,
  gradient,
  title,
  activeIndex,
  onSelect,
}: {
  images: ProductImage[];
  gradient: [string, string];
  title: string;
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const bg = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;

  // 無上傳圖：顯示漸層佔位 + 幾個漸層縮圖
  if (images.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="aspect-square w-full rounded-2xl" style={{ background: bg }} />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-line"
              style={{ background: `linear-gradient(${135 + i * 30}deg, ${gradient[0]}, ${gradient[1]})` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const active = Math.min(activeIndex, images.length - 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden rounded-2xl" style={{ background: bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].url} alt={title} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={`aspect-square overflow-hidden rounded-lg ring-2 ${
                i === active ? "ring-brand" : "ring-transparent hover:ring-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
