"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { UserMembership } from "@/lib/types";

function getMembershipStatusLabel(status: UserMembership["status"]) {
  switch (status) {
    case "active":
      return "利用中";
    case "past_due":
      return "支払い確認待ち";
    case "canceled":
      return "解約済み";
    default:
      return status;
  }
}

function getMembershipTone(status: UserMembership["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "past_due":
      return "warning";
    case "canceled":
      return "neutral";
    default:
      return "neutral";
  }
}

export function AccountPageClient() {
  const { authReady, user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [loadingPortal, setLoadingPortal] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMemberships(null);
      return;
    }

    void listUserMemberships(user.uid)
      .then(setMemberships)
      .catch((cause: Error) => {
        setMembershipError(cause.message);
      });
  }, [user]);

  async function openPortal(spotId: string) {
    if (!user) {
      return;
    }

    setLoadingPortal(spotId);
    setPortalError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spotId })
      });

      const data = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? data.error ?? "設定画面を開けませんでした。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setPortalError(cause instanceof Error ? cause.message : "設定画面を開けませんでした。");
      setLoadingPortal(null);
    }
  }

  if (!authReady) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">読み込み中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="マイソシオはログイン後に利用できます"
        description="Google ログイン後に、所属中のSPOTと限定コンテンツにアクセスできます。"
      />
    );
  }

  if (membershipError) {
    return (
      <EmptyState
        title="所属情報を取得できませんでした"
        description={`membership 読み込みでエラーが出ています: ${membershipError}`}
      />
    );
  }

  if (!memberships) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">所属情報を読み込み中です。</div>;
  }

  const activeList = memberships.filter((m) => m.status !== "canceled");
  const canceledList = memberships.filter((m) => m.status === "canceled");
  const monthlyTotal = activeList.reduce((sum, m) => sum + m.planAmount, 0);

  if (memberships.length === 0) {
    return (
      <section className="panel px-6 py-8 sm:px-8">
        <EmptyState
          title="まだ所属中のSPOTはありません"
          description="SPOTを見つけて加入すると、限定ページやイベント情報にアクセスできるようになります。"
        />
        <div className="mt-6">
          <Link href="/spots" className="cta-primary">
            SPOTを探す
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* 月額サマリー */}
      {activeList.length > 0 ? (
        <section className="panel px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">MONTHLY</div>
              <div className="mt-1 text-3xl font-bold text-ink">¥{monthlyTotal.toLocaleString()}</div>
              <div className="mt-1 text-xs text-ink/50">月額合計</div>
            </div>
            <div className="h-10 w-px bg-ink/10" />
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">SPOTS</div>
              <div className="mt-1 text-3xl font-bold text-ink">{activeList.length}</div>
              <div className="mt-1 text-xs text-ink/50">所属中</div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 所属中のSPOT */}
      {activeList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="px-2 text-xs font-semibold tracking-[0.18em] text-ink/50">所属中のSPOT</h2>
          {activeList.map((membership) => (
            <article key={membership.spotId} className="panel px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-ink">{membership.spotName}</h3>
                    <StatusBadge tone={getMembershipTone(membership.status)}>
                      {getMembershipStatusLabel(membership.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <MetricPill label="プラン" value={`¥${membership.planAmount} / 月`} />
                    <MetricPill label="加入日" value={membership.joinedAt.slice(0, 10)} />
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-3">
                  <Link href={`/spots/${membership.spotId}/member`} className="cta-primary">
                    限定ページへ
                  </Link>
                  <Link href={`/spots/${membership.spotId}`} className="cta-secondary">
                    SPOT詳細
                  </Link>
                  <button
                    type="button"
                    className="cta-secondary"
                    onClick={() => void openPortal(membership.spotId)}
                    disabled={loadingPortal === membership.spotId}
                  >
                    {loadingPortal === membership.spotId
                      ? "移動中..."
                      : membership.status === "past_due"
                      ? "支払い方法を更新"
                      : "支払い管理"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {/* 過去の所属 */}
      {canceledList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="px-2 text-xs font-semibold tracking-[0.18em] text-ink/50">過去の所属</h2>
          {canceledList.map((membership) => (
            <article
              key={membership.spotId}
              className="rounded-[28px] border border-ink/8 bg-white/40 px-6 py-5 sm:px-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-ink/55">{membership.spotName}</h3>
                    <StatusBadge tone="neutral">解約済み</StatusBadge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <MetricPill label="プラン" value={`¥${membership.planAmount} / 月`} />
                    <MetricPill label="加入日" value={membership.joinedAt.slice(0, 10)} />
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-3">
                  <Link href={`/spots/${membership.spotId}/join`} className="cta-secondary">
                    再加入する
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {portalError ? (
        <p className="px-2 text-sm font-medium text-red-700">{portalError}</p>
      ) : null}
    </div>
  );
}
