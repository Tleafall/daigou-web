import Link from "next/link";
import { categories } from "@/lib/mock-data";

// 桌機：水平分類列（蝦皮式頁籤）
export function CategoryBar() {
  return (
    <nav className="hidden border-t border-line bg-white md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="whitespace-nowrap px-3 py-2.5 text-sm text-ink/80 transition-colors hover:text-brand"
          >
            <span className="mr-1">{c.emoji}</span>
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// 手機抽屜：垂直分類清單
export function CategoryList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          onClick={onNavigate}
          className="flex items-center gap-3 border-b border-line px-4 py-3 text-ink/90 hover:bg-muted"
        >
          <span className="text-lg">{c.emoji}</span>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
