"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";

type Activity = { spotId: string; spotName: string; eventId: string; title: string; startAt: string; checkedInAt: string | null };

export function ActivityPassport({ user }: { user: User }) {
  const [events, setEvents] = useState<Activity[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void user.getIdToken().then((token) => fetch("/api/account/activity", { headers: { Authorization: `Bearer ${token}` } }))
      .then(async (response) => {
        if (!response.ok) throw new Error("activity_unavailable");
        return response.json() as Promise<{ events: Activity[] }>;
      }).then((data) => { if (!cancelled) setEvents(data.events); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [user]);
  return (
    <section className="panel px-6 py-8 sm:px-8">
      <h2 className="text-xl font-bold text-ink">活動パスポート</h2>
      <p className="mt-1 text-sm text-ink/60">参加が確定したイベントを表示します。この履歴は本人だけが見られます。</p>
      {error ? <p className="mt-4 text-sm text-red-700">履歴を読み込めませんでした。時間をおいて再読み込みしてください。</p> : !events ? <p className="mt-4 text-sm text-ink/60">読み込み中です。</p> : events.length === 0 ? <p className="mt-4 text-sm text-ink/60">参加が確定したイベントはまだありません。</p> : (
        <ul className="mt-4 divide-y divide-ink/8 border-t border-ink/8">
          {events.map((event) => <li key={`${event.spotId}-${event.eventId}`} className="py-4">
            <p className="text-xs text-ink/60">{event.startAt ? new Date(event.startAt).toLocaleString("ja-JP") : "日時未設定"} · {event.spotName}</p>
            <Link href={`/spots/${event.spotId}/events/${event.eventId}`} className="mt-1 inline-block font-semibold text-ink hover:text-moss">{event.title}</Link>
            <p className="mt-1 text-xs text-ink/60">{event.checkedInAt ? `チェックイン済み · ${new Date(event.checkedInAt).toLocaleString("ja-JP")}` : "参加確定"}</p>
          </li>)}
        </ul>
      )}
    </section>
  );
}
