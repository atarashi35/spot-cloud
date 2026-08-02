"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EventParticipantsList } from "@/components/spots/event-participants-list";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotEventFromFirestore } from "@/lib/firestore/events";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotEvent } from "@/lib/types";

const MODE_LABEL = { open: "即時参加", application: "承認制", invitation: "招待制" } as const;

function toDateTimeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function EventManageDetailClient({ spotId, eventId }: { spotId: string; eventId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [event, setEvent] = useState<SpotEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void Promise.all([getSpotFromFirestore(spotId), getSpotEventFromFirestore(spotId, eventId)])
      .then(([nextSpot, nextEvent]) => {
        setSpot(nextSpot);
        setEvent(nextEvent);
      })
      .finally(() => setLoading(false));
  }, [spotId, eventId, user]);

  if (!authReady || loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">読み込み中です。</div>;
  }

  const isOwner = user && spot?.ownerUid === user.uid;

  if (!user || !isOwner) {
    return (
      <EmptyState
        title="この画面は運営者のみ利用できます"
        description="ログイン中ユーザーがこの SPOT の ownerUid と一致するときだけ参加者を管理できます。"
      />
    );
  }

  if (!event) {
    return <EmptyState title="イベントが見つかりません" description="このイベントは存在しないか、削除された可能性があります。" />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "管理", href: "/manage" },
        { label: spot?.name ?? "…", href: "/manage" },
        { label: "イベント管理", href: "/manage" },
        { label: event.title },
      ]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{event.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/68">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {toDateTimeLabel(event.startAt)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            {event.hasJoinButton && (
              <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/78">
                {MODE_LABEL[event.participationMode ?? "open"]}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/spots/${spotId}/events/${eventId}`} className="cta-secondary">
            公開ページを見る
          </Link>
          <Link href={`/spots/${spotId}/events/${eventId}/edit`} className="cta-secondary">
            編集
          </Link>
        </div>
      </div>

      {event.hasJoinButton ? (
        <EventParticipantsList spotId={spotId} eventId={eventId} event={event} />
      ) : (
        <p className="text-sm text-ink/65">このイベントは参加ボタンが無効になっているため、参加者管理はありません。</p>
      )}
    </div>
  );
}
