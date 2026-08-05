import type { Metadata } from "next";
import Link from "next/link";
import { IconCart } from "@/components/icons";

export const metadata: Metadata = { title: "購物車" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">購物車</h1>

      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line py-20 text-center">
        <IconCart className="h-12 w-12 text-ink/20" />
        <p className="mt-4 text-ink/60">購物車還是空的</p>
        <p className="mt-1 text-xs text-ink/40">
          🔧 骨架階段：購物車與結帳會在接上資料庫後開通
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          去逛逛
        </Link>
      </div>
    </div>
  );
}
