"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { EventJoinButton } from "@/components/spots/event-join-button";
import { listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { getUserMembership } from "@/lib/firestore/memberships";
import { listSpotPostsFromFirestore } from "@/lib/firestore/posts";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotEvent, SpotPost, UserMembership } from "@/lib/types";

export function MemberPageClient({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [posts, setPosts] = useState<SpotPost[]>([]);
  const [events, setEvents] = useState<SpotEvent[]>([]);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    void Promise.all([
      getSpotFromFirestore(spotId),
      listSpotPostsFromFirestore(spotId),
      listSpotEventsFromFirestore(spotId),
      user ? getUserMembership(user.uid, spotId) : Promise.resolve(null)
    ])
      .then(([nextSpot, nextPosts, nextEvents, nextMembership]) => {
        setSpot(nextSpot);
        setPosts(nextPosts);
        setEvents(nextEvents);
        setMembership(nextMembership);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authReady, spotId, user]);

  if (!authReady || loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">限定ページを読み込み中です。</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="限定ページを取得できませんでした"
        description={`Firestore 接続でエラーが出ています: ${error}`}
      />
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="このページはログイン後に利用できます"
        description="Google ログイン後に、加入済み SPOT の限定情報を確認できます。"
      />
    );
  }

  if (!spot) {
    return (
      <EmptyState
        title="SPOT が見つかりません"
        description="指定された SPOT は存在しないか、まだ公開されていません。"
      />
    );
  }

  const isOwner = spot.ownerUid === user.uid;

  if (!isOwner && (!membership || membership.status !== "active")) {
    return (
      <div className="shell">
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyState
            title="このページはソシオ限定です"
            description="加入済みユーザーのみ閲覧可能です。まずは 100円 / 300円 / 500円 のいずれかで所属してください。"
          />
          <Link href={`/spots/${spot.id}/join`} className="cta-primary mt-6">
            加入ページへ
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="shell space-y-8">
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">MEMBER PAGE</span>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">{spot.name} の限定ページ</h1>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              お知らせ、限定イベント、所属情報をここに集約します。
            </p>
          </div>
          <div className="rounded-[24px] bg-mist px-5 py-4 text-sm text-ink/70">
            加入プラン: <span className="font-bold text-ink">¥{membership?.planAmount ?? 500}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-ink">お知らせ</h2>
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
                  <h3 className="mt-2 text-lg font-bold text-ink">{post.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink/68">{post.body}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="panel px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-ink">イベント</h2>
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
                    <h3 className="mt-2 text-lg font-bold text-ink">{event.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-ink/68">{event.description}</p>
                    {event.location ? (
                      <p className="mt-2 text-sm font-medium text-ink/65">場所: {event.location}</p>
                    ) : null}
                    {event.hasJoinButton && !isOwner ? (
                      <EventJoinButton spotId={spotId} eventId={event.id} />
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel px-6 py-6">
            <h2 className="text-2xl font-bold text-ink">ソシオ情報</h2>
            <div className="mt-5 space-y-3 text-sm text-ink/68">
              <div className="rounded-[20px] bg-mist px-4 py-3">
                加入ステータス: {membership?.status ?? "active"}
              </div>
              <div className="rounded-[20px] bg-mist px-4 py-3">
                加入日: {(membership?.joinedAt ?? new Date().toISOString()).slice(0, 10)}
              </div>
              <Link href="/account" className="cta-secondary w-full">
                解約導線を確認する
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
