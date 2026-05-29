"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { PlanAmount, Spot, planOptions } from "@/lib/types";

export function JoinFlowClient({
  spot,
  selectedPlan
}: {
  spot: Spot;
  selectedPlan: PlanAmount;
}) {
  const { authReady, user } = useAuth();
  const [planAmount, setPlanAmount] = useState<PlanAmount>(selectedPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!user) {
      setError("加入するには Google ログインが必要です。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
        <span className="chip">JOIN FLOW</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">{spot.name} のソシオ加入</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          Stripe Billing で固定プランのサブスクリプションを作成します。高額支援は作らず、所属だけを扱います。
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {planOptions.map((amount) => {
            const active = amount === planAmount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => setPlanAmount(amount)}
                className={`rounded-[24px] border p-5 text-left transition ${
                  active ? "border-ink bg-ink text-white" : "border-ink/10 bg-mist text-ink"
                }`}
              >
                <div className="text-xs font-semibold tracking-[0.2em] opacity-70">PLAN</div>
                <div className="mt-2 text-3xl font-bold">¥{amount}</div>
                <div className="mt-2 text-sm opacity-75">月額所属プラン</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-[28px] bg-mist p-5">
          <div className="text-lg font-bold text-ink">加入前の確認</div>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-ink/68">
            <li>Google ログイン済みユーザーだけが Checkout に進みます</li>
            <li>課金完了後に webhook が membership を作成します</li>
            <li>完了後は SPOT 詳細へ戻り、その場で限定情報が開ける状態になります</li>
          </ul>
        </div>

        {error ? <p className="mt-5 text-sm font-medium text-red-700">{error}</p> : null}
        {!authReady ? (
          <p className="mt-5 text-sm text-ink/60">認証状態を確認中です。</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="cta-primary" onClick={startCheckout} disabled={loading || !authReady}>
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
