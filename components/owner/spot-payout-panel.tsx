"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectOnboardingButton } from "@/components/owner/connect-onboarding-button";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

type ConnectStatus = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
  requirementsDue: string[];
  disabledReason: string | null;
  hasExternalAccount: boolean;
};

function getDisabledReasonLabel(reason: string | null) {
  switch (reason) {
    case "requirements.past_due":
      return "本人確認や口座登録で未完了の項目があります。";
    case "requirements.pending_verification":
      return "Stripe 側で確認中の項目があります。審査完了まで少し待つ必要があります。";
    case "under_review":
      return "Stripe 側の審査中です。完了まで待つ必要があります。";
    case "listed":
      return "Stripe 側で追加確認が必要な状態です。ダッシュボードの案内を確認してください。";
    case "rejected.fraud":
    case "rejected.listed":
    case "rejected.terms_of_service":
      return "Stripe 側で受取設定が停止されています。ダッシュボードの案内確認が必要です。";
    default:
      return null;
  }
}

export function SpotPayoutPanel({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const searchParams = useSearchParams();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    void getSpotFromFirestore(spotId)
      .then((nextSpot) => {
        if (!nextSpot) {
          setError("SPOT が見つかりません。");
          return;
        }

        if (nextSpot.ownerUid !== user.uid) {
          setError("この画面は運営者のみ利用できます。");
          return;
        }

        setSpot(nextSpot);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authReady, spotId, user]);

  useEffect(() => {
    const connectParam = searchParams.get("connect");

    if (connectParam === "return") {
      setNotice("Stripe Connect から戻りました。設定状況を再確認してください。");
    }

    if (connectParam === "refresh") {
      setNotice("入力が完了していないため、受取設定を再開できます。");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user || !spot) {
      return;
    }

    void loadStatus();
  }, [spot, user]);

  async function loadStatus() {
    if (!user) {
      return;
    }

    setStatusLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/connect/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spotId })
      });

      const data = (await response.json()) as ConnectStatus & { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? "connect_status_error");
      }

      setConnectStatus(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connect 状態を取得できませんでした。");
    } finally {
      setStatusLoading(false);
    }
  }

  if (!authReady || loading) {
    return <div className="mt-8 text-sm text-ink/60">受取設定の状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="受取設定はログイン後に利用できます"
        description="Google ログインした状態で、自分の SPOT の受取設定を進めてください。"
      />
    );
  }

  if (error || !spot) {
    return (
      <EmptyState
        title="受取設定を開けませんでした"
        description={error ?? "SPOT の取得で問題が発生しました。"}
      />
    );
  }

  const connected = Boolean(connectStatus?.connected || spot.stripeConnectedAccountId);
  const onboardingComplete = Boolean(connectStatus?.onboardingComplete);
  const chargesEnabled = Boolean(connectStatus?.chargesEnabled);
  const payoutsEnabled = Boolean(connectStatus?.payoutsEnabled);
  const ready = connected && onboardingComplete && chargesEnabled && payoutsEnabled;
  const disabledReasonLabel = getDisabledReasonLabel(connectStatus?.disabledReason ?? null);

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-[28px] bg-mist px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">{spot.name}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusBadge tone={ready ? "success" : connected ? "warning" : "neutral"}>
              {ready ? "設定完了" : connected ? "設定途中" : "未設定"}
            </StatusBadge>
          </div>
        </div>
        {notice ? (
          <div className="mt-4 rounded-[20px] bg-white px-4 py-4 text-sm leading-7 text-ink/70">
            {notice}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-[28px] border border-ink/10 bg-white px-5 py-5">
          <div className="text-sm text-ink/55">本人確認</div>
          <div className="mt-2 text-2xl font-bold text-ink">{onboardingComplete ? "完了" : "未完了"}</div>
        </article>

        <article className="rounded-[28px] border border-ink/10 bg-white px-5 py-5">
          <div className="text-sm text-ink/55">課金受付</div>
          <div className="mt-2 text-2xl font-bold text-ink">{chargesEnabled ? "有効" : "未有効"}</div>
        </article>

        <article className="rounded-[28px] border border-ink/10 bg-white px-5 py-5">
          <div className="text-sm text-ink/55">振込受取</div>
          <div className="mt-2 text-2xl font-bold text-ink">{payoutsEnabled ? "有効" : "未有効"}</div>
          {!payoutsEnabled ? (
            <div className="mt-4 rounded-[20px] bg-mist px-4 py-3 text-sm text-ink/68">
              {!connectStatus?.hasExternalAccount
                ? "受取口座がまだ Stripe に登録されていない可能性があります。"
                : disabledReasonLabel ?? "Stripe 側の確認や口座設定がまだ完了していない可能性があります。"}
            </div>
          ) : null}
        </article>
      </section>

      <section className="rounded-[28px] border border-ink/10 bg-white px-5 py-5">
        <h3 className="text-xl font-bold text-ink">次の対応</h3>
        {ready ? (
          <div className="mt-4 space-y-3 text-sm text-ink/68">
            <p>受取設定は完了しています。</p>
            <p className="rounded-[20px] bg-mist px-4 py-3 break-all">
              account id: {connectStatus?.accountId ?? spot.stripeConnectedAccountId}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-ink/68">
            <p>Stripe 側の入力を再開して、3つの状態がすべて有効になるまで進めてください。</p>
            {!connectStatus?.hasExternalAccount ? (
              <div className="rounded-[20px] bg-mist px-4 py-3">
                受取口座が未登録の可能性があります。Stripe Connect の設定画面で銀行口座の登録まで完了してください。
              </div>
            ) : null}
            {disabledReasonLabel ? (
              <div className="rounded-[20px] bg-mist px-4 py-3">
                Stripe の状態: {disabledReasonLabel}
              </div>
            ) : null}
            {connectStatus?.requirementsDue?.length ? (
              <div className="rounded-[20px] bg-mist px-4 py-3">
                未完了項目: {connectStatus.requirementsDue.join(", ")}
              </div>
            ) : null}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <ConnectOnboardingButton spotId={spotId} connected={connected} />
          <button type="button" className="cta-secondary" onClick={() => void loadStatus()} disabled={statusLoading}>
            {statusLoading ? "確認中..." : "状態を再確認"}
          </button>
          <Link href={`/owner/spots/${spot.id}/edit`} className="cta-secondary">
            SPOT情報編集へ
          </Link>
          <Link href={`/owner/spots/${spot.id}/share`} className="cta-secondary">
            QR配布へ
          </Link>
        </div>
      </section>
    </div>
  );
}
