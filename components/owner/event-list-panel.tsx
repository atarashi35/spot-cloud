"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createSpotEventInFirestore, listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { SpotEvent } from "@/lib/types";

function toDateTimeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EventRow({ spotId, event }: { spotId: string; event: SpotEvent }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const isPast = new Date(event.startAt) < new Date();

  async function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user || duplicating) return;

    setDuplicating(true);
    try {
      const newId = await createSpotEventInFirestore(spotId, user.uid, {
        title: `${event.title}（コピー）`,
        description: event.description,
        startAt: event.startAt,
        location: event.location,
        imageUrl: event.imageUrl,
        isPublic: event.isPublic,
        hasJoinButton: event.hasJoinButton,
        participationMode: event.participationMode ?? "open",
        capacity: event.capacity,
        registrationQuestions: event.registrationQuestions
      });
      router.push(`/spots/${spotId}/events/${newId}/edit`);
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <div className="rounded-[16px] bg-mist">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink truncate">{event.title}</span>
            {isPast ? (
              <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/65">終了</span>
            ) : (
              <span className="shrink-0 rounded-full bg-moss/15 px-2 py-0.5 text-xs text-moss">開催予定</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-ink/65">
            {toDateTimeLabel(event.startAt)}
            {event.location ? ` · ${event.location}` : ""}
          </div>
        </div>
        <div className="ml-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="text-xs text-ink/60 underline hover:text-ink"
            onClick={(e) => void handleDuplicate(e)}
            disabled={duplicating}
          >
            {duplicating ? "複製中..." : "複製"}
          </button>
          <Link
            href={`/spots/${spotId}/events/${event.id}/edit`}
            className="text-xs text-ink/60 underline hover:text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            編集
          </Link>
          <ChevronDown
            className={`h-4 w-4 text-ink/60 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-ink/8 px-4 pb-4">
          {event.description ? (
            <p className="mt-2 text-xs leading-6 text-ink/72">{event.description}</p>
          ) : null}
          {event.hasJoinButton ? (
            <Link
              href={`/manage/${spotId}/events/${event.id}`}
              className="mt-3 inline-block text-xs font-medium text-ink underline hover:text-ink/70"
              onClick={(e) => e.stopPropagation()}
            >
              参加者を管理・招待する →
            </Link>
          ) : (
            <p className="mt-3 text-xs text-ink/60">参加ボタンが無効のため、参加者管理はありません。</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function EventListPanel({ spotId, defaultOpen = false }: { spotId: string; defaultOpen?: boolean }) {
  const [events, setEvents] = useState<SpotEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!open || events !== null) return;
    setLoading(true);
    void listSpotEventsFromFirestore(spotId)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [open, spotId, events]);

  const sorted = events
    ? [...events].sort((a, b) => b.startAt.localeCompare(a.startAt))
    : [];

  return (
    <div className="mt-3 rounded-[16px] border border-ink/10 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-ink/72">イベントと参加者</span>
          {events !== null ? (
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/78">
              {events.length}件
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ink/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="border-t border-ink/8 px-5 pb-5 pt-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-[16px] bg-mist" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-ink/65">まだイベントはありません。</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((event) => (
                <EventRow key={event.id} spotId={spotId} event={event} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
