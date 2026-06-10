"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { EventJoinButton } from "@/components/spots/event-join-button";
import { getSpotEventFromFirestore } from "@/lib/firestore/events";
import { getUserMembership } from "@/lib/firestore/memberships";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotEvent, UserMembership } from "@/lib/types";

function formatDateRange(startAt: string, endAt?: string) {
  const start = new Date(startAt);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  };
  const startStr = start.toLocaleString("ja-JP", opts);
  if (!endAt) return startStr;
  const end = new Date(endAt);
  const endStr = end.toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  return `${startStr} 〜 ${endStr}`;
}

export function EventDetailClient({ spotId, eventId }: { spotId: string; eventId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [event, setEvent] = useState<SpotEvent | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    void Promise.all([
      getSpotFromFirestore(spotId),
      getSpotEventFromFirestore(spotId, eventId),
      user ? getUserMembership(user.uid, spotId) : Promise.resolve(null)
    ])
      .then(([nextSpot, nextEvent, nextMembership]) => {
        setSpot(nextSpot);
        setEvent(nextEvent);
        setMembership(nextMembership);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [authReady, spotId, eventId, user]);

  if (!authReady || loading) {
    return (
      <div className="shell">
        <div className="panel px-6 py-8 text-sm text-ink/72 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell">
        <EmptyState title="読み込みに失敗しました" description={error} />
      </div>
    );
  }

  if (!event || !spot) {
    return (
      <div className="shell">
        <EmptyState title="イベントが見つかりません" description="このイベントは存在しないか、削除された可能性があります。" />
      </div>
    );
  }

  const isOwner = user?.uid === spot.ownerUid;
  const isMember = isOwner || membership?.status === "active";

  if (!event.isPublic && !isMember) {
    return (
      <div className="shell">
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyState
            title="このイベントはサポーター限定です"
            description="加入済みサポーターのみ閲覧できます。"
          />
          <Link href={`/spots/${spotId}/join`} className="cta-primary mt-6">
            加入ページへ
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="shell space-y-6">
      {/* パンくず */}
      <nav className="text-sm text-ink/68">
        <Link href={`/spots/${spotId}`} className="hover:text-ink transition-colors">{spot.name}</Link>
        <span className="mx-2">/</span>
        <span>イベント</span>
      </nav>

      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <span className="chip">EVENT</span>
            {!event.isPublic && (
              <span className="chip ml-2">MEMBER ONLY</span>
            )}
            <h1 className="mt-4 text-3xl font-extrabold text-ink">{event.title}</h1>
          </div>
          {isOwner && (
            <Link
              href={`/spots/${spotId}/events/${eventId}/edit`}
              className="cta-secondary shrink-0"
            >
              編集
            </Link>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-ink/78">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDateRange(event.startAt, event.endAt)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-sm text-ink/78">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.hasJoinButton && (
            <div className="flex items-center gap-3 text-sm text-ink/78">
              <Users className="h-4 w-4 shrink-0" />
              <span>{event.participantCount} 人が参加予定</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="mt-6 text-[15px] leading-relaxed text-ink/75 whitespace-pre-wrap">{event.description}</p>
        )}

        {event.hasJoinButton && isMember && !isOwner && (
          <div className="mt-6">
            <EventJoinButton spotId={spotId} eventId={eventId} participantCount={event.participantCount} />
          </div>
        )}

        {isOwner && event.hasJoinButton && (
          <div className="mt-6 rounded-[20px] bg-mist px-5 py-4 text-sm text-ink/78">
            参加登録者数: <span className="font-bold text-ink">{event.participantCount} 人</span>
          </div>
        )}
      </section>

      <div className="text-sm">
        <Link href={`/spots/${spotId}/member`} className="text-ink/68 hover:text-ink transition-colors">
          ← {spot.name} の限定ページに戻る
        </Link>
      </div>
    </div>
  );
}
