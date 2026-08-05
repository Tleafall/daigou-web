"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { IconChevronRight } from "./icons";

type Slide = {
  title: string;
  desc: string;
  cta: string;
  href: string;
  gradient: string;
};

const slides: Slide[] = [
  {
    title: "海外好物，替你嚴選",
    desc: `${site.tagline}。安心下單，支援貨到付款。`,
    cta: "開始選購",
    href: "/category/beauty",
    gradient: "linear-gradient(120deg, #ffe3d7, #ffc3ac)",
  },
  {
    title: `滿 NT$${site.freeShippingThreshold.toLocaleString("zh-TW")} 免運`,
    desc: "湊單更划算，宅配到府，貨到付款免先付。",
    cta: "看熱門商品",
    href: "/category/fashion",
    gradient: "linear-gradient(120deg, #dbe4ff, #b7c6ff)",
  },
  {
    title: "日韓美妝・生活雜貨",
    desc: "人氣品項持續更新，喜歡的別錯過。",
    cta: "逛美妝保養",
    href: "/category/beauty",
    gradient: "linear-gradient(120deg, #ffe0ec, #ffc2d6)",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

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
