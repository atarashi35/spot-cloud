"use client";

import Link from "next/link";
import { useState } from "react";

import { PlanAmount, Spot, planOptions } from "@/lib/types";

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
        <p className="mt-3 text-sm text-ink/72">金額を選ぶと、そのまま決済へ進みます。</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {planOptions.map((amount) => {
            const active = amount === planAmount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => setPlanAmount(amount)}
                className={`rounded-[20px] border p-5 text-left transition ${
                  active ? "border-ink bg-ink text-white" : "border-ink/10 bg-mist text-ink"
                }`}
              >
                <div className="text-xs font-semibold tracking-[0.2em] opacity-70">PLAN</div>
                <div className="mt-2 text-3xl font-extrabold">¥{amount}</div>
                <div className="mt-2 text-sm opacity-75">月額</div>
              </button>
            );
          })}
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
            {loading ? "Checkout に移動中..." : `¥${planAmount} で加入する`}
          </button>
          <Link href={`/spots/${spot.id}`} className="cta-secondary">
            詳細に戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
