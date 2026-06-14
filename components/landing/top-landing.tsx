"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { LogoAnimation } from "@/components/ui/logo-animation";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const GRID_BG = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
  backgroundSize: "48px 48px",
};

const values = [
  {
    eyebrow: "毎月つづく応援",
    title: "ファンや常連さんが、\n続ける力になる。",
    body: "応援会員は月300円から（もっと応援したい人は1,000円も）。売上の波に左右されない、毎月つづく支えになります。",
  },
  {
    eyebrow: "入会はその場で",
    title: "POPを置くだけで、\nその場で入会。",
    body: "POPを自動生成。レジ横や受付・会場に置けば、スマホで読み取ってその場で応援会員になれます。",
  },
  {
    eyebrow: "会員証が誇りに",
    title: "番号入りの会員証が、\n応援の証になる。",
    body: "応援会員には通し番号と加入月入りのデジタル会員証。早く入った人ほど若い番号。場所との関係がかたちになります。",
  },
];

const steps = [
  {
    title: "SPOTを登録する",
    body: "場所の紹介とカバー画像を登録して、あなたの場所のページを公開します。",
  },
  {
    title: "受取設定を行う",
    body: "受取口座の設定です。完了後、応援会員の募集を本番公開できます。",
  },
  {
    title: "POPを目立つ場所に置く",
    body: "自動生成されたPOPを印刷して、レジ横や受付・会場へ。一言添えれば、そこから始まります。",
  },
];

const comparison = [
  { axis: "かたち", cf: "一度きりの支援", spot: "毎月つづく会員制" },
  { axis: "目的", cf: "目標額を集める", spot: "場所や活動を続けること" },
  { axis: "終わり方", cf: "達成したら終了", spot: "ずっと続いていく" },
  { axis: "関係", cf: "支援したら終わり", spot: "会員証を持って通い続ける" },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "利用料金はかかりますか？",
    a: (
      <span>
        SPOTの登録・公開は無料です。応援会員から会費を受け取った場合のみ、
        <ul className="mt-2 space-y-1 pl-1">
          <li>・Stripe 決済手数料　3.6%</li>
          <li>・SPOT 利用料　決済手数料控除後の<strong className="text-ink/80">純額の 10%</strong></li>
        </ul>
        <span className="mt-2 block">が発生します。それ以外の固定費や月額費用はありません。</span>
      </span>
    ),
  },
  {
    q: "どんな場所・活動で使えますか？",
    a: "本屋・書店、ミニシアター、ライブハウス、劇場、ギャラリー、神社・寺院、文化プロジェクトなど、「続いてほしい」と思われている街の文化拠点のための仕組みです。個人経営でも法人でも団体でも利用できます。",
  },
  {
    q: "応援会員の月額金額は？",
    a: "月300円と1,000円の2つです（ベータ版）。1,000円はもっと応援したい人のための選択肢で、どちらも特典なし・会員の権利は同じです。気軽に応援でき、運営側も返礼を気にせず受け取れる金額として設定しています。",
  },
  {
    q: "応援会員は何ができますか？",
    a: "番号入りのデジタル会員証を持ち、限定投稿を受け取れます。何より「この場所を支えている」という関係そのものが価値です。",
  },
  {
    q: "会員はいつでも解約できますか？",
    a: "はい。応援会員はいつでも解約できます。期間の縛りや違約金はありません。",
  },
];

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink/8 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-ink">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink/58 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-5 text-[15px] leading-relaxed text-ink/75">{a}</div>
      )}
    </div>
  );
}

export function TopLanding() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const valuesHeadRef = useScrollReveal<HTMLDivElement>();
  const valuesRef     = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 100 });
  const whyHeadRef    = useScrollReveal<HTMLDivElement>();
  const whyRef        = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 100 });
  const stepsHeadRef  = useScrollReveal<HTMLDivElement>();
  const stepsRef      = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 100 });
  const pricingRef    = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const bottomCtaRef  = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div className="pb-20">

      {/* ── Hero ── */}
      <div ref={heroRef} className="relative overflow-hidden bg-ink px-6 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="pointer-events-none absolute inset-0" style={GRID_BG} />

        {/* 背景：ロゴアニメーション（モバイルのみ・薄く重ねる） */}
        <div className="pointer-events-none absolute -right-16 -top-8 lg:hidden"
          style={{ animation: "hero-fade-up 1s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}>
          <LogoAnimation className="h-[320px] w-[320px] opacity-20" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">

            {/* 左：コピー */}
            <div>
              <div className="hero-animate-1 relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2">
                <span className="hero-pulse relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-moss opacity-75" style={{animation:"ping 1.5s cubic-bezier(0,0,0.2,1) infinite"}} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-moss" />
                </span>
                <span className="text-sm font-semibold text-white/80">街の小さな文化拠点のための、応援会員制度</span>
              </div>
              <h1 className="hero-animate-2 mt-5 text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight">
                <span className="block text-white/90">あなたの場所に、</span>
                <span className="hero-gradient-text block">応援会員を。</span>
              </h1>
              <p className="hero-animate-3 mt-6 max-w-lg text-[15px] leading-relaxed text-white/78 sm:text-base">
                ファンや常連さんが月300円から、続ける力になります。
                本屋・ミニシアター・ライブハウス・劇場・ギャラリー・神社・文化プロジェクトのための仕組みです。
              </p>
              <div className="hero-animate-3 mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-5 py-3.5">
                <span className="text-sm font-semibold text-white/80">初期費用・月額費用</span>
                <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">0円</span>
              </div>
              <div className="hero-animate-4 mt-10 flex flex-wrap gap-3">
                <Link
                  href="/owner/spots/new"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-moss hover:text-white active:scale-[0.97]"
                >
                  無料でSPOTを作る →
                </Link>
              </div>
            </div>

            {/* 右：ロゴアニメーション（デスクトップ） */}
            <div className="hidden lg:flex lg:items-center lg:justify-center"
              style={{ animation: "hero-fade-up 1s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}>
              <LogoAnimation className="h-[420px] w-[420px] opacity-90" />
            </div>

          </div>
        </div>
      </div>

      {/* ── 料金（リスクのなさ）── */}
      <PageShell className="py-14">
        <div ref={pricingRef} className="reveal overflow-hidden rounded-[28px] border border-ink/8 bg-white px-8 py-10 sm:px-10 sm:py-12">
          <div className="text-sm font-bold text-ink/72">PRICING</div>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
            始めるのに、費用はかかりません。
          </h2>

          {/* 固定費 + 手数料 */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "初期費用", value: "0円" },
              { label: "月額費用", value: "0円" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border-2 border-teal-600/30 bg-teal-50 px-5 py-5">
                <div className="text-sm font-semibold text-teal-700">{item.label}</div>
                <div className="mt-2 text-4xl font-extrabold leading-none text-teal-600">{item.value}</div>
              </div>
            ))}
            {[
              { label: "Stripe 決済手数料", value: "3.6%", sub: "決済額の 3.6%（Stripeへ）" },
              { label: "SPOT サービス利用料", value: "10%", sub: "決済手数料控除後の純額の 10%" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-ink/8 bg-mist/60 px-5 py-4">
                <div className="text-sm font-semibold text-ink/60">{item.label}</div>
                <div className="mt-2 text-2xl font-extrabold text-ink/70">{item.value}</div>
                <div className="mt-1.5 text-[13px] leading-5 text-ink/55">{item.sub}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-6 text-ink/60">
            手数料は応援会員の決済が発生した場合のみ。固定費・月額費用はかかりません。
          </p>

          {/* 振込額 */}
          <div className="mt-8 border-t border-ink/8 pt-7">
            <p className="text-sm font-bold text-ink/72">応援会員1人あたりの振込額（目安）</p>
            <div className="mt-4 grid gap-3">
              {[
                { from: "¥300", to: "約 ¥260" },
              ].map((row) => (
                <div key={row.from} className="flex items-center gap-3 rounded-2xl bg-mist px-5 py-3.5">
                  <span className="text-xl font-extrabold text-ink">{row.from}</span>
                  <span className="text-ink/55">→</span>
                  <span className="text-xl font-extrabold text-ink">{row.to}</span>
                  <span className="ml-auto text-sm text-ink/65">/月</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-ink/60">
              振込額は概算です。実際の金額はStripeの処理により若干異なる場合があります。
            </p>
          </div>

          {/* 100人いたら（具体例） */}
          <div className="mt-7 flex flex-col gap-4 rounded-[20px] bg-ink px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] font-semibold text-white/80">
              例えば、<span className="font-extrabold text-white">100人</span>の応援会員がいれば
            </p>
            <div className="flex items-end gap-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-teal-400/70">月間振込</div>
                <div className="mt-1 flex items-end gap-1.5">
                  <span className="text-[2.8rem] font-extrabold leading-none tracking-tight text-teal-400">¥26,028</span>
                  <span className="mb-1 text-sm font-semibold text-teal-400/70">/月</span>
                </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-teal-400/70">年間振込</div>
                <div className="mt-1 flex items-end gap-1.5">
                  <span className="text-[2.8rem] font-extrabold leading-none tracking-tight text-teal-400">¥312,336</span>
                  <span className="mb-1 text-sm font-semibold text-teal-400/70">/年</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-ink/60">
            月300円プラン・100人の場合の目安振込額。継続的に、毎月。
          </p>
        </div>
      </PageShell>

      {/* ── 価値訴求 3列 ── */}
      <PageShell>
        <div ref={valuesHeadRef} className="reveal mb-8 text-center">
          <div className="text-sm font-bold text-ink/72">WHAT YOU CAN DO</div>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">場所と応援する人をつなぐ、3つのこと。</h2>
        </div>
        <div ref={valuesRef} className="grid gap-4 sm:grid-cols-3">
          {values.map((v, i) => (
            i === 0 ? (
              <div key={v.eyebrow} className="flex flex-col rounded-[24px] bg-ink px-6 py-7 sm:px-7">
                <div className="text-sm font-bold text-teal-400">{v.eyebrow}</div>
                <h3 className="mt-3 whitespace-pre-line text-2xl font-extrabold leading-tight text-white">{v.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/80">{v.body}</p>
              </div>
            ) : (
              <Card key={v.eyebrow} className="px-6 py-7 sm:px-7">
                <div className="text-sm font-bold text-moss">{v.eyebrow}</div>
                <h3 className="mt-3 whitespace-pre-line text-2xl font-extrabold leading-tight text-ink">{v.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/72">{v.body}</p>
              </Card>
            )
          ))}
        </div>
      </PageShell>

      {/* ── なぜ（よくある疑問に答える） ── */}
      <PageShell className="mt-14">
        <div ref={whyHeadRef} className="reveal mb-8 text-center">
          <div className="text-sm font-bold text-ink/72">WHY SPOT</div>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">よくある疑問。</h2>
        </div>
        <div ref={whyRef} className="grid gap-4 lg:grid-cols-2">

          {/* なぜ少額の月額 */}
          <Card className="px-6 py-7 sm:px-8">
            <div className="text-sm font-bold text-moss">Q. 寄付や投げ銭と何が違うの？</div>
            <h3 className="mt-3 text-xl font-extrabold leading-snug text-ink">
              一度きりの善意ではなく、<br className="hidden sm:block" />会員証を持つ「続く関係」。
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
              寄付は一度で終わりますが、応援会員は毎月続きます。
              会員は番号入りの会員証を持ち、限定投稿を受け取り、「自分はこの場所を支えている」と言える関係になります。
              どのプランでも会員の権利は<strong className="text-ink/80">全員同じ</strong>。
              金額の大きさで扱いが変わることはありません。
            </p>
          </Card>

          {/* 一度きりの支援との違い */}
          <Card className="px-6 py-7 sm:px-8">
            <div className="text-sm font-bold text-moss">Q. 一度きりの資金集めと何が違うの？</div>
            <h3 className="mt-3 text-xl font-extrabold leading-snug text-ink">
              「集めて終わり」ではなく、<br className="hidden sm:block" />「続けて支える」会員制。
            </h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink/8">
              <div className="grid grid-cols-[68px_1fr_1fr] text-[13px] font-semibold">
                <div className="bg-mist px-3 py-2.5 text-ink/60" />
                <div className="bg-mist px-3 py-2.5 text-ink/60">一度きりの支援</div>
                <div className="bg-teal-600 px-3 py-2.5 text-white">SPOT</div>
              </div>
              {comparison.map((row) => (
                <div key={row.axis} className="grid grid-cols-[68px_1fr_1fr] border-t border-ink/8 text-[13px]">
                  <div className="px-3 py-3 font-semibold text-ink/60">{row.axis}</div>
                  <div className="px-3 py-3 leading-5 text-ink/60">{row.cf}</div>
                  <div className="bg-teal-50 px-3 py-3 font-bold leading-5 text-teal-700">{row.spot}</div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </PageShell>

      {/* ── STEP ── */}
      <PageShell className="mt-14">
        <div ref={stepsHeadRef} className="reveal mb-8 text-center">
          <div className="text-sm font-bold text-ink/72">HOW TO START</div>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">はじめ方は、3ステップ。</h2>
        </div>
        <div ref={stepsRef} className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="px-6 py-6 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
                  {index + 1}
                </span>
                <div className="text-sm font-bold text-ink/72">STEP {index + 1}</div>
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{step.body}</p>
            </Card>
          ))}
        </div>
      </PageShell>

      {/* ── FAQ ── */}
      <PageShell className="mt-14">
        <div className="mb-8 text-center">
          <div className="text-sm font-bold text-ink/72">FAQ</div>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">よくある質問</h2>
        </div>
        <Card className="px-6 sm:px-8">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </Card>
      </PageShell>

      {/* ── 底部CTA ── */}
      <PageShell className="mt-14">
        <div ref={bottomCtaRef} className="reveal relative overflow-hidden rounded-[28px] bg-ink px-8 py-10 text-center sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute inset-0 rounded-[28px]" style={GRID_BG} />
          <div className="relative">
            <div className="text-[13px] font-semibold tracking-[0.24em] text-white/65">START FOR FREE</div>
            <h2 className="mt-3 text-2xl font-extrabold text-white/90 sm:text-3xl">
              まず、あなたの場所のSPOTを作ってみる。
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/75">
              登録は無料。受取設定を完了すると、応援会員の募集を本番公開できます。
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/owner/spots/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-ink transition hover:bg-moss hover:text-white active:scale-[0.97]"
              >
                SPOTを作る →
              </Link>
            </div>
          </div>
        </div>
      </PageShell>

      {/* ── スティッキー CTA ── */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-ink/8 bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">街の小さな文化拠点のための、応援会員制度</p>
            <p className="text-xs text-ink/65">月300円から、場所や活動を支える会員になれます</p>
          </div>
          <Link href="/owner/spots/new" className="cta-primary shrink-0">
            無料でSPOTを作る →
          </Link>
        </div>
      )}
    </div>
  );
}
