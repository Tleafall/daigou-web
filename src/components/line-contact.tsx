// 官方 LINE 加入好友按鈕 / ID（純顯示元件，前後台皆可用）
export function LineContact({
  lineUrl,
  lineId,
  label = "加 LINE 詢問",
}: {
  lineUrl: string;
  lineId: string;
  label?: string;
}) {
  const href = lineUrl && /^https?:\/\//i.test(lineUrl) ? lineUrl : null;

  if (!href) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-ink/60">
        <span className="grid h-5 w-5 place-items-center rounded bg-[#06C755] text-[11px] font-bold text-white">
          L
        </span>
        LINE 搜尋 <b className="text-ink/80">{lineId}</b> 加入詢問
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "#06C755" }}
    >
      <span className="grid h-5 w-5 place-items-center rounded bg-white text-[11px] font-bold text-[#06C755]">
        L
      </span>
      {label}
    </a>
  );
}
