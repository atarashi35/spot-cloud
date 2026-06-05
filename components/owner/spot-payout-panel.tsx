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
  transfersEnabled: boolean;
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

type StepState = "done" | "active" | "pending" | "review";

function StepCard({
  number,
  label,
  description,
  state,
  note
}: {
  number: number;
  label: string;
  description: string;
  state: StepState;
  note?: string | null;
}) {
  const stateConfig: Record<StepState, { badge: string; badgeClass: string; cardClass: string }> = {
    done: {
      badge: "完了",
      badgeClass: "bg-moss/10 text-moss",
      cardClass: "border-moss/20 bg-moss/5"
    },
    active: {
      badge: "要対応",
      badgeClass: "bg-red-50 text-red-700",
      cardClass: "border-red-200 bg-red-50/50"
    },
    review: {
      badge: "審査中",
      badgeClass: "bg-amber-50 text-amber-700",
      cardClass: "border-amber-200 bg-amber-50"
    },
    pending: {
      badge: "未対応",
      badgeClass: "bg-ink/5 text-ink/40",
      cardClass: "border-ink/10 bg-white"
    }
  };

  const config = stateConfig[state];

  return (
    <article className={`rounded-[24px] border px-5 py-5 ${config.cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            state === "done" ? "bg-moss text-white" : "bg-ink/8 text-ink/40"
          }`}>
            {state === "done" ? "✓" : number}
          </span>
          <span className="text-sm font-semibold text-ink">{label}</span>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}>
          {config.badge}
        </span>
      </div>
      <p className="mt-3 pl-10 text-sm leading-6 text-ink/60">{description}</p>
      {note ? (
        <p className="mt-2 pl-10 text-xs leading-5 text-ink/45">{note}</p>
      ) : null}
    </article>
  );
}

export function SpotPayoutPanel({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const searchParams = useSearchParams();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnedFromStripe, setReturnedFromStripe] = useState(false);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { setLoading(false); return; }

    void getSpotFromFirestore(spotId)
      .then((nextSpot) => {
        if (!nextSpot) { setError("SPOT が見つかりません。"); return; }
        if (nextSpot.ownerUid !== user.uid) { setError("この画面は運営者のみ利用できます。"); return; }
        setSpot(nextSpot);
      })
      .catch((cause: Error) => { setError(cause.message); })
      .finally(() => { setLoading(false); });
  }, [authReady, spotId, user]);

  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (connectParam === "return" || connectParam === "refresh") {
      setReturnedFromStripe(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user || !spot) return;
    void loadStatus();
  }, [spot, user]);

  // Stripe から戻ったときは自動で再取得
  useEffect(() => {
    if (returnedFromStripe && user && spot) {
      void loadStatus();
    }
  }, [returnedFromStripe, user, spot]);

  async function loadStatus() {
    if (!user) return;
    setStatusLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/connect/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ spotId })
      });

      const data = (await response.json()) as ConnectStatus & { error?: string; message?: string };
      if (!response.ok) throw new Error(data.message ?? data.error ?? "connect_status_error");
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

  if (error && !spot) {
    return (
      <EmptyState
        title="受取設定を開けませんでした"
        description={error ?? "SPOT の取得で問題が発生しました。"}
      />
    );
  }

  if (!spot) return null;

  const connected = Boolean(connectStatus?.connected || spot.stripeConnectedAccountId);
  const onboardingComplete = Boolean(connectStatus?.onboardingComplete);
  const transfersEnabled = Boolean(connectStatus?.transfersEnabled);
  const payoutsEnabled = Boolean(connectStatus?.payoutsEnabled);
  const ready = connected && onboardingComplete && transfersEnabled && payoutsEnabled;
  const disabledReasonLabel = getDisabledReasonLabel(connectStatus?.disabledReason ?? null);
  const inReview = connectStatus?.disabledReason === "under_review" || connectStatus?.disabledReason === "requirements.pending_verification";

  // ステップ1: 本人確認
  const step1State: StepState = onboardingComplete ? "done" : connected ? "active" : "active";

  // ステップ2: 売上受取
  const step2State: StepState = transfersEnabled
    ? "done"
    : inReview
    ? "review"
    : onboardingComplete
    ? "active"
    : "pending";

  // ステップ3: 振込口座
  const step3State: StepState = payoutsEnabled
    ? "done"
    : transfersEnabled
    ? "active"
    : "pending";

  // CTA ラベル
  const primaryCta = !connected
    ? "Stripe で本人確認を始める"
    : !onboardingComplete
    ? "本人確認を再開する"
    : !payoutsEnabled && !connectStatus?.hasExternalAccount
    ? "振込口座を登録する"
    : "Stripe 設定を確認する";

  const showCta = !ready && !inReview;

  return (
    <div className="mt-8 space-y-5">

      {/* ステータスヘッダー */}
      <section className="rounded-[28px] border border-ink/10 bg-white px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-ink/40">CURRENT STATUS</p>
            {ready ? (
              <h2 className="mt-2 text-2xl font-bold text-ink">受取準備が整っています</h2>
            ) : inReview ? (
              <h2 className="mt-2 text-2xl font-bold text-ink">Stripe の審査中です</h2>
            ) : !connected ? (
              <h2 className="mt-2 text-2xl font-bold text-ink">受取先をまだ登録していません</h2>
            ) : (
              <h2 className="mt-2 text-2xl font-bold text-ink">設定の続きがあります</h2>
            )}
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/60">
              {ready
                ? "ソシオ募集を開始できます。会費はプラットフォームが決済し、売上は登録口座へ振り込まれます。"
                : inReview
                ? "本人確認の審査が行われています。通常 3〜4 営業日で完了します。"
                : !connected
                ? "ソシオ募集を始めるには、Stripe で本人確認と振込口座の登録が必要です。"
                : "以下のステップを完了してソシオ募集を開始しましょう。"}
            </p>
          </div>
          <StatusBadge tone={ready ? "success" : inReview ? "warning" : "danger"}>
            {ready ? "受取準備完了" : inReview ? "審査中" : !connected ? "未設定" : "設定中"}
          </StatusBadge>
        </div>

        {returnedFromStripe && !ready ? (
          <div className="mt-4 rounded-[16px] bg-mist px-4 py-3 text-sm text-ink/70">
            Stripe から戻りました。設定状況を更新しています…
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      {/* ステップ一覧 */}
      <section className="space-y-3">
        <StepCard
          number={1}
          label="本人確認"
          description="Stripe で氏名・住所・生年月日などを登録します。一度完了すれば再登録は不要です。"
          state={step1State}
        />
        <StepCard
          number={2}
          label="売上受取の有効化"
          description="プラットフォームからの売上振替を受け取るための設定です。本人確認完了後に自動で有効になります。"
          state={step2State}
          note={step2State === "review" ? "Stripe の審査完了まで通常 3〜4 営業日かかります。" : null}
        />
        <StepCard
          number={3}
          label="振込口座の登録"
          description="売上を受け取る銀行口座を登録します。Stripe Connect の設定画面から登録できます。"
          state={step3State}
          note={step3State === "active" && !connectStatus?.hasExternalAccount ? "口座がまだ登録されていません。" : null}
        />
      </section>

      {/* アクションエリア */}
      <section className="rounded-[28px] border border-ink/10 bg-white px-6 py-6">
        {ready ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">ソシオ募集を開始できます</p>
            <p className="text-sm leading-7 text-ink/60">
              追加の操作は不要です。SPOT の公開設定を確認してソシオを募集しましょう。
            </p>
          </div>
        ) : disabledReasonLabel ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Stripe からの通知</p>
            <p className="text-sm leading-6 text-ink/60">{disabledReasonLabel}</p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {showCta ? (
            <ConnectOnboardingButton spotId={spotId} connected={connected} label={primaryCta} />
          ) : null}
          <button
            type="button"
            className="cta-secondary"
            onClick={() => void loadStatus()}
            disabled={statusLoading}
          >
            {statusLoading ? "確認中…" : "状態を更新"}
          </button>
          <Link href={`/owner/spots/${spot.id}/edit`} className="cta-secondary">
            SPOT を編集
          </Link>
          <Link href="/manage" className="cta-secondary text-ink/50">
            運営する SPOT へ
          </Link>
        </div>
      </section>
    </div>
  );
}
