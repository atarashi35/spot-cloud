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
    eyebrow: "サポーターが集まる",
    title: "応援者を\n集められます。",
    body: "月100〜500円で参加できる仕組みで、活動を長く支えてくれる人を募れます。",
  },
  {
    eyebrow: "一緒につくる",
    title: "参加者と\n活動を育てられます。",
    body: "アンケートや意見募集を通して、サポーターの声を活動に活かせます。",
  },
  {
    eyebrow: "続けられる",
    title: "関係を\n継続できます。",
    body: "イベントやお知らせで定期的につながり、サポーターとの距離を縮め続けられます。",
  },
];

const steps = [
  {
    title: "SPOTを登録する",
    body: "団体や活動の紹介、カテゴリ、カバー画像を登録して、SPOTを公開します。",
  },
  {
    title: "受取設定を行う",
    body: "受取口座の設定です。完了後、サポーター募集を本番公開できます。",
  },
  {
    title: "サポーターを募集する",
    body: "月額100円・300円・500円のプランで参加者を募り、活動を一緒に育てていきます。",
  },
];

const comparison = [
  { axis: "かたち", cf: "一度きりの資金集め", spot: "毎月続く継続型" },
  { axis: "目的", cf: "目標額を達成する", spot: "続く関係をつくる" },
  { axis: "終わり方", cf: "達成したら終了", spot: "ずっと続いていく" },
  { axis: "関係", cf: "支援したら終わり", spot: "お知らせ・投票で関わり続ける" },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "利用料金はかかりますか？",
    a: (
      <span>
        SPOTの登録・公開は無料です。サポーターから支援を受けた場合のみ、
        <ul className="mt-2 space-y-1 pl-1">
          <li>・Stripe 決済手数料　3.6%</li>
          <li>・SPOT 利用料　決済手数料控除後の<strong className="text-ink/80">純額の 10%</strong></li>
        </ul>
        <span className="mt-2 block">が発生します。それ以外の固定費や月額費用はありません。</span>
      </span>
    ),
  },
  {
    q: "サポーターの月額金額は？",
    a: "月100円・300円・500円の3プランです。どのプランでも、サポーターは1票を持ちます。",
  },
  {
    q: "どんな用途で使えますか？",
    a: "組織・団体・プロジェクトなら、幅広くご利用いただけます。使い道はあなた次第です。",
  },
  {
    q: "サポーターと何ができますか？",
    a: "限定投稿、イベント、アンケート、意見募集などを通じて、参加者と活動を一緒に育てられます。",
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
          className={`h-4 w-4 shrink-0 text-ink/35 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-5 text-sm leading-7 text-ink/65">{a}</div>
      )}
    </div>
  );
}

export default function OwnerPage() {
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
                <span className="text-sm font-semibold text-white/70">組織・団体・プロジェクトのファンクラブ</span>
              </div>
              <h1 className="hero-animate-2 mt-5 text-[clamp(2rem,6vw,3.5rem)] font-bold leading-[1.15] tracking-tight">
                <span className="block text-white/90">あなたの活動を応援する</span>
                <span className="hero-gradient-text block">サポーターを、募集できます。</span>
              </h1>
              <p className="hero-animate-3 mt-6 max-w-lg text-[15px] leading-relaxed text-white/60 sm:text-base">
                サポーターは、月100〜500円から参加できます。
              </p>
              <div className="hero-animate-3 mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-5 py-3.5">
                <span className="text-sm font-semibold text-white/70">初期費用・月額費用</span>
                <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">0円</span>
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
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">PRICING</div>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
            始めるのに、費用はかかりません。
          </h2>

          {/* 固定費 + 手数料 */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "初期費用", value: "0円", sub: null },
              { label: "月額費用", value: "0円", sub: null },
              { label: "Stripe 決済手数料", value: "3.6%", sub: "決済額の 3.6%（Stripeへ）" },
              { label: "SPOT サービス利用料", value: "10%", sub: "決済手数料控除後の純額の 10%" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-ink/8 bg-mist/60 px-5 py-4">
                <div className="text-xs font-semibold text-ink/45">{item.label}</div>
                <div className="mt-2 text-xl font-bold text-ink">{item.value}</div>
                {item.sub && <div className="mt-1 text-xs leading-5 text-ink/45">{item.sub}</div>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-6 text-ink/40">
            手数料はサポーターの決済が発生した場合のみ。固定費・月額費用はかかりません。
          </p>

          {/* 振込額 */}
          <div className="mt-8 border-t border-ink/8 pt-7">
            <p className="text-sm font-semibold text-ink">サポーター1人あたりの振込額（目安）</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { from: "¥100", to: "約 ¥87" },
                { from: "¥300", to: "約 ¥260" },
                { from: "¥500", to: "約 ¥434" },
              ].map((row) => (
                <div key={row.from} className="flex items-center gap-3 rounded-2xl bg-mist px-5 py-3.5">
                  <span className="text-base font-bold text-ink">{row.from}</span>
                  <span className="text-ink/30">→</span>
                  <span className="text-base font-bold text-ink">{row.to}</span>
                  <span className="ml-auto text-xs text-ink/40">/月</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-ink/40">
              振込額は概算です。実際の金額はStripeの処理により若干異なる場合があります。
            </p>
          </div>

          {/* 100人いたら（具体例） */}
          <div className="mt-7 flex flex-col gap-4 rounded-[20px] bg-ink px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-white/70">
              例えば、<span className="text-white">100人</span>のサポーターがいれば
            </p>
            <div className="flex items-end gap-6">
              <div>
                <div className="flex items-end gap-1.5">
                  <span className="text-[2.5rem] font-bold leading-none tracking-tight text-white">¥8,700</span>
                  <span className="mb-1 text-xs font-semibold text-white/45">/月</span>
                </div>
              </div>
              <div className="h-9 w-px bg-white/12" />
              <div>
                <div className="flex items-end gap-1.5">
                  <span className="text-[2.5rem] font-bold leading-none tracking-tight text-white">¥104,400</span>
                  <span className="mb-1 text-xs font-semibold text-white/45">/年</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-ink/40">
            月100円プラン・100人の場合の目安振込額。継続的に、毎月。
          </p>
        </div>
      </PageShell>

      {/* ── 価値訴求 3列 ── */}
      <PageShell>
        <div ref={valuesHeadRef} className="reveal mb-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">WHAT YOU CAN DO</div>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">サポーターと共に育てる、3つのこと。</h2>
        </div>
        <div ref={valuesRef} className="grid gap-4 sm:grid-cols-3">
          {values.map((v) => (
            <Card key={v.eyebrow} className="px-6 py-7 sm:px-7">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-moss">{v.eyebrow}</div>
              <h3 className="mt-3 whitespace-pre-line text-xl font-bold leading-tight text-ink">{v.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/65">{v.body}</p>
            </Card>
          ))}
        </div>
      </PageShell>

      {/* ── なぜ（よくある疑問に答える） ── */}
      <PageShell className="mt-14">
        <div ref={whyHeadRef} className="reveal mb-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">WHY SPOT</div>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">よくある疑問。</h2>
        </div>
        <div ref={whyRef} className="grid gap-4 lg:grid-cols-2">

          {/* なぜ月100円 */}
          <Card className="px-6 py-7 sm:px-8">
            <div className="text-base font-bold text-moss">Q. なんで月100円なの？</div>
            <h3 className="mt-3 text-lg font-bold leading-snug text-ink">
              お金の大きさで、<br className="hidden sm:block" />声の大きさが変わらないように。
            </h3>
            <p className="mt-4 text-sm leading-7 text-ink/65">
              もし高い金額ほど発言力が増す仕組みなら、活動は一部の人の声に偏ってしまいます。
              SPOTはあえて少額に揃え、金額に関わらずサポーターは<strong className="text-ink/80">全員1票</strong>。
              誰もが気軽に、そして対等に参加できます。少額でも、続けば大きな力になります。
            </p>
          </Card>

          {/* クラファンとの違い */}
          <Card className="px-6 py-7 sm:px-8">
            <div className="text-base font-bold text-moss">Q. 従来のクラファンと何が違うの？</div>
            <h3 className="mt-3 text-lg font-bold leading-snug text-ink">
              「集めて終わり」ではなく、<br className="hidden sm:block" />「続けて育てる」継続型。
            </h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink/8">
              <div className="grid grid-cols-[68px_1fr_1fr] bg-mist text-[11px] font-semibold text-ink/45">
                <div className="px-3 py-2.5" />
                <div className="px-3 py-2.5">従来のクラファン</div>
                <div className="px-3 py-2.5 text-moss">SPOT</div>
              </div>
              {comparison.map((row) => (
                <div key={row.axis} className="grid grid-cols-[68px_1fr_1fr] border-t border-ink/8 text-xs">
                  <div className="px-3 py-3 font-semibold text-ink/55">{row.axis}</div>
                  <div className="px-3 py-3 leading-5 text-ink/50">{row.cf}</div>
                  <div className="bg-moss/5 px-3 py-3 font-semibold leading-5 text-ink">{row.spot}</div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </PageShell>

      {/* ── STEP ── */}
      <PageShell className="mt-14">
        <div ref={stepsHeadRef} className="reveal mb-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">HOW TO START</div>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">はじめ方は、3ステップ。</h2>
        </div>
        <div ref={stepsRef} className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="px-6 py-6 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <div className="text-[11px] font-semibold tracking-[0.18em] text-ink/42">STEP {index + 1}</div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/65">{step.body}</p>
            </Card>
          ))}
        </div>
      </PageShell>

      {/* ── FAQ ── */}
      <PageShell className="mt-14">
        <div className="mb-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">FAQ</div>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">よくある質問</h2>
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
            <div className="text-[11px] font-semibold tracking-[0.24em] text-white/40">START FOR FREE</div>
            <h2 className="mt-3 text-2xl font-bold text-white/90 sm:text-3xl">
              まず、SPOTをひとつ作ってみる。
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/55">
              登録は無料。受取設定を完了すると、サポーター募集を本番公開できます。
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
            <p className="text-sm font-bold text-ink">組織・団体・プロジェクトのファンクラブ</p>
            <p className="text-xs text-ink/50">月100〜500円でサポーターを集められます</p>
          </div>
          <Link href="/owner/spots/new" className="cta-primary shrink-0">
            無料でSPOTを作る →
          </Link>
        </div>
      )}
    </div>
  );
}
