export function EmptyState({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white py-16 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-4xl">
        {emoji}
      </div>
      <p className="mt-4 font-medium text-ink/70">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink/40">{subtitle}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
