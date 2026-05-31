"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { listSpotPostsFromFirestore } from "@/lib/firestore/posts";
import { UserMembership } from "@/lib/types";

// ─── 型 ───────────────────────────────────────────────────────────────

type SpotPreview = {
  latestPost: { id: string; title: string; publishDate: string } | null;
  nextEvent: { id: string; title: string; startAt: string; location?: string } | null;
  nextBillingDate: string | null;
};

type UpcomingEvent = {
  spotId: string;
  spotName: string;
  eventId: string;
  title: string;
  startAt: string;
  location?: string;
};

// ─── ユーティリティ ────────────────────────────────────────────────────

function getMembershipStatusLabel(status: UserMembership["status"]) {
  switch (status) {
    case "active":    return "利用中";
    case "past_due":  return "支払い確認待ち";
    case "canceled":  return "解約済み";
    default:          return status;
  }
}

function getMembershipTone(status: UserMembership["status"]) {
  switch (status) {
    case "active":    return "success";
    case "past_due":  return "warning";
    case "canceled":  return "neutral";
    default:          return "neutral";
  }
}

/** 加入からの経過期間を「〇ヶ月のソシオ」形式で返す */
function getSocioAge(joinedAt: string): string {
  const diff = Date.now() - new Date(joinedAt).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}日のソシオ`;
  }
  return `${months}ヶ月のソシオ`;
}

/** ISO文字列を「YYYY/MM/DD」形式に変換 */
function toDateLabel(iso: string) {
  return iso.slice(0, 10).replace(/-/g, "/");
}

/** ISO文字列を「M/D HH:mm」形式に変換 */
function toEventLabel(iso: string) {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

/** 次回請求日を Stripe API から取得 */
async function fetchNextBillingDate(user: User, spotId: string): Promise<string | null> {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`/api/stripe/subscription?spotId=${spotId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { nextBillingDate: string | null };
    return data.nextBillingDate;
  } catch {
    return null;
  }
}

/** SPOT ごとの直近お知らせ・イベント・次回請求日を並列取得 */
async function fetchSpotPreview(user: User, spotId: string): Promise<SpotPreview> {
  const now = new Date();

  const [posts, events, nextBillingDate] = await Promise.all([
    listSpotPostsFromFirestore(spotId),
    listSpotEventsFromFirestore(spotId),
    fetchNextBillingDate(user, spotId)
  ]);

  const latestPost = posts[0]
    ? { id: posts[0].id, title: posts[0].title, publishDate: posts[0].publishDate }
    : null;

  const nextEvent =
    events
      .filter((e) => new Date(e.startAt) > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null;

  return {
    latestPost,
    nextEvent: nextEvent
      ? { id: nextEvent.id, title: nextEvent.title, startAt: nextEvent.startAt, location: nextEvent.location }
      : null,
    nextBillingDate
  };
}

// ─── コンポーネント ────────────────────────────────────────────────────

export function AccountPageClient() {
  const { authReady, user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, SpotPreview>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loadingPortal, setLoadingPortal] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  // メンバーシップ一覧を取得
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

  // プレビュー・イベントを並列取得（メンバーシップ確定後）
  useEffect(() => {
    if (!memberships || !user) {
      return;
    }

    const activeList = memberships.filter((m) => m.status !== "canceled");

    if (activeList.length === 0) {
      return;
    }

    void Promise.all(
      activeList.map(async (m) => {
        const preview = await fetchSpotPreview(user, m.spotId);
        return { spotId: m.spotId, spotName: m.spotName, preview };
      })
    ).then((results) => {
      const previewMap: Record<string, SpotPreview> = {};
      const allEvents: UpcomingEvent[] = [];

      results.forEach(({ spotId, spotName, preview }) => {
        previewMap[spotId] = preview;

        if (preview.nextEvent) {
          allEvents.push({
            spotId,
            spotName,
            eventId: preview.nextEvent.id,
            title: preview.nextEvent.title,
            startAt: preview.nextEvent.startAt,
            location: preview.nextEvent.location
          });
        }
      });

      setPreviews(previewMap);
      setUpcomingEvents(
        allEvents.sort((a, b) => a.startAt.localeCompare(b.startAt))
      );
    });
  }, [memberships, user]);

  // Stripe Customer Portal を開く
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

  // ─── ガード ────────────────────────────────────────────────────────

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
          <Link href="/spots" className="cta-primary">SPOTを探す</Link>
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

      {/* 今後のイベント（全SPOT横断） */}
      {upcomingEvents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="px-2 text-xs font-semibold tracking-[0.18em] text-ink/50">今後のイベント</h2>
          <div className="panel divide-y divide-ink/8 overflow-hidden px-6 sm:px-8">
            {upcomingEvents.map((ev) => (
              <div key={`${ev.spotId}-${ev.eventId}`} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <div className="text-xs font-semibold text-moss">{toEventLabel(ev.startAt)}</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{ev.title}</div>
                  <div className="mt-0.5 text-xs text-ink/50">
                    {ev.spotName}{ev.location ? ` · ${ev.location}` : ""}
                  </div>
                </div>
                <Link
                  href={`/spots/${ev.spotId}/member`}
                  className="shrink-0 text-xs font-semibold text-moss hover:underline"
                >
                  詳細 →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 所属中のSPOT */}
      {activeList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="px-2 text-xs font-semibold tracking-[0.18em] text-ink/50">所属中のSPOT</h2>
          {activeList.map((membership) => {
            const preview = previews[membership.spotId];
            return (
              <article key={membership.spotId} className="panel px-6 py-6 sm:px-8">
                {/* ヘッダー行 */}
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-ink">{membership.spotName}</h3>
                  <StatusBadge tone={getMembershipTone(membership.status)}>
                    {getMembershipStatusLabel(membership.status)}
                  </StatusBadge>
                </div>

                {/* メトリクス行 */}
                <div className="mt-3 flex flex-wrap gap-3">
                  <MetricPill label="プラン" value={`¥${membership.planAmount} / 月`} />
                  <MetricPill label="加入日" value={toDateLabel(membership.joinedAt)} />
                  <MetricPill label="加入期間" value={getSocioAge(membership.joinedAt)} />
                  {preview?.nextBillingDate ? (
                    <MetricPill label="次回請求" value={toDateLabel(preview.nextBillingDate)} />
                  ) : null}
                </div>

                {/* 直近プレビュー */}
                {preview ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {preview.latestPost ? (
                      <div className="rounded-[18px] bg-mist px-4 py-3 text-xs">
                        <div className="font-semibold tracking-[0.15em] text-ink/45">最新のお知らせ</div>
                        <div className="mt-1 font-semibold text-ink">{preview.latestPost.title}</div>
                        <div className="mt-0.5 text-ink/50">{toDateLabel(preview.latestPost.publishDate)}</div>
                      </div>
                    ) : (
                      <div className="rounded-[18px] bg-mist px-4 py-3 text-xs text-ink/40">
                        まだお知らせはありません
                      </div>
                    )}
                    {preview.nextEvent ? (
                      <div className="rounded-[18px] bg-mist px-4 py-3 text-xs">
                        <div className="font-semibold tracking-[0.15em] text-ink/45">次のイベント</div>
                        <div className="mt-1 font-semibold text-ink">{preview.nextEvent.title}</div>
                        <div className="mt-0.5 text-ink/50">{toEventLabel(preview.nextEvent.startAt)}</div>
                      </div>
                    ) : (
                      <div className="rounded-[18px] bg-mist px-4 py-3 text-xs text-ink/40">
                        予定されているイベントはありません
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 h-14 animate-pulse rounded-[18px] bg-mist" />
                )}

                {/* アクションボタン */}
                <div className="mt-5 flex flex-wrap gap-3">
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
              </article>
            );
          })}
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
                    <MetricPill label="加入日" value={toDateLabel(membership.joinedAt)} />
                  </div>
                </div>
                <Link href={`/spots/${membership.spotId}/join`} className="cta-secondary shrink-0">
                  再加入する
                </Link>
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
