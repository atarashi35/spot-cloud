"use client";

import Link from "next/link";
import { LogoAnimation } from "@/components/ui/logo-animation";
import { PageShell } from "@/components/ui/page-shell";

export function SpotMapPage() {
  return (
    <div className="pb-20">
      {/* ── LP Hero ── */}
      <div className="relative overflow-hidden bg-ink px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8">

        {/* グリッド背景 */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">

            {/* 左：コピー */}
            <div>
              <div className="hero-animate-1 relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5">
                <span className="hero-pulse relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-moss opacity-75" style={{animation:"ping 1.5s cubic-bezier(0,0,0.2,1) infinite"}} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-moss" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.2em] text-white/60">A NEW WAY TO BELONG</span>
              </div>

              <h1 className="hero-animate-2 mt-6 text-[clamp(2.6rem,8vw,5.5rem)] font-bold leading-[1.08] tracking-tight">
                <span className="block text-white/90">月100円で</span>
                <span className="block text-white/90">好きな居場所の</span>
                <span className="hero-gradient-text block">サポーターになる。</span>
              </h1>

              <p className="hero-animate-3 mt-6 text-[15px] leading-relaxed text-white/70 sm:text-base">
                月額100円から参加できる、応援サポーター（ソシオ）
              </p>

              <div className="hero-animate-4 mt-10 flex flex-wrap items-center gap-3">
                <Link href="/spots" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-moss hover:text-white active:scale-[0.97]">
                  SPOTを探す →
                </Link>
                <Link href="/owner" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-moss hover:bg-moss hover:text-white active:scale-[0.97]">
                  SPOTを作る
                </Link>
              </div>
            </div>

            {/* 右：ロゴアニメーション（デスクトップ） */}
            <div className="hidden lg:flex lg:items-center lg:justify-center"
              style={{ animation: "hero-fade-up 1s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}>
              <LogoAnimation className="h-[420px] w-[420px] opacity-90" />
            </div>

            {/* 背景：ロゴアニメーション（モバイルのみ・薄く重ねる） */}
            <div className="pointer-events-none absolute -right-16 -top-8 lg:hidden"
              style={{ animation: "hero-fade-up 1s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}>
              <LogoAnimation className="h-[320px] w-[320px] opacity-20" />
            </div>

          </div>
        </div>
      </div>

      {/* ── About ── */}
      <PageShell className="py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "SPOT とは？", body: "場所やコミュニティが作るページ。\nカフェ・サークル・地域団体など、\nあらゆる「居場所」が登録できます。" },
            { label: "サポーターとは？", body: "月100円から参加できる、\n新しい参加のかたち。\n金額に関わらず、\nすべてのサポーターが1票を持ちます。" },
            { label: "なにができる？", body: "イベントに参加したり、\nアンケートや意見を通して、\nその場所を一緒につくっていけます。" },
          ].map(({ label, body }) => (
            <div key={label} className="flex flex-col rounded-[24px] border border-ink/8 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(19,35,28,0.07)]">
              <div className="text-[10px] font-semibold tracking-[0.22em] text-ink/38">ABOUT</div>
              <h3 className="mt-2 text-base font-bold text-ink">{label}</h3>
              <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-[2] text-ink/58">{body}</p>
            </div>
          ))}
        </div>
      </PageShell>

      {/* ── SPOT一覧へのCTA ── */}
      <PageShell>
        <Link
          href="/spots"
          className="flex items-center justify-between rounded-[28px] border border-ink/10 bg-white px-8 py-6 transition hover:border-moss hover:shadow-[0_8px_24px_rgba(19,35,28,0.07)]"
        >
          <div>
            <div className="text-[10px] font-semibold tracking-[0.28em] text-ink/38">SPOT MAP</div>
            <p className="mt-1 text-lg font-bold text-ink">SPOTを探す</p>
            <p className="mt-0.5 text-sm text-ink/50">あなたの居場所を見つけて、サポーターになろう。</p>
          </div>
          <span className="text-2xl text-ink/30">→</span>
        </Link>
      </PageShell>

      {/* ── Owner CTA ── */}
      <PageShell className="mt-4">
        <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-6 py-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-ink/38">FOR OWNERS</div>
          <p className="mt-2 text-base font-bold text-ink">あなたのSPOTを登録しませんか？</p>
          <p className="mt-1.5 text-[13px] leading-[1.7] text-ink/55">
            カフェ・サークル・地域活動など、サポーターを集める場所として公開できます。
          </p>
          <Link href="/owner" className="cta-primary mt-5 inline-flex">
            SPOTを登録する
          </Link>
        </div>
      </PageShell>
    </div>
  );
}
