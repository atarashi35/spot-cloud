"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SpotMembership } from "@/lib/types";

// ─── ユーティリティ ────────────────────────────────────────────────────

function toInitials(name: string | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function toRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}

// ─── イニシャルアバター ────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-[#355746] text-white",
  "bg-[#d8b067] text-white",
  "bg-[#7b9e87] text-white",
  "bg-[#4a7c6f] text-white",
  "bg-[#a87c4f] text-white",
];

function InitialAvatar({ name, index }: { name: string | undefined; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}
    >
      {toInitials(name)}
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────

type Props = {
  spotId: string;
  spotShareHref: string;
  spotPublicHref: string;
};

export function RecentSociosPanel({ spotId, spotShareHref, spotPublicHref }: Props) {
  const { user } = useAuth();
  const [recents, setRecents] = useState<SpotMembership[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    void user.getIdToken().then(async (token) => {
      try {
        const res = await fetch(`/api/spots/${spotId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { members?: SpotMembership[] };
        const active = (data.members ?? []).filter(
          (m) => m.status === "active" || m.status === "canceling"
        );
        // API は joinedAt desc で返るのでそのまま先頭 5 件
        setRecents(active.slice(0, 5));
      } catch {
        setRecents([]);
      } finally {
        setLoading(false);
      }
    });
  }, [user, spotId]);

  // ローディング
  if (loading) {
    return (
      <div className="mt-5 space-y-2">
        <div className="text-xs font-semibold tracking-[0.15em] text-ink/45">応援してくれている人</div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-9 animate-pulse rounded-full bg-mist" />
          ))}
        </div>
      </div>
    );
  }

  // 空状態
  if (!recents || recents.length === 0) {
    return (
      <div className="mt-5 rounded-[16px] border border-dashed border-ink/15 px-5 py-5">
        <div className="text-sm font-semibold text-ink/60">まだソシオがいません</div>
        <p className="mt-1 text-xs leading-6 text-ink/45">
          QRコードを共有して、最初のソシオを募集しましょう。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={spotShareHref} className="cta-secondary text-xs">
            QRチラシを見る
          </a>
          <a href={spotPublicHref} className="cta-secondary text-xs" target="_blank" rel="noopener noreferrer">
            公開ページを開く
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold tracking-[0.15em] text-ink/45">
        応援してくれている人
      </div>
      <p className="mt-0.5 text-[11px] text-ink/35">最近新しくソシオになった方</p>

      <div className="mt-3 space-y-2.5">
        {recents.map((m, i) => (
          <div key={m.uid} className="flex items-center gap-3">
            <InitialAvatar name={m.displayName} index={i} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink leading-none truncate">
                {m.displayName?.trim() || "ソシオ"}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink/45">
                {m.occupation ? <span>{m.occupation}</span> : null}
                <span>{toRelativeDate(m.joinedAt)}に参加</span>
                {m.status === "canceling" ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    解約予定
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 全員見るリンク */}
      <Link
        href={`/manage/${spotId}/socios`}
        className="mt-4 block text-xs font-semibold text-ink/40 underline-offset-2 hover:text-ink/70 transition-colors"
      >
        ソシオ全員を見る →
      </Link>
    </div>
  );
}
