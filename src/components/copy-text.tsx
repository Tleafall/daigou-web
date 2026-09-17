"use client";

// 點擊複製：後台取貨資料等可一鍵複製，貼到賣貨便後台不用手打。
import { useState } from "react";

export function CopyText({
  value,
  children,
  className = "",
}: {
  value: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // 後備做法：用隱藏 textarea + execCommand
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="點擊複製"
      className={`group inline-flex items-center gap-1 text-left hover:text-brand ${className}`}
    >
      {children ?? value}
      <span
        className={`text-[11px] ${copied ? "text-green-600" : "text-ink/30 group-hover:text-brand"}`}
      >
        {copied ? "✓已複製" : "⧉"}
      </span>
    </button>
  );
}
