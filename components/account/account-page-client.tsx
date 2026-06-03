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
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { UserMembership } from "@/lib/types";

// ─── 型 ───────────────────────────────────────────────────────────────

type SpotPreview = {
  latestPost: { id: string; title: string; publishDate: string } | null;
  nextEvent: { id: string; title: string; startAt: string; location?: string } | null;
};

type UpcomingEvent = {
  spotId: string;
  spotName: string;
  eventId: string;
  title: string;
  startAt: string;
  location?: string;
};

type SupportTier = {
  label: string;
  requirement: string;
  description: string;
  nextMilestone: string | null;
  badgeClassName: string;
  accentClassName: string;
  ringClassName: string;
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

function getSupportTier(count: number): SupportTier {
  if (count >= 20) {
    return {
      label: "プラチナソシオ",
      requirement: "20 SPOT",
      description: "このまちのあちこちに深く関わるトップソシオです。",
      nextMilestone: null,
      badgeClassName: "border-slate-300/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(214,224,232,0.95)_48%,rgba(176,190,199,0.9))] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_40px_rgba(120,136,150,0.18)]",
      accentClassName: "text-slate-700",
      ringClassName: "border-slate-200/80 bg-white/70"
    };
  }

  if (count >= 5) {
    if (count >= 10) {
      return {
        label: "ゴールドソシオ",
        requirement: "10 SPOT",
        description: "複数のSPOTを横断して支える中心的なソシオです。",
        nextMilestone: "次は 20 SPOT でプラチナソシオ",
        badgeClassName: "border-amber-300/80 bg-[linear-gradient(135deg,rgba(255,247,214,0.98),rgba(247,215,110,0.95)_52%,rgba(214,151,39,0.92))] text-amber-950 shadow-[inset_0_1px_0_rgba(255,251,230,0.95),0_18px_40px_rgba(214,151,39,0.2)]",
        accentClassName: "text-amber-900",
        ringClassName: "border-amber-200/80 bg-amber-50/70"
      };
    }

    return {
      label: "シルバーソシオ",
      requirement: "5 SPOT",
      description: "応援の輪をしっかり広げているアクティブなソシオです。",
      nextMilestone: "次は 10 SPOT でゴールドソシオ",
      badgeClassName: "border-zinc-300/80 bg-[linear-gradient(135deg,rgba(250,251,252,0.98),rgba(223,229,235,0.96)_55%,rgba(164,176,188,0.92))] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_18px_40px_rgba(148,163,184,0.16)]",
      accentClassName: "text-slate-700",
      ringClassName: "border-slate-200/80 bg-slate-50/80"
    };
  }

  if (count >= 3) {
    return {
      label: "ブロンズソシオ",
      requirement: "3 SPOT",
      description: "ひとつ先の応援へ踏み出した頼もしいソシオです。",
      nextMilestone: "次は 5 SPOT でシルバーソシオ",
      badgeClassName: "border-orange-300/80 bg-[linear-gradient(135deg,rgba(255,240,229,0.98),rgba(215,145,96,0.95)_56%,rgba(157,92,51,0.9))] text-orange-950 shadow-[inset_0_1px_0_rgba(255,244,236,0.96),0_18px_40px_rgba(180,105,63,0.18)]",
      accentClassName: "text-orange-900",
      ringClassName: "border-orange-200/80 bg-orange-50/75"
    };
  }

  return {
    label: "ソシオ",
    requirement: "1-2 SPOT",
    description: "あなたの応援が、SPOTを支えています。",
    nextMilestone: "次は 3 SPOT でブロンズソシオ",
    badgeClassName: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(244,251,246,0.98),rgba(190,220,198,0.95)_52%,rgba(117,153,128,0.9))] text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_18px_40px_rgba(117,153,128,0.16)]",
    accentClassName: "text-emerald-900",
    ringClassName: "border-emerald-200/80 bg-emerald-50/70"
  };
}

/** SPOT ごとの直近お知らせ・イベントを並列取得 */
async function fetchSpotPreview(user: User, spotId: string): Promise<SpotPreview & { currentName: string | null }> {
  const now = new Date();
  void user;

  const [posts, events, spot] = await Promise.all([
    listSpotPostsFromFirestore(spotId),
    listSpotEventsFromFirestore(spotId),
    getSpotFromFirestore(spotId).catch(() => null)
  ]);

  const latestPost = posts[0]
    ? { id: posts[0].id, title: posts[0].title, publishDate: posts[0].publishDate }
    : null;

  const nextEvent =
    events
      .filter((e) => new Date(e.startAt) > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null;

  return {
    currentName: spot?.name ?? null,
    latestPost,
    nextEvent: nextEvent
      ? { id: nextEvent.id, title: nextEvent.title, startAt: nextEvent.startAt, location: nextEvent.location }
      : null
  };
}

// ─── コンポーネント ────────────────────────────────────────────────────

export function AccountPageClient() {
  const { authReady, user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [spotNames, setSpotNames] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, SpotPreview>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  // メンバーシップ一覧を取得
  useEffect(() => {
    if (!user) {
      setMemberships(null);
      return;
    }

    void (async () => {
      try {
        const token = await user.getIdToken();
        await fetch("/api/auth/claim-memberships", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch {
        // no-op: 表示は継続する
      }

      return listUserMemberships(user.uid);
    })()
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
        return { spotId: m.spotId, spotName: preview.currentName ?? m.spotName, preview };
      })
    ).then((results) => {
      const previewMap: Record<string, SpotPreview> = {};
      const nameMap: Record<string, string> = {};
      const allEvents: UpcomingEvent[] = [];

      results.forEach(({ spotId, spotName, preview }) => {
        previewMap[spotId] = preview;
        nameMap[spotId] = spotName;

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
      setSpotNames(nameMap);
      setUpcomingEvents(
        allEvents.sort((a, b) => a.startAt.localeCompare(b.startAt))
      );
    });
  }, [memberships, user]);

  // ─── ガード ────────────────────────────────────────────────────────

  if (!authReady) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">読み込み中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="応援中のSPOTはログイン後に利用できます"
        description="Google ログイン後に、応援しているSPOTと限定コンテンツにアクセスできます。"
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
  const supportTier = getSupportTier(activeList.length);

  if (memberships.length === 0) {
    return (
      <section className="panel px-6 py-8 sm:px-8">
        <EmptyState
          title="まだ応援中のSPOTはありません"
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

      {/* サポートサマリー */}
      {activeList.length > 0 ? (
        <section className="panel px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">SUPPORTING SPOTS</div>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-5xl font-bold tracking-tight text-ink">{activeList.length}</div>
                <div className="pb-1 text-sm font-medium text-ink/52">SPOTをサポート中</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-ink/62">
                応援しているSPOTの限定コンテンツやイベント情報にアクセスできます。
              </p>
            </div>

            <div className={`rounded-[20px] border px-5 py-4 lg:min-w-[320px] ${supportTier.badgeClassName}`}>
              <div className="text-xs font-semibold tracking-[0.18em] text-current/60">SOCIO STATUS</div>
              <div className="mt-3 flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full border text-xl shadow-sm ${supportTier.ringClassName}`}>
                  <span aria-hidden="true">S</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-current">{supportTier.label}</div>
                  <span className="mt-1 inline-flex rounded-full border border-current/10 bg-white/55 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-current/70">
                    {supportTier.requirement}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm leading-7 text-current/72">{supportTier.description}</div>
              {supportTier.nextMilestone ? (
                <div className={`mt-2 text-xs font-semibold ${supportTier.accentClassName}`}>{supportTier.nextMilestone}</div>
              ) : (
                <div className={`mt-2 text-xs font-semibold ${supportTier.accentClassName}`}>現在の最高ランクです</div>
              )}
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
                  href={`/spots/${ev.spotId}/events/${ev.eventId}`}
                  className="shrink-0 text-xs font-semibold text-moss hover:underline"
                >
                  詳細 →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 応援中のSPOT */}
      {activeList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="px-2 text-xs font-semibold tracking-[0.18em] text-ink/50">応援中のSPOT</h2>
          {activeList.map((membership) => {
            const preview = previews[membership.spotId];
            return (
              <article key={membership.spotId} className="panel px-6 py-6 sm:px-8">
                {/* ヘッダー行 */}
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-ink">{spotNames[membership.spotId] ?? membership.spotName}</h3>
                  <StatusBadge tone={getMembershipTone(membership.status)}>
                    {getMembershipStatusLabel(membership.status)}
                  </StatusBadge>
                </div>

                {/* メトリクス行 */}
                <div className="mt-3 flex flex-wrap gap-3">
                  <MetricPill label="加入日" value={toDateLabel(membership.joinedAt)} />
                </div>

                {/* 直近プレビュー */}
                {preview ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {preview.latestPost ? (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs">
                        <div className="font-semibold tracking-[0.15em] text-ink/45">最新のお知らせ</div>
                        <div className="mt-1 font-semibold text-ink">{preview.latestPost.title}</div>
                        <div className="mt-0.5 text-ink/50">{toDateLabel(preview.latestPost.publishDate)}</div>
                      </div>
                    ) : (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs text-ink/40">
                        まだお知らせはありません
                      </div>
                    )}
                    {preview.nextEvent ? (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs">
                        <div className="font-semibold tracking-[0.15em] text-ink/45">次のイベント</div>
                        <div className="mt-1 font-semibold text-ink">{preview.nextEvent.title}</div>
                        <div className="mt-0.5 text-ink/50">{toEventLabel(preview.nextEvent.startAt)}</div>
                      </div>
                    ) : (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs text-ink/40">
                        予定されているイベントはありません
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 h-14 animate-pulse rounded-[16px] bg-mist" />
                )}

                {/* アクションボタン */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/spots/${membership.spotId}`} className="cta-primary">
                    SPOTを見る
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {/* もっとSPOTを探す（加入数が少ない時） */}
      {activeList.length > 0 && activeList.length <= 2 ? (
        <div className="px-2">
          <Link href="/" className="text-sm font-semibold text-moss hover:underline">
            もっとSPOTを探す →
          </Link>
        </div>
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
                    <MetricPill label="加入日" value={toDateLabel(membership.joinedAt)} />
                  </div>
                </div>
                <Link href={`/spots/${membership.spotId}`} className="cta-secondary shrink-0">
                  SPOTを見る
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
