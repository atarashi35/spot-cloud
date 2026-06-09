"use client";

import Link from "next/link";
import React, { useState } from "react";
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
    body: "月100円から参加できる仕組みで、あなたの居場所を長く支えてくれる人を募れます。",
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
    title: "居場所を登録する",
    body: "場所や団体の紹介、カテゴリ、カバー画像を登録して、あなたの居場所を公開します。",
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

const useCases = [
  {
    category: "カフェ・飲食店",
    emoji: "☕",
    tags: ["常連向けイベント", "新メニュー投票", "限定情報配信"],
    body: "お店のファンに、来店以外でもつながれる場所を。日々の限定情報や投票を通じてリピーターが育ちます。",
  },
  {
    category: "アート・音楽・文化活動",
    emoji: "🎨",
    tags: ["制作過程の共有", "作品先行公開", "意見募集"],
    body: "活動を支えてくれる人を集めながら、制作の裏側を届ける。共感が応援に変わる場所をつくれます。",
  },
  {
    category: "地域団体・自治会",
    emoji: "🏘",
    tags: ["イベント案内", "お知らせ", "地域アンケート"],
    body: "回覧板では届かない層にも。デジタルで参加できる仕組みで、関わりたい人を巻き込めます。",
  },
  {
    category: "教室・スクール",
    emoji: "📚",
    tags: ["卒業後のコミュニティ", "限定イベント", "近況共有"],
    body: "卒業しても続く縁を。受講生どうしのつながりや、卒業後も続く関係性をつくれます。",
  },
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
    q: "どんな団体が利用できますか？",
    a: "カフェ、個人店、教室、文化施設、スポーツ団体、地域団体、神社仏閣など幅広くご利用いただけます。",
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
        <p className="pb-5 text-sm leading-7 text-ink/65">{a}</p>
      )}
    </div>
  );
}

export default function OwnerPage() {
  const empathyRef    = useScrollReveal<HTMLDivElement>({ threshold: 0.15 });
  const valuesHeadRef = useScrollReveal<HTMLDivElement>();
  const valuesRef     = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 100 });
  const useCasesHeadRef = useScrollReveal<HTMLDivElement>();
  const useCasesRef   = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 90 });
  const stepsHeadRef  = useScrollReveal<HTMLDivElement>();
  const stepsRef      = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 100 });
  const pricingRef    = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const hundredRef    = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const bottomCtaRef  = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div className="pb-20">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-ink px-6 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
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
              <div className="hero-animate-1 inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-white/50">
                FOR OWNERS
              </div>
              <h1 className="hero-animate-2 mt-5 text-[clamp(2.4rem,7vw,4.5rem)] font-bold leading-[1.1] tracking-tight">
                <span className="block text-white/90">応援され続ける</span>
                <span className="hero-gradient-text block">居場所をつくる。</span>
              </h1>
              <p className="hero-animate-3 mt-6 max-w-lg text-[15px] leading-relaxed text-white/60 sm:text-base">
                月100円のサポーターと共に、<br />
                活動を育てていくためのSPOT。
              </p>
              <div className="hero-animate-4 mt-10 flex flex-wrap gap-3">
                <Link
                  href="/owner/spots/new"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-moss hover:text-white active:scale-[0.97]"
                >
                  居場所を登録する →
                </Link>
                <Link
                  href="/manage"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-moss hover:bg-moss hover:text-white active:scale-[0.97]"
                >
                  運営中のSPOTを見る
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

      {/* ── 共感コピー ── */}
      <PageShell className="py-14">
        <div ref={empathyRef} className="reveal rounded-[28px] bg-mist px-8 py-10 sm:px-12 sm:py-12">
          <p className="text-lg font-bold leading-relaxed text-ink sm:text-xl">
            応援してくれる人はいるのに、<br />
            つながり続ける方法がない。
          </p>
          <p className="mt-5 max-w-xl text-sm leading-8 text-ink/65 sm:text-[15px]">
            SNSでは埋もれる。ホームページでは届かない。<br />
            SPOTは、月100円から参加できるサポーターコミュニティを
            あなたの居場所に作ります。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "カフェ", "飲食・レストラン", "バー・居酒屋", "スポーツ",
              "音楽・ライブ", "アート", "クリエイター", "文化施設",
              "学び・教室", "ワークスペース", "自然・アウトドア",
              "市民団体", "商店街", "寺社仏閣", "自治会",
            ].map((item) => (
              <span key={item} className="rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-sm text-ink/68">
                {item}
              </span>
            ))}
            <span className="rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-sm text-ink/40">
              など
            </span>
          </div>
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

      {/* ── 利用例 ── */}
      <PageShell className="mt-14">
        <div ref={useCasesHeadRef} className="reveal mb-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">USE CASES</div>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">こんな居場所で使われています。</h2>
        </div>
        <div ref={useCasesRef} className="grid gap-4 sm:grid-cols-2">
          {useCases.map((uc) => (
            <Card key={uc.category} className="px-6 py-7 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{uc.emoji}</span>
                <div className="text-sm font-bold text-ink">{uc.category}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {uc.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-mist px-3 py-1 text-[12px] font-semibold text-ink/65">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-ink/60">{uc.body}</p>
            </Card>
          ))}
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

      {/* ── 料金 ── */}
      <PageShell className="mt-14">
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

      {/* ── 100人のソシオ ── */}
      <PageShell className="mt-14">
        <div ref={hundredRef} className="reveal relative overflow-hidden rounded-[28px] bg-ink">
          <div className="pointer-events-none absolute inset-0" style={GRID_BG} />
          <div className="relative grid lg:grid-cols-[1fr_1px_1fr]">

            {/* 左：数字 */}
            <div className="px-8 py-10 sm:px-10 sm:py-14">
              <div className="text-[11px] font-semibold tracking-[0.24em] text-white/40">IF 100 SOCIOS</div>
              <p className="mt-5 text-base font-semibold text-white/70">
                100人のサポーターがいると。
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-white/35">月収入</div>
                  <div className="mt-1.5 flex items-end gap-2">
                    <span className="text-[3rem] font-bold leading-none tracking-tight text-white sm:text-[3.5rem]">¥8,700</span>
                    <span className="mb-1 text-sm font-semibold text-white/45">/ 月</span>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-white/35">年収入</div>
                  <div className="mt-1.5 flex items-end gap-2">
                    <span className="text-[3rem] font-bold leading-none tracking-tight text-white sm:text-[3.5rem]">¥104,400</span>
                    <span className="mb-1 text-sm font-semibold text-white/45">/ 年</span>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-white/40">
                月100円プラン・100人の場合の目安振込額。継続的に、毎月。
              </p>
            </div>

            {/* 区切り線 */}
            <div className="hidden bg-white/8 lg:block" />

            {/* 右：使い道 */}
            <div className="px-8 py-10 sm:px-10 sm:py-14">
              <div className="text-[11px] font-semibold tracking-[0.24em] text-white/40">WHAT YOU CAN DO</div>
              <p className="mt-5 text-base font-semibold text-white/85">こんなことに活用できます。</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  "イベントの景品代",
                  "チラシ・印刷代",
                  "活動備品の購入",
                  "ドリンク・軽食代",
                  "会場費の一部",
                  "次の企画の原資",
                ].map((item) => (
                  <div key={item} className="flex items-center rounded-2xl border border-white/12 bg-white/8 px-4 py-3.5">
                    <span className="text-sm font-medium text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </PageShell>

      {/* ── 底部CTA ── */}
      <PageShell className="mt-14">
        <div ref={bottomCtaRef} className="reveal relative overflow-hidden rounded-[28px] bg-ink px-8 py-10 text-center sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute inset-0 rounded-[28px]" style={GRID_BG} />
          <div className="relative">
            <div className="text-[11px] font-semibold tracking-[0.24em] text-white/40">START FOR FREE</div>
            <h2 className="mt-3 text-2xl font-bold text-white/90 sm:text-3xl">
              まず、居場所をひとつ登録する。
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/55">
              登録は無料。受取設定を完了すると、サポーター募集を本番公開できます。
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/owner/spots/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-ink transition hover:bg-moss hover:text-white active:scale-[0.97]"
              >
                居場所を登録する →
              </Link>
            </div>
          </div>
        </div>
      </PageShell>

    </div>
  );
}
