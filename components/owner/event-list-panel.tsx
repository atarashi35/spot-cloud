"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { EventParticipant, SpotEvent } from "@/lib/types";

function toDateTimeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ParticipantRows({ spotId, eventId }: { spotId: string; eventId: string }) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<EventParticipant[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void user.getIdToken().then(async (token) => {
      try {
        const res = await fetch(`/api/spots/${spotId}/events/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await res.json()) as { participants?: EventParticipant[] };
        setParticipants(data.participants ?? []);
      } catch {
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    });
  }, [spotId, eventId, user]);

  if (loading) return <p className="mt-2 text-xs text-ink/50">読み込み中...</p>;

  if (!participants || participants.length === 0) {
    return <p className="mt-2 text-xs text-ink/50">参加者はまだいません。</p>;
  }

  return (
    <div className="mt-2 space-y-1">
      {participants.map((p) => (
        <div key={p.uid} className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <span className="font-medium text-ink">{p.displayName || "(名前未設定)"}</span>
            {p.email ? <span className="ml-2 text-ink/50">{p.email}</span> : null}
          </div>
          <span className="shrink-0 text-ink/40">{p.joinedAt.slice(0, 10)}</span>
        </div>
      ))}
    </div>
  );
}

function EventRow({ spotId, event }: { spotId: string; event: SpotEvent }) {
  const [open, setOpen] = useState(false);
  const isPast = new Date(event.startAt) < new Date();

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
              <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] text-ink/50">終了</span>
            ) : (
              <span className="shrink-0 rounded-full bg-moss/15 px-2 py-0.5 text-[10px] text-moss">開催予定</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-ink/50">
            {toDateTimeLabel(event.startAt)}
            {event.location ? ` · ${event.location}` : ""}
          </div>
        </div>
        <div className="ml-3 flex items-center gap-2 shrink-0">
          <Link
            href={`/spots/${spotId}/events/${event.id}/edit`}
            className="text-xs text-ink/40 underline hover:text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            編集
          </Link>
          <ChevronDown
            className={`h-4 w-4 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-ink/8 px-4 pb-4">
          {event.description ? (
            <p className="mt-2 text-xs leading-6 text-ink/60">{event.description}</p>
          ) : null}
          <div className="mt-1 text-[11px] font-semibold tracking-[0.15em] text-ink/40">参加者</div>
          <ParticipantRows spotId={spotId} eventId={event.id} />
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
          <span className="text-xs font-semibold tracking-[0.18em] text-ink/55">イベントと参加者</span>
          {events !== null ? (
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/70">
              {events.length}件
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`}
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
            <p className="text-sm text-ink/50">まだイベントはありません。</p>
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
