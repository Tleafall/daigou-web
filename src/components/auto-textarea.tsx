"use client";

// 會自動長高的文字框：內容多長就長多高，不用捲動即可一次看完全部。
import { useEffect, useRef } from "react";

export function AutoTextarea(
  props: React.ComponentProps<"textarea">,
) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  // 初次載入（含帶入既有敘述時）先量一次高度
  useEffect(() => {
    resize();
  }, []);

  return (
    <textarea
      ref={ref}
      onInput={resize}
      {...props}
      style={{ overflow: "hidden", resize: "vertical", ...props.style }}
    />
  );
}
