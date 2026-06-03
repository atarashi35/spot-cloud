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

type StatusTone = "success" | "warning" | "danger";

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

function getPayoutSummary(input: {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  hasExternalAccount: boolean;
  disabledReasonLabel: string | null;
}) {
  const {
    connected,
    onboardingComplete,
    chargesEnabled,
    payoutsEnabled,
    hasExternalAccount,
    disabledReasonLabel
  } = input;

  if (connected && onboardingComplete && chargesEnabled && payoutsEnabled) {
    return {
      badgeTone: "success" as const,
      badgeLabel: "利用可能",
      title: "受取設定は完了しています",
      description: "ソシオ募集を本番運用できる状態です。会費の受け取りと振込の両方が利用できます。",
      actionTitle: "現在の状況",
      actionMessage: "追加の操作は不要です。必要なときだけ Stripe 側の設定を見直してください。",
      primaryCta: null
    };
  }

  if (connected && onboardingComplete && !chargesEnabled && payoutsEnabled) {
    return {
      badgeTone: "warning" as const,
      badgeLabel: "審査中",
      title: "会費の受け取りはまだ開始できません",
      description: "本人確認と振込口座の登録は完了しています。現在は Stripe 側の審査により、会費の受け取りのみ一時停止中です。",
      actionTitle: "次の対応",
      actionMessage: disabledReasonLabel ?? "Stripe 側の審査完了を待ってください。審査中は新しいソシオ決済を受け付けられません。",
      primaryCta: null
    };
  }

  if (connected && onboardingComplete && chargesEnabled && !payoutsEnabled) {
    return {
      badgeTone: "warning" as const,
      badgeLabel: "要確認",
      title: "振込口座の利用準備がまだ完了していません",
      description: "会費の受け取りは利用できますが、登録口座への振込はまだ有効になっていません。",
      actionTitle: "次の対応",
      actionMessage:
        !hasExternalAccount
          ? "Stripe Connect で受取口座の登録まで完了してください。"
          : disabledReasonLabel ?? "Stripe 側で振込設定の確認が必要です。",
      primaryCta: "受取設定を再開する"
    };
  }

  if (!connected) {
    return {
      badgeTone: "danger" as const,
      badgeLabel: "未設定",
      title: "受取設定がまだ始まっていません",
      description: "ソシオ募集を本番で始めるには、Stripe Connect の設定が必要です。",
      actionTitle: "次の対応",
      actionMessage: "まずは Stripe で本人確認と受取口座の登録を行ってください。",
      primaryCta: "受取設定を始める"
    };
  }

  return {
    badgeTone: "warning" as const,
    badgeLabel: "設定中",
    title: "受取設定はまだ完了していません",
    description: "まだ本番運用に必要な設定が残っています。現在の不足項目を確認して進めてください。",
    actionTitle: "次の対応",
    actionMessage:
      !hasExternalAccount
        ? "Stripe Connect で本人確認と受取口座の登録を完了してください。"
        : disabledReasonLabel ?? "Stripe Connect で追加情報の入力または確認を完了してください。",
    primaryCta: "受取設定を再開する"
  };
}

function getStepStatus(input: {
  ready: boolean;
  inReview: boolean;
  done: boolean;
}): { label: string; tone: StatusTone } {
  if (input.ready) {
    return { label: "利用可能", tone: "success" };
  }
  if (input.inReview) {
    return { label: "審査中", tone: "warning" };
  }
  if (input.done) {
    return { label: "完了", tone: "success" };
  }
  return { label: "未設定", tone: "danger" };
}

function getStepCardClass(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "border-moss/20 bg-moss/5";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "danger":
      return "border-red-200 bg-red-50";
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
  const inReview = connectStatus?.disabledReason === "under_review" || connectStatus?.disabledReason === "requirements.pending_verification";
  const summary = getPayoutSummary({
    connected,
    onboardingComplete,
    chargesEnabled,
    payoutsEnabled,
    hasExternalAccount: Boolean(connectStatus?.hasExternalAccount),
    disabledReasonLabel
  });
  const verificationStep = getStepStatus({
    ready: onboardingComplete,
    inReview: false,
    done: onboardingComplete
  });
  const chargeStep = getStepStatus({
    ready: chargesEnabled,
    inReview: !chargesEnabled && inReview,
    done: false
  });
  const payoutStep = getStepStatus({
    ready: payoutsEnabled,
    inReview: !payoutsEnabled && inReview,
    done: false
  });

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-[28px] border border-ink/10 bg-white px-5 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.18em] text-ink/42">CURRENT STATUS</div>
            <h2 className="mt-2 text-3xl font-bold text-ink">{summary.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/68">{summary.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusBadge tone={summary.badgeTone}>
              {summary.badgeLabel}
            </StatusBadge>
          </div>
        </div>
        {notice ? (
          <div className="mt-4 rounded-[20px] bg-mist px-4 py-4 text-sm leading-7 text-ink/70">
            {notice}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className={`rounded-[28px] border px-5 py-5 ${getStepCardClass(verificationStep.tone)}`}>
          <div className="text-sm text-ink/55">本人確認</div>
          <div className="mt-2 text-2xl font-bold text-ink">{verificationStep.label}</div>
        </article>

        <article className={`rounded-[28px] border px-5 py-5 ${getStepCardClass(chargeStep.tone)}`}>
          <div className="text-sm text-ink/55">会費の受け取り</div>
          <div className="mt-2 text-2xl font-bold text-ink">{chargeStep.label}</div>
          <p className="mt-3 text-sm leading-7 text-ink/62">
            {chargesEnabled
              ? "新しいソシオ決済を受け付けられます。"
              : "新しいソシオ決済はまだ受け付けられません。"}
          </p>
        </article>

        <article className={`rounded-[28px] border px-5 py-5 ${getStepCardClass(payoutStep.tone)}`}>
          <div className="text-sm text-ink/55">振込口座</div>
          <div className="mt-2 text-2xl font-bold text-ink">{payoutStep.label}</div>
          <p className="mt-3 text-sm leading-7 text-ink/62">
            {payoutsEnabled
              ? "Stripe 残高があれば登録口座へ振り込めます。"
              : "登録口座への振込はまだ利用できません。"}
          </p>
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
        <h3 className="text-xl font-bold text-ink">{summary.actionTitle}</h3>
        {ready ? (
          <div className="mt-4 space-y-3 text-sm text-ink/68">
            <p>{summary.actionMessage}</p>
            <p className="rounded-[20px] bg-mist px-4 py-3 break-all">
              account id: {connectStatus?.accountId ?? spot.stripeConnectedAccountId}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-ink/68">
            <p>{summary.actionMessage}</p>
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
          {summary.primaryCta ? (
            <ConnectOnboardingButton spotId={spotId} connected={connected} label={summary.primaryCta} />
          ) : null}
          <button type="button" className="cta-secondary" onClick={() => void loadStatus()} disabled={statusLoading}>
            {statusLoading ? "確認中..." : "状態を再確認"}
          </button>
          <Link href={`/owner/spots/${spot.id}/edit`} className="cta-secondary">
            SPOT情報編集へ
          </Link>
          <Link href={`/owner/spots/${spot.id}/share`} className="cta-secondary">
            QR
          </Link>
          <Link href="/manage" className="cta-secondary">
            運営するSPOT
          </Link>
        </div>
      </section>
    </div>
  );
}
