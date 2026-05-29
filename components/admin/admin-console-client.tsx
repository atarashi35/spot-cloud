"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { Spot } from "@/lib/types";

export function AdminConsoleClient() {
  const { authReady, user } = useAuth();
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSpotId, setPendingSpotId] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      setSpots(null);
      return;
    }

    void loadSpots();
  }, [authReady, user]);

  async function loadSpots() {
    if (!user) {
      return;
    }

    try {
      setError(null);
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/spots", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = (await response.json()) as { spots?: Spot[]; error?: string };

      if (!response.ok || !data.spots) {
        throw new Error(data.error ?? "admin_spots_load_failed");
      }

      setSpots(data.spots);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "admin_spots_load_failed");
    }
  }

  async function updateSpotStatus(spotId: string, next: { isPublished?: boolean; isSuspended?: boolean }) {
    if (!user) {
      return;
    }

    try {
      setPendingSpotId(spotId);
      setError(null);
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/spots/${spotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(next)
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "admin_spot_update_failed");
      }

      setSpots((current) =>
        current
          ? current.map((spot) => (spot.id === spotId ? { ...spot, ...next } : spot))
          : current
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "admin_spot_update_failed");
    } finally {
      setPendingSpotId(null);
    }
  }

  if (!authReady) {
    return <div className="text-sm text-ink/60">管理権限を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="管理画面はログイン後に利用できます"
        description="管理者メールで Google ログインした状態で開いてください。"
      />
    );
  }

  if (error === "forbidden") {
    return (
      <EmptyState
        title="このアカウントには管理権限がありません"
        description="ADMIN_EMAILS に登録されたメールアドレスでログインしてください。"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="管理データを取得できませんでした"
        description={`admin API の応答でエラーが出ています: ${error}`}
      />
    );
  }

  if (!spots) {
    return <div className="text-sm text-ink/60">全 SPOT を読み込み中です。</div>;
  }

  return (
    <div className="space-y-4">
      {spots.map((spot) => (
        <article
          key={spot.id}
          className="rounded-[28px] border border-ink/10 bg-mist p-5 sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.18em] text-ink/55">
              <span>{spot.category}</span>
              {spot.isSuspended ? <span>停止中</span> : null}
              <span>{spot.isPublished ? "公開中" : "非公開"}</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-ink">{spot.name}</h2>
            <p className="mt-2 text-sm leading-7 text-ink/68">
              ownerUid: {spot.ownerUid} / socio: {spot.socioCount} / 更新日: {spot.updatedAt.slice(0, 10)}
            </p>
            <p className="mt-2 text-sm text-ink/60">{spot.shortDescription}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
            <Link href={`/spots/${spot.id}`} className="cta-secondary">
              詳細確認
            </Link>
            <button
              type="button"
              className="cta-secondary"
              disabled={pendingSpotId === spot.id}
              onClick={() => updateSpotStatus(spot.id, { isPublished: !spot.isPublished })}
            >
              {pendingSpotId === spot.id
                ? "更新中..."
                : spot.isPublished
                  ? "非公開にする"
                  : "公開する"}
            </button>
            {spot.isSuspended ? (
              <button
                type="button"
                className="cta-primary"
                disabled={pendingSpotId === spot.id}
                onClick={() => updateSpotStatus(spot.id, { isSuspended: false, isPublished: true })}
              >
                {pendingSpotId === spot.id ? "再開中..." : "停止解除"}
              </button>
            ) : (
              <button
                type="button"
                className="cta-primary"
                disabled={pendingSpotId === spot.id}
                onClick={() => updateSpotStatus(spot.id, { isSuspended: true, isPublished: false })}
              >
                {pendingSpotId === spot.id ? "停止中..." : "公開停止"}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
