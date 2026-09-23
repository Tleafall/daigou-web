"use client";

// 表單送出按鈕：送出中會自動顯示「處理中…」並鎖住，避免重複點擊造成建立多筆。
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "處理中…",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
