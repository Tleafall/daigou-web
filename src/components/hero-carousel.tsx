"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings-context";
import { IconChevronRight } from "./icons";

export function HeroCarousel() {
  const site = useSettings();
  const [index, setIndex] = useState(0);

  const slides = [
    {
      title: "海外好物，替你嚴選",
      desc: `${site.tagline}。安心下單，7-11 門市取貨付款。`,
      cta: "開始選購",
      href: "/category/beauty",
      gradient: "linear-gradient(120deg, #f7e8ec, #e7cdd6)",
    },
    {
      title: `滿 NT$${site.freeShippingThreshold.toLocaleString("zh-TW")} 免運`,
      desc: "湊單更划算，寄到 7-11 門市，取貨再付款。",
      cta: "看熱門商品",
      href: "/category/fashion",
      gradient: "linear-gradient(120deg, #efe9f0, #d8ccd9)",
    },
    {
      title: "日韓美妝・生活雜貨",
      desc: "人氣品項持續更新，喜歡的別錯過。",
      cta: "逛美妝保養",
      href: "/category/beauty",
      gradient: "linear-gradient(120deg, #f8efec, #e8d5d5)",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-6 py-12 transition-[background] duration-700 sm:px-12 sm:py-16"
      style={{ background: slide.gradient }}
    >
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{slide.title}</h1>
        <p className="mt-3 text-ink/70">{slide.desc}</p>
        <Link
          href={slide.href}
          className="mt-6 inline-flex items-center gap-1 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {slide.cta} <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 指示點 */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`切換到第 ${i + 1} 張`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-5 bg-brand" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
