"use client";

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

type ExistingAccount = {
  spotId: string;
  spotName: string;
  accountId: string;
};

function getDisabledReasonLabel(reason: string | null) {
  switch (reason) {
    case "requirements.past_due":
      return "本人確認や口座登録で未完了の項目があります。";
    case "requirements.pending_verification":
      return "確認中の項目があります。審査完了まで少しお待ちください。";
    case "under_review":
      return "審査中です。完了まで待つ必要があります。";
    case "listed":
      return "追加確認が必要な状態です。登録内容の案内をご確認ください。";
    case "rejected.fraud":
    case "rejected.listed":
    case "rejected.terms_of_service":
      return "受取設定が停止されています。登録内容の案内確認が必要です。";
    default:
      return null;
  }
}

type StepState = "done" | "active" | "pending" | "review";

export function SpotPayoutPanel({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const searchParams = useSearchParams();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnedFromStripe, setReturnedFromStripe] = useState(false);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [existingAccounts, setExistingAccounts] = useState<ExistingAccount[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);

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

  // connected でない場合のみ既存口座を取得
  useEffect(() => {
    if (!user || !spot || spot.stripeConnectedAccountId) return;
    void loadExistingAccounts();
  }, [spot, user]);

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

  async function loadExistingAccounts() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/connect/existing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ spotId })
      });
      const data = (await response.json()) as { accounts?: ExistingAccount[] };
      setExistingAccounts(data.accounts ?? []);
    } catch {
      // 取得失敗は無視（新規登録フローを表示）
    }
  }

  async function linkAccount(accountId: string) {
    if (!user) return;
    setLinkLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/connect/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ spotId, accountId })
      });
      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(data.message ?? data.error ?? "link_error");
      // 紐づけ完了 → status を再取得
      await loadStatus();
      setExistingAccounts([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "口座の紐づけに失敗しました。");
    } finally {
      setLinkLoading(false);
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
    ? "口座登録・本人確認を始める"
    : !onboardingComplete
    ? "登録の続きをする"
    : !payoutsEnabled && !connectStatus?.hasExternalAccount
    ? "振込口座を登録する"
    : "登録内容を確認する";

  const showCta = !ready && !inReview;

  return (
    <div className="mt-8">
      <section className="rounded-[28px] border border-ink/10 bg-white px-6 py-5 space-y-4">

        {/* ステータス行 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusBadge tone={ready ? "success" : inReview ? "warning" : "danger"}>
              {ready ? "受取準備完了" : inReview ? "審査中" : !connected ? "未設定" : "設定中"}
            </StatusBadge>
            <p className="text-sm font-semibold text-ink">
              {ready ? "サポーター募集を開始できます" : inReview ? "審査中です（3〜4営業日）" : !connected ? "口座登録がまだです" : "設定の続きがあります"}
            </p>
          </div>
          {showCta && (
            <ConnectOnboardingButton spotId={spotId} connected={connected} label={primaryCta} className="cta-primary shrink-0 text-sm" />
          )}
        </div>

        {/* ステップ */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { number: 1, label: "本人確認",  state: step1State, note: null },
            { number: 2, label: "売上受取",  state: step2State, note: step2State === "review" ? "審査中（3〜4営業日）" : null },
            { number: 3, label: "振込口座",  state: step3State, note: step3State === "active" && !connectStatus?.hasExternalAccount ? "口座未登録" : null },
          ] as const).map(({ number, label, state, note }) => {
            const cfg = {
              done:    { badge: "完了",   badgeClass: "bg-moss/10 text-moss",        card: "border-moss/20 bg-moss/5" },
              active:  { badge: "要対応", badgeClass: "bg-red-50 text-red-700",      card: "border-red-200 bg-red-50/50" },
              review:  { badge: "審査中", badgeClass: "bg-amber-50 text-amber-700",  card: "border-amber-200 bg-amber-50" },
              pending: { badge: "未対応", badgeClass: "bg-ink/5 text-ink/40",        card: "border-ink/10 bg-mist" },
            }[state];
            return (
              <div key={number} className={`rounded-[16px] border px-4 py-3 ${cfg.card}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${state === "done" ? "bg-moss text-white" : "bg-ink/8 text-ink/40"}`}>
                    {state === "done" ? "✓" : number}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badgeClass}`}>{cfg.badge}</span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-ink">{label}</p>
                {note && <p className="mt-0.5 text-[10px] text-ink/45">{note}</p>}
              </div>
            );
          })}
        </div>

        {/* エラー・通知 */}
        {error && (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
        )}
        {disabledReasonLabel && !error && (
          <p className="text-xs text-ink/55">{disabledReasonLabel}</p>
        )}
        {existingAccounts.length > 0 && !connected && (
          <div className="rounded-[16px] border border-moss/20 bg-moss/5 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-ink">他のSPOTの登録済み口座を使う</p>
            {existingAccounts.map((acc) => (
              <div key={acc.accountId} className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink/60 truncate">{acc.spotName}</p>
                <button type="button" className="cta-primary shrink-0 text-xs" onClick={() => void linkAccount(acc.accountId)} disabled={linkLoading}>
                  {linkLoading ? "設定中…" : "この口座を使う"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* サブアクション */}
        <div className="flex items-center gap-2 pt-1">
          <button type="button" className="cta-secondary text-sm" onClick={() => void loadStatus()} disabled={statusLoading}>
            {statusLoading ? "確認中…" : "状態を更新"}
          </button>
        </div>
      </section>
    </div>
  );
}
