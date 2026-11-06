import Link from "next/link";

// 隱私權政策／服務條款／退換貨說明共用的版面
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{title}</span>
      </nav>
      <h1 className="mb-1 text-2xl font-bold">{title}</h1>
      <p className="mb-8 text-sm text-ink/40">最後更新：{updated}</p>
      <div className="space-y-6 text-[15px] leading-7 text-ink/80 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
      <div className="mt-10 flex flex-wrap gap-4 border-t border-line pt-4 text-sm text-ink/50">
        <Link href="/privacy" className="hover:text-brand">隱私權政策</Link>
        <Link href="/terms" className="hover:text-brand">服務條款</Link>
        <Link href="/returns" className="hover:text-brand">退換貨說明</Link>
      </div>
    </div>
  );
}

// 客服聯絡方式（依後台設定，空的就不顯示）
export function ContactLines({
  email,
  lineId,
  lineUrl,
}: {
  email: string;
  lineId: string;
  lineUrl: string;
}) {
  return (
    <ul>
      {lineId && (
        <li>
          官方 LINE：
          {lineUrl ? (
            <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              {lineId}
            </a>
          ) : (
            lineId
          )}
        </li>
      )}
      {email && <li>Email：{email}</li>}
    </ul>
  );
}
