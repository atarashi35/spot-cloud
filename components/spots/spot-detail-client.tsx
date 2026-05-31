"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { EventJoinButton } from "@/components/spots/event-join-button";
import { EventParticipantsList } from "@/components/spots/event-participants-list";
import { SocioSignupModal } from "@/components/spots/socio-signup-modal";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { getUserMembership } from "@/lib/firestore/memberships";
import { listSpotPostsFromFirestore } from "@/lib/firestore/posts";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotEvent, SpotPost, UserMembership } from "@/lib/types";

function getMembershipStatusLabel(status: UserMembership["status"]) {
  switch (status) {
    case "active":
      return "利用中";
    case "canceling":
      return "解約予定";
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
    case "canceling":
      return "warning";
    case "past_due":
      return "warning";
    case "canceled":
      return "neutral";
    default:
      return "neutral";
  }
}

export function SpotDetailClient({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [posts, setPosts] = useState<SpotPost[]>([]);
  const [events, setEvents] = useState<SpotEvent[]>([]);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    void Promise.all([
      getSpotFromFirestore(spotId),
      user ? getUserMembership(user.uid, spotId) : Promise.resolve(null)
    ])
      .then(async ([nextSpot, nextMembership]) => {
        if (!nextSpot) {
          setStatus("missing");
          return;
        }

        const isOwner = user?.uid === nextSpot.ownerUid;
        const canReadProtectedContent = Boolean(isOwner || nextMembership?.status === "active");

        let nextPosts: SpotPost[] = [];
        let nextEvents: SpotEvent[] = [];

        if (canReadProtectedContent) {
          [nextPosts, nextEvents] = await Promise.all([
            listSpotPostsFromFirestore(spotId),
            listSpotEventsFromFirestore(spotId)
          ]);
        }

        setSpot(nextSpot);
        setPosts(nextPosts);
        setEvents(nextEvents);
        setMembership(nextMembership);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [authReady, spotId, user]);

  if (!authReady || status === "loading") {
    return <div className="panel px-6 py-8 text-sm text-ink/60">SPOT 詳細を読み込み中です。</div>;
  }

  if (status === "error") {
    return (
      <EmptyState
        title="SPOT 詳細を取得できませんでした"
        description="Firestore から詳細を読めませんでした。設定と権限を確認してください。"
      />
    );
  }

  if (status === "missing" || !spot) {
    return (
      <EmptyState
        title="SPOT が見つかりません"
        description="指定された SPOT は存在しないか、まだ公開されていません。"
      />
    );
  }

  const isOwner = user?.uid === spot.ownerUid;
  if (spot.isSuspended && !isOwner) {
    return (
      <EmptyState
        title="SPOT が見つかりません"
        description="指定された SPOT は現在公開停止中です。"
      />
    );
  }

  const membershipStatus = membership?.status;
  // canceling（解約予定）も期末まで有効なためメンバーズエリアに入れる
  const canViewMembersArea = Boolean(
    isOwner || membershipStatus === "active" || membershipStatus === "canceling"
  );
  const canAcceptMembership = Boolean(spot.stripeConnectedAccountId);

  return (
    <div className="space-y-8">
      <SocioSignupModal
        spot={spot}
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        defaultPlan={membership?.planAmount ?? 100}
      />
      <section className="panel overflow-hidden">
        {spot.coverImageUrl ? (
          <img
            alt={spot.name}
            className="h-64 w-full object-cover"
            src={spot.coverImageUrl}
          />
        ) : (
          <div className={`h-64 bg-gradient-to-br ${spot.coverTone}`} />
        )}
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="chip">{spot.category}</span>
            <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">{spot.name}</h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-ink/72 sm:text-base">{spot.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MetricPill label="ソシオ" value={`${spot.socioCount}人`} />
              <MetricPill label="エリア" value={`${spot.prefecture}${spot.city ? ` / ${spot.city}` : ""}`} />
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-ink/62">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{spot.address}</span>
            </div>
          </div>
          <aside className="rounded-[28px] bg-mist p-5">
            <div className="text-xs font-semibold tracking-[0.18em] text-ink/55">JOIN AS SOCIO</div>
            {isOwner ? (
              <>
                <h2 className="mt-3 text-2xl font-bold text-ink">運営中</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <StatusBadge tone="success">ソシオ限定を表示中</StatusBadge>
                  <StatusBadge>運営者</StatusBadge>
                </div>
              </>
            ) : membershipStatus === "active" ? (
              <>
                <h2 className="mt-3 text-2xl font-bold text-ink">ソシオ加入済み</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <StatusBadge tone="success">利用中</StatusBadge>
                  <MetricPill label="プラン" value={`¥${membership?.planAmount ?? 500}`} />
                </div>
              </>
            ) : membershipStatus === "past_due" ? (
              <>
                <h2 className="mt-3 text-2xl font-bold text-ink">支払い確認が必要です</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <StatusBadge tone="warning">{getMembershipStatusLabel(membershipStatus)}</StatusBadge>
                  <MetricPill label="プラン" value={`¥${membership?.planAmount ?? 500}`} />
                </div>
                <Link href="/account" className="cta-primary mt-5 w-full">
                  支払い状況を確認する
                </Link>
              </>
            ) : membershipStatus === "canceled" ? (
              <>
                <h2 className="mt-3 text-2xl font-bold text-ink">加入は停止中です</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <StatusBadge>{getMembershipStatusLabel(membershipStatus)}</StatusBadge>
                  <MetricPill label="前回" value={`¥${membership?.planAmount ?? 500}`} />
                </div>
                {canAcceptMembership ? (
                  <button type="button" className="cta-primary mt-5 w-full" onClick={() => setSignupModalOpen(true)}>
                    ソシオ登録
                  </button>
                ) : (
                  <div className="mt-5 rounded-[24px] bg-white px-4 py-4 text-sm text-ink/65">
                    受取設定の完了後に再加入できます。
                  </div>
                )}
              </>
            ) : !canAcceptMembership ? (
              <>
                <h2 className="mt-3 text-2xl font-bold text-ink">加入受付は準備中です</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <StatusBadge>受取設定中</StatusBadge>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-bold text-ink">ソシオになる</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  <MetricPill label="月額" value="¥100" />
                  <MetricPill label="月額" value="¥300" />
                  <MetricPill label="月額" value="¥500" />
                </div>
                <button type="button" className="cta-primary mt-5 w-full" onClick={() => setSignupModalOpen(true)}>
                  ソシオ登録
                </button>
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="chip">MEMBERS ONLY</span>
          </div>
          {canViewMembersArea ? (
            <Link href="/account" className="cta-secondary">
              所属中のSPOT
            </Link>
          ) : null}
        </div>
        <div className="mt-6">
          {!canViewMembersArea ? (
            <EmptyState
              title="このエリアは加入後に閲覧可能です"
              description="ソシオになると、このページ内でお知らせとイベントの続きが表示されます。"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] bg-white/60 p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-bold text-ink">お知らせ</h3>
                  {isOwner ? (
                    <Link href={`/spots/${spotId}/posts/new`} className="cta-secondary">
                      投稿を作成
                    </Link>
                  ) : null}
                </div>
                <div className="mt-6 space-y-4">
                  {posts.length === 0 ? (
                    <EmptyState
                      title="まだお知らせはありません"
                      description="最初のお知らせを作成すると、このエリアにソシオ向けの告知が表示されます。"
                    />
                  ) : (
                    posts.map((post) => (
                      <article key={post.id} className="rounded-[24px] bg-mist p-5">
                        <div className="text-xs font-semibold tracking-[0.18em] text-ink/55">
                          {post.publishDate}
                        </div>
                        <h4 className="mt-2 text-lg font-bold text-ink">{post.title}</h4>
                        <p className="mt-3 text-sm leading-7 text-ink/68">{post.body}</p>
                        {isOwner ? (
                          <div className="mt-4">
                            <Link href={`/spots/${spotId}/posts/${post.id}/edit`} className="cta-secondary">
                              編集する
                            </Link>
                          </div>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <section className="rounded-[28px] bg-white/60 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-ink">イベント</h3>
                    {isOwner ? (
                      <Link href={`/spots/${spotId}/events/new`} className="cta-secondary">
                        イベント作成
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-6 space-y-4">
                    {events.length === 0 ? (
                      <EmptyState
                        title="まだイベントはありません"
                        description="限定イベントを作成すると、このエリアに表示されます。"
                      />
                    ) : (
                      events.map((event) => (
                        <article key={event.id} className="rounded-[24px] bg-mist p-5">
                          <div className="text-xs font-semibold tracking-[0.18em] text-ink/55">
                            {new Date(event.startAt).toLocaleString("ja-JP")}
                          </div>
                          <h4 className="mt-2 text-lg font-bold text-ink">{event.title}</h4>
                          <p className="mt-3 text-sm leading-7 text-ink/68">{event.description}</p>
                          {event.location ? (
                            <p className="mt-2 text-sm font-medium text-ink/65">場所: {event.location}</p>
                          ) : null}
                          {isOwner ? (
                            <div className="mt-4">
                              <Link href={`/spots/${spotId}/events/${event.id}/edit`} className="cta-secondary">
                                編集する
                              </Link>
                            </div>
                          ) : null}
                          {event.hasJoinButton && !isOwner ? (
                            <EventJoinButton spotId={spotId} eventId={event.id} />
                          ) : null}
                          {isOwner ? <EventParticipantsList spotId={spotId} eventId={event.id} /> : null}
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-[28px] bg-white/60 p-6">
                  <div className="flex flex-wrap gap-3 text-sm text-ink/68">
                    <StatusBadge tone={getMembershipTone(membership?.status ?? "active")}>
                      {getMembershipStatusLabel(membership?.status ?? "active")}
                    </StatusBadge>
                    <MetricPill
                      label="加入日"
                      value={(membership?.joinedAt ?? new Date().toISOString()).slice(0, 10)}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
