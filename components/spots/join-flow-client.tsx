"use client";

import Link from "next/link";
import { useState } from "react";

import { KO_UNIT_AMOUNT, MIN_KO, PlanAmount, Spot } from "@/lib/types";
import { amountToKo, koToAmount } from "@/lib/plan";

export function JoinFlowClient({
  spot,
  selectedPlan
}: {
  spot: Spot;
  selectedPlan: PlanAmount;
}) {
  const [planAmount, setPlanAmount] = useState<PlanAmount>(selectedPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ko = amountToKo(planAmount);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          spotId: spot.id,
          planAmount
        })
      });

      const data = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? data.error ?? "Checkout セッションの作成に失敗しました。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加入処理に失敗しました。");
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">JOIN AS SOCIO</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">{spot.name} の応援会員加入</h1>
        <p className="mt-3 text-sm text-ink/72">口数を選ぶと、そのまま決済へ進みます。1口 ¥100 から、何口でも。</p>

        <div className="mt-8 rounded-[20px] border border-ink/10 bg-mist p-6">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-ink/55">1口 ¥100 / 月</p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              type="button"
              aria-label="口数を減らす"
              onClick={() => setPlanAmount((a) => Math.max(MIN_KO * KO_UNIT_AMOUNT, a - KO_UNIT_AMOUNT))}
              disabled={ko <= MIN_KO}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-2xl font-bold text-ink transition hover:border-ink disabled:opacity-30"
            >
              −
            </button>
            <div className="min-w-[100px] text-center">
              <div className="text-5xl font-extrabold leading-none text-ink">
                {ko}
                <span className="ml-1 text-2xl">口</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="口数を増やす"
              onClick={() => setPlanAmount((a) => a + KO_UNIT_AMOUNT)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-2xl font-bold text-ink transition hover:border-ink"
            >
              ＋
            </button>
          </div>
          <p className="mt-5 text-center text-sm text-ink/72">
            月額 <span className="text-2xl font-extrabold text-ink">¥{koToAmount(ko).toLocaleString("ja-JP")}</span>
          </p>
        </div>

        {error ? <p className="mt-5 text-sm font-medium text-red-700">{error}</p> : null}

        <p className="mt-8 text-xs leading-6 text-ink/65">
          「加入する」ボタンをクリックすることで、
          <Link href="/terms" className="underline hover:text-moss">利用規約</Link>
          および
          <Link href="/privacy" className="underline hover:text-moss">プライバシーポリシー</Link>
          に同意したものとみなします。
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="cta-primary" onClick={startCheckout} disabled={loading}>
            {loading ? "Checkout に移動中..." : `${ko}口（¥${koToAmount(ko).toLocaleString("ja-JP")}）で加入する`}
          </button>
          <Link href={`/spots/${spot.id}`} className="cta-secondary">
            詳細に戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
