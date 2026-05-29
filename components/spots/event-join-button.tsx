"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getEventParticipation,
  joinSpotEventInFirestore,
  leaveSpotEventInFirestore,
  listEventParticipantsFromFirestore
} from "@/lib/firestore/events";

type EventJoinButtonProps = {
  spotId: string;
  eventId: string;
};

export function EventJoinButton({ spotId, eventId }: EventJoinButtonProps) {
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void Promise.all([
      getEventParticipation(spotId, eventId, user.uid),
      listEventParticipantsFromFirestore(spotId, eventId)
    ])
      .then(([participation, participants]) => {
        setJoined(Boolean(participation));
        setCount(participants.length);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId, spotId, user]);

  async function handleClick() {
    if (!user) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (joined) {
        await leaveSpotEventInFirestore(spotId, eventId, user.uid);
        setJoined(false);
        setCount((current) => Math.max(0, current - 1));
      } else {
        await joinSpotEventInFirestore(spotId, eventId, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email
        });
        setJoined(true);
        setCount((current) => current + 1);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント参加の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <button type="button" className="cta-primary w-full" onClick={handleClick} disabled={loading || saving}>
        {loading ? "確認中..." : saving ? "更新中..." : joined ? "参加を取り消す" : "参加する"}
      </button>
      <p className="text-xs text-ink/60">
        {joined ? "参加予定として登録されています。" : "参加予定者に登録すると、運営者が把握できます。"} 現在 {count} 人
      </p>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
