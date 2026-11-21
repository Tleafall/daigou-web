import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings-store";

export const metadata: Metadata = {
  title: "關於我們",
  description: "認識闆娘：多年美妝代購經驗，親自挑選國內外好用的美妝保養品，現貨供應、7-11 取貨付款。",
};

// 闆娘自介頁。文字依闆娘提供的自述整理；照片與影片放在 public/about/。
export default async function AboutPage() {
  const s = await getSettings();
  const hasLine = s.lineUrl && /^https?:\/\//i.test(s.lineUrl);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 text-sm text-ink/50">
        <Link href="/" className="hover:text-brand">首頁</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">關於我們</span>
      </nav>

      {/* 闆娘自介 */}
      <section className="grid items-center gap-8 md:grid-cols-[2fr_3fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/about/owner.jpg"
          alt={`${s.name}闆娘`}
          width={901}
          height={1200}
          className="mx-auto w-full max-w-sm rounded-2xl object-cover shadow-sm"
        />
        <div>
          <p className="text-sm font-medium text-brand">闆娘自介</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">嗨，我是{s.name}的闆娘</h1>
          <div className="mt-5 space-y-4 text-[15px] leading-8 text-ink/80 sm:text-base">
            <p>常有人問我：「你的工作是什麼？」其實還真的不太好介紹。</p>
            <p>
              早期我們這行被稱為「阿水」，現在大家叫「代購」。簡單說，就是替大家挑選國內外真正好用的美妝保養品，引進或推薦給你。
            </p>
            <p>
              我的美好青春年華，幾乎都奉獻在這一行了。目前還沒有研發自己的美妝品牌，但我一直希望，有一天能做出屬於自己的品牌。
            </p>
            <p>在那之前，我會繼續用自己的眼光和經驗，替你把關每一件商品。</p>
          </div>
        </div>
      </section>

      {/* 承諾 */}
      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "📦", title: "現貨供應", desc: "官網商品都是現貨，下單後盡快為你出貨。" },
          { icon: "💵", title: "取貨才付款", desc: "寄到你指定的 7-11 門市，到店取貨再付款，安心沒負擔。" },
          { icon: "🤍", title: "闆娘親自把關", desc: "每一件商品都經過闆娘挑選，有問題隨時找得到人。" },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-line bg-white p-5">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 font-bold">{c.title}</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">{c.desc}</p>
          </div>
        ))}
      </section>

      {/* 現貨實拍 */}
      <section className="mt-12">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded-full bg-brand" />
          現貨實拍
        </h2>
        <p className="mb-4 text-sm text-ink/50">倉庫裡的商品，都是真的在這裡等你帶回家。</p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-xl">
          {["stock-1", "stock-2"].map((v) => (
            <video
              key={v}
              src={`/about/${v}.mp4`}
              poster={`/about/${v}.jpg`}
              controls
              muted
              playsInline
              preload="none"
              className="aspect-[9/16] w-full rounded-xl bg-muted object-cover"
            />
          ))}
        </div>
      </section>

      {/* 生活照 */}
      <section className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-muted p-6 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/about/cat.jpg"
          alt="闆娘的療癒時光"
          width={900}
          height={1200}
          loading="lazy"
          className="h-40 w-32 shrink-0 rounded-xl object-cover"
        />
        <p className="text-[15px] leading-7 text-ink/70">
          工作之餘，闆娘也是愛毛孩的人。謝謝每一位支持我們的你，讓這份熱愛可以一直走下去。
        </p>
      </section>

      {/* 行動按鈕 */}
      <section className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/products"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          逛逛所有商品
        </Link>
        {hasLine && (
          <a
            href={s.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand px-6 py-2.5 text-sm font-medium text-brand hover:bg-brand hover:text-white"
          >
            加 LINE 問闆娘
          </a>
        )}
      </section>
    </div>
  );
}
