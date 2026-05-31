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

function getLoginMethodLabel(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  if (hasGoogle && hasPassword) {
    return "Google / メール";
  }

  if (hasGoogle) {
    return "Google";
  }

  if (hasPassword) {
    return "メール";
  }

  return "未設定";
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
        title="マイアカウントはログイン後に利用できます"
        description="Google ログイン後に、アカウント情報と所属中のSPOTを確認できます。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">ACCOUNT</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">アカウント情報</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricPill label="名前" value={user.displayName ?? "未設定"} />
          <MetricPill label="メール" value={user.email ?? "未設定"} />
          <MetricPill label="ログイン方法" value={getLoginMethodLabel(user)} />
        </div>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">SOCIO</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">所属中のSPOT</h2>

        {membershipError ? (
          <div className="mt-6">
            <EmptyState
              title="所属情報を取得できませんでした"
              description={`membership 読み込みでエラーが出ています: ${membershipError}`}
            />
          </div>
        ) : !memberships ? (
          <div className="mt-6 text-sm text-ink/60">所属情報を読み込み中です。</div>
        ) : memberships.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="まだ所属中のSPOTはありません"
              description="SPOT詳細ページから 100円 / 300円 / 500円 の固定プランで加入すると、ここに表示されます。"
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {memberships.map((membership) => (
              <article
                key={membership.spotId}
                className="rounded-[28px] border border-ink/10 bg-mist p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-ink">{membership.spotName}</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <MetricPill label="プラン" value={`¥${membership.planAmount}`} />
                      <MetricPill label="加入日" value={membership.joinedAt.slice(0, 10)} />
                      <StatusBadge tone={getMembershipTone(membership.status)}>
                        {getMembershipStatusLabel(membership.status)}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap gap-3">
                    <Link href={`/spots/${membership.spotId}`} className="cta-secondary">
                      SPOT詳細へ
                    </Link>
                    {membership.status === "canceled" ? (
                      <Link href={`/spots/${membership.spotId}`} className="cta-primary">
                        再加入する
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="cta-primary"
                        onClick={() => void openPortal(membership.spotId)}
                        disabled={loadingPortal === membership.spotId}
                      >
                        {loadingPortal === membership.spotId
                          ? "移動中..."
                          : membership.status === "past_due"
                          ? "支払い方法を更新"
                          : "支払い管理"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {portalError ? (
          <p className="mt-4 text-sm font-medium text-red-700">{portalError}</p>
        ) : null}
      </section>
    </div>
  );
}
