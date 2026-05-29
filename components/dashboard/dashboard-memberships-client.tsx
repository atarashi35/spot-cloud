"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
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

export function DashboardMembershipsClient() {
  const { authReady, user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [loadingPortalSpotId, setLoadingPortalSpotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMemberships(null);
      return;
    }

    void listUserMemberships(user.uid)
      .then((items) => {
        setMemberships(items);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      });
  }, [user]);

  async function openPortal(spotId: string) {
    if (!user) {
      return;
    }

    setLoadingPortalSpotId(spotId);
    setError(null);

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
        throw new Error(data.message ?? data.error ?? "Billing Portal を開けませんでした。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Billing Portal を開けませんでした。");
      setLoadingPortalSpotId(null);
    }
  }

  if (!authReady) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">認証状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="所属中のSPOTはログイン後に利用できます"
        description="Google ログイン後に、自分が所属しているSPOTとプラン状況を確認できます。"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="所属情報を取得できませんでした"
        description={`membership 読み込みでエラーが出ています: ${error}`}
      />
    );
  }

  if (!memberships) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">所属情報を読み込み中です。</div>;
  }

  if (memberships.length === 0) {
    return (
      <EmptyState
        title="まだ所属中のSPOTはありません"
        description="SPOT詳細ページから 100円 / 300円 / 500円 の固定プランで加入すると、ここに表示されます。"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {memberships.map((membership) => (
        <article
          key={membership.spotId}
          className="rounded-[28px] border border-ink/10 bg-mist p-5 sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="text-xl font-bold text-ink">{membership.spotName}</h2>
            <p className="mt-2 text-sm text-ink/68">
              加入プラン: ¥{membership.planAmount} / 加入日: {membership.joinedAt.slice(0, 10)} / 状態: {getMembershipStatusLabel(membership.status)}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
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
                onClick={() => openPortal(membership.spotId)}
                disabled={loadingPortalSpotId === membership.spotId}
              >
                {loadingPortalSpotId === membership.spotId
                  ? "移動中..."
                  : membership.status === "past_due"
                    ? "支払いを更新"
                    : "解約リンク"}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
