"use client";

// 聖誕節雪花：12/1～12/26（台灣時間）自動出現，其他時間不顯示。
// 預覽：網址加 ?festive=xmas；關閉：?festive=off。
// 純 CSS 動畫、不擋點擊、不影響版面；系統設定「減少動態效果」的人不顯示。
import { useEffect, useState } from "react";

function inXmasSeason(): boolean {
  const tw = new Date(Date.now() + 8 * 3600_000); // 換算台灣時間
  const m = tw.getUTCMonth() + 1;
  const d = tw.getUTCDate();
  return m === 12 && d <= 26;
}

type Flake = { left: number; size: number; duration: number; delay: number; drift: number; opacity: number };

export function FestiveSnow() {
  const [flakes, setFlakes] = useState<Flake[]>([]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("festive");
    const on = p === "xmas" || (p !== "off" && inXmasSeason());
    if (!on) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const count = window.innerWidth < 640 ? 18 : 32; // 手機少一點，不搶畫面
    const list = Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      size: 4 + Math.random() * 6,
      duration: 9 + Math.random() * 10,
      delay: -Math.random() * 18,
      drift: (Math.random() - 0.5) * 80,
      opacity: 0.5 + Math.random() * 0.4,
    }));
    const t = window.setTimeout(() => setFlakes(list), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (flakes.length === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="festive-flake"
          style={
            {
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
