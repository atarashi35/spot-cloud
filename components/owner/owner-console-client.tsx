"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectOnboardingButton } from "@/components/owner/connect-onboarding-button";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { listOwnerSpotsFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

export function OwnerConsoleClient() {
  const { authReady, user } = useAuth();
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSpots(null);
      return;
    }

    void listOwnerSpotsFromFirestore(user.uid)
      .then((nextSpots) => {
        setSpots(nextSpots);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      });
  }, [user]);

  if (!authReady) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">認証状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="運営画面はログイン後に利用できます"
        description="Google ログインを行うと、自分のSPOTを登録・編集できるようになります。"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="運営中のSPOTを取得できませんでした"
        description={`Firestore 接続でエラーが出ています: ${error}`}
      />
    );
  }

  if (!spots) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">運営中のSPOTを読み込み中です。</div>;
  }

  if (spots.length === 0) {
    return (
      <EmptyState
        title="まだ運営中のSPOTがありません"
        description="最初のSPOTを登録すると、この画面に自分の運営対象が表示されます。"
      />
    );
  }

  return (
    <section className="grid gap-5">
      {spots.map((spot) => (
        <article key={spot.id} className="panel px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="chip">{spot.category}</div>
              <h2 className="mt-3 text-2xl font-bold text-ink">{spot.name}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/68">{spot.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <StatusBadge tone={spot.isPublished ? "success" : "neutral"}>
                  {spot.isPublished ? "公開中" : "非公開"}
                </StatusBadge>
                <StatusBadge tone={spot.stripeConnectedAccountId ? "success" : "warning"}>
                  {spot.stripeConnectedAccountId ? "受取設定済み" : "受取設定中"}
                </StatusBadge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <MetricPill label="ソシオ" value={`${spot.socioCount}人`} />
              <MetricPill label="見込み" value={`¥${spot.socioCount * 100}`} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/owner/spots/${spot.id}/edit`} className="cta-secondary">
              SPOT情報を編集
            </Link>
            <ConnectOnboardingButton
              spotId={spot.id}
              connected={Boolean(spot.stripeConnectedAccountId)}
              className={spot.stripeConnectedAccountId ? "cta-secondary" : "cta-primary"}
              label={spot.stripeConnectedAccountId ? "受取設定を再開" : "受取設定を始める"}
            />
            <Link href={`/owner/spots/${spot.id}/payout`} className="cta-secondary">
              受取状況
            </Link>
            <Link href={`/owner/spots/${spot.id}/share`} className="cta-secondary">
              QR配布
            </Link>
            <Link href={`/spots/${spot.id}`} className="cta-primary">
              公開ページを見る
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
