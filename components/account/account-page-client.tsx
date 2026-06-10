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
import { SocioCard } from "@/components/account/socio-card";
import { FEATURE_EVENTS } from "@/lib/flags";
import { getUserProfileDoc } from "@/lib/firestore/user-profile";
import { resolveDisplayName } from "@/lib/user-profile";

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


/** SPOT ごとの直近投稿・イベントを並列取得 */
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
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [memberNumbers, setMemberNumbers] = useState<Record<string, number | null>>({});

  // 会員証に表示する会員番号（spotごとのjoinedAt順通し番号）を取得
  useEffect(() => {
    if (!user || !memberships) return;
    const targets = memberships.filter((m) => m.status === "active" || m.status === "canceling");
    if (targets.length === 0) return;

    let cancelled = false;
    void user.getIdToken().then((token) =>
      Promise.all(
        targets.map((m) =>
          fetch(`/api/spots/${m.spotId}/socio-number`, { headers: { authorization: `Bearer ${token}` } })
            .then((r) => r.json() as Promise<{ number: number | null }>)
            .then((d) => [m.spotId, d.number] as const)
            .catch(() => [m.spotId, null] as const)
        )
      ).then((entries) => {
        if (!cancelled) setMemberNumbers(Object.fromEntries(entries));
      })
    );
    return () => { cancelled = true; };
  }, [user, memberships]);

  useEffect(() => {
    if (!user) {
      setProfileDisplayName(null);
      return;
    }
    void getUserProfileDoc(user.uid).then((profile) => {
      setProfileDisplayName(profile?.profileDisplayName ?? null);
      setAvatarUrl(profile?.avatarUrl ?? null);
    });
  }, [user]);

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
    return <div className="panel px-6 py-8 text-sm text-ink/72">読み込み中です。</div>;
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
        title="サポート情報を取得できませんでした"
        description={`membership 読み込みでエラーが出ています: ${membershipError}`}
      />
    );
  }

  if (!memberships) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">サポート情報を読み込み中です。</div>;
  }

  const activeList = memberships.filter((m) => m.status !== "canceled");
  const canceledList = memberships.filter((m) => m.status === "canceled");

  return (
    <div className="space-y-6">

      {/* 応援会員会員証 */}
      {user ? (
        <section className="space-y-3">
          <h2 className="px-2 text-sm font-bold text-ink/72">MY SUPPORTER CARD</h2>
          <div className="mx-auto max-w-sm space-y-3">
            <SocioCard
              uid={user.uid}
              displayName={resolveDisplayName(profileDisplayName, user.displayName, user.email)}
              avatarUrl={avatarUrl}
              memberships={memberships}
              memberNumbers={memberNumbers}
            />
            {!profileDisplayName ? (
              <Link
                href="/settings"
                className="flex items-center justify-between gap-3 rounded-[20px] border border-dashed border-moss/40 bg-moss/5 px-5 py-4 text-sm font-semibold text-moss hover:bg-moss/10 transition-colors"
              >
                <span>表示名を設定する</span>
                <span className="text-xs font-normal text-moss/70">カードに表示される名前を変更できます →</span>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 今後のイベント（全SPOT横断）（凍結中: FEATURE_EVENTS） */}
      {FEATURE_EVENTS && upcomingEvents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="px-2 text-sm font-bold text-ink/72">今後のイベント</h2>
          <div className="panel divide-y divide-ink/8 overflow-hidden px-6 sm:px-8">
            {upcomingEvents.map((ev) => (
              <div key={`${ev.spotId}-${ev.eventId}`} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <div className="text-xs font-semibold text-moss">{toEventLabel(ev.startAt)}</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{ev.title}</div>
                  <div className="mt-0.5 text-xs text-ink/65">
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

      {/* 応援中のSPOTがない場合 */}
      {activeList.length === 0 ? (
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyState
            title="まだ応援中のSPOTはありません"
            description="SPOTを見つけて加入すると、限定ページやイベント情報にアクセスできるようになります。"
          />
          <div className="mt-6">
            <Link href="/spots" className="cta-primary">SPOTを探す</Link>
          </div>
        </section>
      ) : null}

      {/* 応援中のSPOT */}
      {activeList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="px-2 text-sm font-bold text-ink/72">応援中のSPOT</h2>
          {activeList.map((membership) => {
            const preview = previews[membership.spotId];
            return (
              <article key={membership.spotId} className="panel px-6 py-6 sm:px-8">
                {/* ヘッダー行 */}
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-extrabold text-ink">{spotNames[membership.spotId] ?? membership.spotName}</h3>
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
                        <div className="font-semibold tracking-[0.15em] text-ink/65">最新の投稿</div>
                        <div className="mt-1 font-semibold text-ink">{preview.latestPost.title}</div>
                        <div className="mt-0.5 text-ink/65">{toDateLabel(preview.latestPost.publishDate)}</div>
                      </div>
                    ) : (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs text-ink/60">
                        まだ投稿はありません
                      </div>
                    )}
                    {preview.nextEvent ? (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs">
                        <div className="font-semibold tracking-[0.15em] text-ink/65">次のイベント</div>
                        <div className="mt-1 font-semibold text-ink">{preview.nextEvent.title}</div>
                        <div className="mt-0.5 text-ink/65">{toEventLabel(preview.nextEvent.startAt)}</div>
                      </div>
                    ) : (
                      <div className="rounded-[16px] bg-mist px-4 py-3 text-xs text-ink/60">
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

      {/* 過去のサポート */}
      {canceledList.length > 0 ? (
        <section className="space-y-4">
          <h2 className="px-2 text-sm font-bold text-ink/72">過去のサポート</h2>
          {canceledList.map((membership) => (
            <article
              key={membership.spotId}
              className="rounded-[28px] border border-ink/8 bg-white/40 px-6 py-5 sm:px-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-ink/68">{membership.spotName}</h3>
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
