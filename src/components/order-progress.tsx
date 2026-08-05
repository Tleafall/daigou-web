import type { OrderStatus } from "@/lib/store";

const steps: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "待確認" },
  { key: "CONFIRMED", label: "已確認" },
  { key: "SHIPPED", label: "已出貨" },
  { key: "COMPLETED", label: "已完成" },
];

export function OrderProgress({
  status,
  abandoned,
}: {
  status: OrderStatus;
  abandoned?: boolean;
}) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg bg-zinc-100 px-4 py-3 text-center text-sm font-medium text-ink/60">
        此訂單已取消{abandoned ? "（棄單／拒收）" : ""}
      </div>
    );
  }

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  done ? "bg-brand text-white" : "bg-line text-ink/40"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 whitespace-nowrap text-xs ${
                  done ? "font-medium text-brand" : "text-ink/40"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 ${
                  i < currentIndex ? "bg-brand" : "bg-line"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
