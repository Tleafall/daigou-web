import Link from "next/link";
import type { ChatProduct } from "@/lib/chat-store";
import { formatTWD } from "@/lib/format";

export function ChatProductCard({ product }: { product: ChatProduct }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-2 rounded-lg border border-line bg-white p-2"
    >
      <div
        className="h-10 w-10 shrink-0 overflow-hidden rounded"
        style={{ background: `linear-gradient(135deg, ${product.gradient[0]}, ${product.gradient[1]})` }}
      >
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs text-ink/80">{product.title}</div>
        <div className="text-xs font-bold text-brand">{formatTWD(product.price)}</div>
      </div>
    </Link>
  );
}
