"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Spot } from "@/lib/types";

type Filter = "all" | "published" | "unpublished" | "suspended" | "no_stripe";

export function AdminConsoleClient() {
  const { authReady, user } = useAuth();
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSpotId, setPendingSpotId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authReady) return;
    if (!user) { setSpots(null); return; }
    void loadSpots();
  }, [authReady, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSpots() {
    if (!user) return;
    try {
      setError(null);
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/spots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { spots?: Spot[]; error?: string };
      if (!res.ok || !data.spots) throw new Error(data.error ?? "admin_spots_load_failed");
      setSpots(data.spots);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "admin_spots_load_failed");
    }
  }

  async function updateSpotStatus(spotId: string, next: { isPublished?: boolean; isSuspended?: boolean }) {
    if (!user) return;
    try {
      setPendingSpotId(spotId);
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "admin_spot_update_failed");
      setSpots((cur) =>
        cur ? cur.map((s) => (s.id === spotId ? { ...s, ...next } : s)) : cur
      );
    } catch {
      // no-op
    } finally {
      setPendingSpotId(null);
    }
  }

  if (!authReady) return <div className="text-sm text-ink/72">管理権限を確認中です。</div>;
  if (!user) return <EmptyState title="ログインが必要です" description="管理者メールでログインしてください。" />;
  if (error === "forbidden") return <EmptyState title="管理権限がありません" description="ADMIN_EMAILS に登録されたメールでログインしてください。" />;
  if (error) return <EmptyState title="取得できませんでした" description={error} />;
  if (!spots) return <div className="text-sm text-ink/72">読み込み中です。</div>;

  const filtered = spots.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "published") return s.isPublished && !s.isSuspended;
    if (filter === "unpublished") return !s.isPublished && !s.isSuspended;
    if (filter === "suspended") return s.isSuspended;
    if (filter === "no_stripe") return !s.stripeConnectedAccountId;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `すべて (${spots.length})` },
    { key: "published", label: `公開中 (${spots.filter((s) => s.isPublished && !s.isSuspended).length})` },
    { key: "unpublished", label: `非公開 (${spots.filter((s) => !s.isPublished && !s.isSuspended).length})` },
    { key: "suspended", label: `停止中 (${spots.filter((s) => s.isSuspended).length})` },
    { key: "no_stripe", label: `Stripe未連携 (${spots.filter((s) => !s.stripeConnectedAccountId).length})` },
  ];

  return (
    <div className="space-y-4">
      {/* フィルタ・検索 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key ? "bg-ink text-white" : "bg-mist text-ink/68 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="SPOT名で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-ink/12 bg-white px-4 py-2 text-sm outline-none focus:border-ink/30 sm:w-56"
        />
      </div>

      {/* テーブル */}
      <div className="overflow-hidden rounded-[24px] border border-ink/8 bg-white">
        {/* ヘッダー */}
        <div className="hidden grid-cols-[2fr_1fr_60px_80px_100px_180px] gap-4 border-b border-ink/8 px-5 py-3 text-[13px] font-semibold tracking-wider text-ink/60 sm:grid">
          <span>SPOT名</span>
          <span>カテゴリ</span>
          <span className="text-center">ソシオ</span>
          <span className="text-center">Stripe</span>
          <span className="text-center">状態</span>
          <span className="text-right">操作</span>
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-ink/60">該当するSPOTがありません</div>
        )}

        {filtered.map((spot) => (
          <div
            key={spot.id}
            className="grid grid-cols-1 gap-2 border-b border-ink/6 px-5 py-4 last:border-0 sm:grid-cols-[2fr_1fr_60px_80px_100px_180px] sm:items-center sm:gap-4"
          >
            {/* SPOT名 */}
            <div>
              <p className="font-semibold text-ink">{spot.name}</p>
              <p className="text-xs text-ink/60">{spot.createdAt.slice(0, 10)} 登録</p>
            </div>

            {/* カテゴリ */}
            <span className="text-sm text-ink/75">{spot.category}</span>

            {/* ソシオ数 */}
            <div className="text-center">
              <span className="text-base font-bold text-ink">{spot.socioCount}</span>
              <span className="text-xs text-ink/60"> 人</span>
            </div>

            {/* Stripe */}
            <div className="flex justify-center">
              {spot.stripeConnectedAccountId ? (
                <StatusBadge tone="success">連携済</StatusBadge>
              ) : (
                <StatusBadge tone="neutral">未連携</StatusBadge>
              )}
            </div>

            {/* 公開状態 */}
            <div className="flex justify-center">
              {spot.isSuspended ? (
                <StatusBadge tone="danger">停止中</StatusBadge>
              ) : spot.isPublished ? (
                <StatusBadge tone="success">公開中</StatusBadge>
              ) : (
                <StatusBadge tone="neutral">非公開</StatusBadge>
              )}
            </div>

            {/* 操作 */}
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href={`/spots/${spot.id}`}
                target="_blank"
                className="flex items-center gap-1 rounded-full border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/72 transition hover:border-ink/30 hover:text-ink"
              >
                <ExternalLink className="h-3 w-3" />
                確認
              </Link>
              <button
                type="button"
                disabled={pendingSpotId === spot.id}
                onClick={() => updateSpotStatus(spot.id, { isPublished: !spot.isPublished })}
                className="rounded-full border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/72 transition hover:border-ink/30 hover:text-ink disabled:opacity-40"
              >
                {pendingSpotId === spot.id ? "…" : spot.isPublished ? "非公開" : "公開"}
              </button>
              {spot.isSuspended ? (
                <button
                  type="button"
                  disabled={pendingSpotId === spot.id}
                  onClick={() => updateSpotStatus(spot.id, { isSuspended: false, isPublished: true })}
                  className="rounded-full bg-moss px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80 disabled:opacity-40"
                >
                  {pendingSpotId === spot.id ? "…" : "停止解除"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pendingSpotId === spot.id}
                  onClick={() => updateSpotStatus(spot.id, { isSuspended: true, isPublished: false })}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80 disabled:opacity-40"
                >
                  {pendingSpotId === spot.id ? "…" : "停止"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
