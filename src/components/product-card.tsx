import Link from "next/link";
import type { Product } from "@/lib/mock-data";
import { formatTWD } from "@/lib/format";
import { getSettings } from "@/lib/settings-store";
import { soldCountForProduct } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  const hasOptions = product.optionGroups.length > 0;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const showSold = getSettings().showSoldCount;
  const sold = showSold ? soldCountForProduct(product.slug) : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md"
    >
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.gradient[0]}, ${product.gradient[1]})`,
        }}
      >
        {product.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        )}
        {totalStock === 0 && (
          <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            售罄
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm text-ink/90 group-hover:text-brand">
          {product.title}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-base font-bold text-brand">
            {formatTWD(product.price)}
            {hasOptions && <span className="ml-1 text-xs font-normal text-ink/40">起</span>}
          </span>
          {showSold && <span className="text-xs text-ink/40">已售 {sold}</span>}
        </div>
      </div>
    </Link>
  );
}
