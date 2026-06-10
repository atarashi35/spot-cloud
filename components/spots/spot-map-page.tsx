"use client";

import Link from "next/link";
import { LogoAnimation } from "@/components/ui/logo-animation";
import { PageShell } from "@/components/ui/page-shell";
import { SpotCard } from "@/components/spot-card";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";
import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const PREVIEW_COUNT = 6;

export function SpotMapPage() {
  const [spots, setSpots] = useState<Spot[] | null>(null);

  useEffect(() => {
    void listPublishedSpotsFromFirestore().then(setSpots).catch(() => setSpots([]));
  }, []);

  const preview = spots?.slice(0, PREVIEW_COUNT) ?? null;

  const aboutHeadingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
  const aboutRef = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 90 });
  const counterRef = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
  const previewRef = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 70 });
  const ctaRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

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
              <div className="hero-animate-1 relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2">
                <span className="hero-pulse relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-moss opacity-75" style={{animation:"ping 1.5s cubic-bezier(0,0,0.2,1) infinite"}} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-moss" />
                </span>
                <span className="text-sm font-semibold text-white/80">好きな活動を、まるごと応援。</span>
              </div>

              <h1 className="hero-animate-2 mt-6 text-[clamp(2.6rem,8vw,5.5rem)] font-extrabold leading-[1.08] tracking-tight">
                <span className="block text-white/90">月100〜500円で</span>
                <span className="hero-gradient-text block">箱推し、しよう。</span>
              </h1>

              <p className="hero-animate-3 mt-5 max-w-md text-[clamp(0.95rem,2vw,1.1rem)] leading-relaxed text-white/60">
                組織・団体・プロジェクトのための、小さなファンクラブサービスです。
              </p>

              <div className="hero-animate-4 mt-8 flex flex-wrap items-center gap-3">
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
        <div ref={aboutHeadingRef} className="mb-6 px-1 reveal">
          <div className="text-sm font-bold text-ink/72">ABOUT</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">SPOTってなに？</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/72">
            SPOTは、組織・団体・プロジェクトのための小さなファンクラブサービスです。月100〜500円で参加できます。
          </p>
        </div>
        <div ref={aboutRef} className="grid gap-4 sm:grid-cols-3">
          {/* 通常カード: SPOT とは？ */}
          <div className="flex flex-col rounded-[24px] border border-ink/8 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(19,35,28,0.07)]">
            <h3 className="text-xl font-extrabold text-ink">SPOT とは？</h3>
            <p className="mt-3 flex-1 whitespace-pre-line text-[15px] leading-[1.9] text-ink/68">
              {"組織・団体・プロジェクトが作るページ。\nカフェ・サークル・地域団体など、\nさまざまな活動が登録できます。"}
            </p>
          </div>
          {/* 反転カード（最重要）: サポーターとは？ */}
          <div className="flex flex-col rounded-[24px] bg-ink p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
            <h3 className="text-xl font-extrabold text-white">サポーターとは？</h3>
            <p className="mt-3 flex-1 whitespace-pre-line text-[15px] leading-[1.9] text-white/80">
              {"月100〜500円で参加できる、\n新しい応援のかたち。\n金額に関わらず、\nすべてのサポーターが1票を持ちます。"}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-teal-400/15 px-3 py-1">
              <span className="text-sm font-bold text-teal-400">月100〜500円</span>
            </div>
          </div>
          {/* 通常カード: なにができる？ */}
          <div className="flex flex-col rounded-[24px] border border-ink/8 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(19,35,28,0.07)]">
            <h3 className="text-xl font-extrabold text-ink">なにができる？</h3>
            <p className="mt-3 flex-1 whitespace-pre-line text-[15px] leading-[1.9] text-ink/68">
              {"イベントに参加したり、\nアンケートや意見を通して、\nその活動を一緒につくっていけます。"}
            </p>
          </div>
        </div>
      </PageShell>

      {/* ── WHY ── */}
      <PageShell className="pb-14">
        <div className="mb-6 px-1">
          <div className="text-sm font-bold text-ink/72">WHY SPOT</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">よくある疑問。</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Q1 */}
          <div className="flex flex-col rounded-[24px] border border-ink/8 bg-white p-6">
            <p className="text-sm font-bold text-moss">Q. なんで月100円なの？</p>
            <p className="mt-3 text-xl font-extrabold leading-snug text-ink">
              お金の大きさで、声の大きさが変わらないように。
            </p>
            <p className="mt-3 flex-1 text-[15px] leading-[1.9] text-ink/72">
              高い金額ほど発言力が増す仕組みなら、活動は一部の人の声に偏ってしまいます。SPOTはあえて少額に揃え、金額に関わらずサポーターは全員1票。誰もが対等に関われます。
            </p>
          </div>
          {/* Q2 */}
          <div className="flex flex-col rounded-[24px] border border-ink/8 bg-white p-6">
            <p className="text-sm font-bold text-moss">Q. 従来のクラファンと何が違う？</p>
            <p className="mt-3 text-xl font-extrabold leading-snug text-ink">
              「集めて終わり」ではなく、「続けて育てる」ファンクラブ形式。
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-ink/8 text-[13px]">
              <div className="grid grid-cols-3 font-semibold">
                <span className="bg-mist px-4 py-2.5 text-ink/60" />
                <span className="bg-mist px-4 py-2.5 text-center text-ink/60">従来のクラファン</span>
                <span className="bg-teal-600 px-4 py-2.5 text-center text-white">SPOT</span>
              </div>
              {[
                ["かたち", "一度きりの資金集め", "毎月続くファンクラブ"],
                ["目的", "目標額を達成する", "続く関係をつくる"],
                ["終わり方", "達成したら終了", "ずっと続いていく"],
                ["関係", "支援したら終わり", "投票・お知らせで関わり続ける"],
              ].map(([row, cfCol, spotCol]) => (
                <div key={row} className="grid grid-cols-3 border-t border-ink/8">
                  <span className="px-4 py-3 font-semibold text-ink/60">{row}</span>
                  <span className="px-4 py-3 text-center text-ink/60">{cfCol}</span>
                  <span className="bg-teal-50 px-4 py-3 text-center font-bold text-teal-700">{spotCol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageShell>

      {/* ── カウンター ── */}
      {spots && (spots.length > 0 || spots.reduce((sum, s) => sum + s.socioCount, 0) > 0) && (
        <PageShell className="py-10">
          <div ref={counterRef} className="reveal flex items-center justify-center gap-16 sm:gap-28">
            <div className="text-center">
              <div className="text-sm font-bold text-ink/65">SPOTS</div>
              <div className="mt-1 text-[clamp(3.5rem,10vw,6rem)] font-extrabold leading-none tabular-nums text-ink">{spots.length}</div>
              <div className="mt-2 text-sm font-bold text-ink/72">参加中</div>
            </div>
            <div className="h-16 w-px bg-ink/12" />
            <div className="text-center">
              <div className="text-sm font-bold text-ink/65">SUPPORTERS</div>
              <div className="mt-1 text-[clamp(3.5rem,10vw,6rem)] font-extrabold leading-none tabular-nums text-ink">
                {spots.reduce((sum, s) => sum + s.socioCount, 0)}
              </div>
              <div className="mt-2 text-sm font-bold text-ink/72">人のサポーター</div>
            </div>
          </div>
        </PageShell>
      )}

      {/* ── SPOT プレビュー ── */}
      <PageShell className="py-10">
        <div className="mb-6 flex items-end justify-between px-1">
          <div>
            <div className="text-sm font-bold text-ink/72">SPOT MAP</div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">SPOTを探す</h2>
          </div>
          <Link href="/spots" className="text-sm font-semibold text-moss hover:underline">
            すべて見る →
          </Link>
        </div>

        {/* カードグリッド */}
        {!preview ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="panel overflow-hidden animate-pulse">
                <div className="h-44 w-full bg-mist" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-16 rounded-full bg-mist" />
                  <div className="h-5 w-3/4 rounded-full bg-mist" />
                  <div className="h-3 w-full rounded-full bg-mist" />
                </div>
              </div>
            ))}
          </div>
        ) : preview.length === 0 ? null : (
          <div ref={previewRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}

        {/* もっと見るボタン */}
        {spots && spots.length > PREVIEW_COUNT && (
          <div className="mt-8 text-center">
            <Link href="/spots" className="cta-secondary">
              すべての {spots.length} SPOTを見る
            </Link>
          </div>
        )}
      </PageShell>

      {/* ── Owner CTA ── */}
      <PageShell className="mt-4">
        <div ref={ctaRef} className="reveal rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-6 py-8 text-center">
          <div className="text-sm font-bold text-ink/72">FOR OWNERS</div>
          <p className="mt-2 text-2xl font-extrabold text-ink">あなたもSPOTを作りませんか？</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/68">
            小さなファンクラブで、あなたの活動を応援する人を集めませんか？
          </p>
          <Link href="/owner" className="cta-primary mt-5 inline-flex">
            SPOTを作る
          </Link>
        </div>
      </PageShell>
    </div>
  );
}
