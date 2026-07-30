"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotEventFromFirestore } from "@/lib/firestore/events";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { EventParticipant } from "@/lib/types";

type Props = {
  spotId: string;
  eventId: string;
  uid: string;
};

export function EventCheckinClient({ spotId, eventId, uid }: Props) {
  const { authReady, user } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [participant, setParticipant] = useState<EventParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setLoading(false);
      setIsOwner(false);
      return;
    }

    void Promise.all([getSpotFromFirestore(spotId), getSpotEventFromFirestore(spotId, eventId)])
      .then(async ([spot, event]) => {
        const owner = spot?.ownerUid === user.uid;
        setIsOwner(owner);
        setEventTitle(event?.title ?? "");

        if (!owner) return;

        const token = await user.getIdToken();
        const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await response.json()) as { participants?: EventParticipant[] };
        const found = data.participants?.find((p) => p.uid === uid) ?? null;

        if (!found) {
          setError("この参加者は見つかりませんでした。");
          return;
        }

        setParticipant(found);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [authReady, user, spotId, eventId, uid]);

  async function handleCheckIn() {
    if (!user || !participant) return;

    setSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants/${uid}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checkedIn: true })
      });

      if (!response.ok) throw new Error("チェックインに失敗しました。");
      setParticipant((prev) => (prev ? { ...prev, checkedInAt: new Date().toISOString() } : prev));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "チェックインに失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (!authReady || loading) {
    return <div className="panel mx-auto max-w-md px-8 py-10 text-sm text-ink/72">読み込み中です。</div>;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md">
        <EmptyState title="この画面は運営者のみ利用できます" description="チェックインはSPOTのオーナーだけが行えます。" />
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="mx-auto max-w-md">
        <EmptyState title="参加者が見つかりません" description={error ?? "リンクをご確認ください。"} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="panel px-8 py-10 text-center">
        <span className="chip">受付</span>
        <h1 className="mt-4 text-xl font-extrabold text-ink">{eventTitle}</h1>
        <p className="mt-2 text-lg font-bold text-ink">
          {participant.displayName || participant.email || participant.uid}
        </p>
        {participant.plusOneCount ? (
          <p className="mt-1 text-sm text-ink/65">同伴者 {participant.plusOneCount}名</p>
        ) : null}

        {participant.checkedInAt ? (
          <div className="mt-6 rounded-[20px] bg-moss/10 px-5 py-4 text-sm font-medium text-moss">
            ✓ チェックイン済みです
          </div>
        ) : (
          <button type="button" className="cta-primary mt-6 w-full" onClick={() => void handleCheckIn()} disabled={saving}>
            {saving ? "処理中..." : "チェックインする"}
          </button>
        )}

        {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}

        <div className="mt-6 text-sm">
          <Link href={`/spots/${spotId}/events/${eventId}`} className="text-ink/68 hover:text-ink transition-colors">
            ← イベントページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
