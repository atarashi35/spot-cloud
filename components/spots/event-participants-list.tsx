"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { EventParticipant } from "@/lib/types";

type EventParticipantsListProps = {
  spotId: string;
  eventId: string;
};

export function EventParticipantsList({ spotId, eventId }: EventParticipantsListProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void user
      .getIdToken()
      .then(async (token) => {
        const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = (await response.json()) as { participants?: EventParticipant[]; error?: string; message?: string };

        if (!response.ok || !data.participants) {
          throw new Error(data.message ?? data.error ?? "participants_load_failed");
        }

        setParticipants(data.participants);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId, spotId, user]);

  if (loading) {
    return <p className="mt-4 text-xs text-ink/72">参加者を読み込み中です。</p>;
  }

  if (error) {
    return <p className="mt-4 text-xs font-medium text-red-700">{error}</p>;
  }

  return (
    <div className="mt-4 rounded-[20px] border border-ink/10 bg-white px-4 py-4">
      <div className="text-sm font-bold text-ink/72">
        参加予定 {participants.length} 人
      </div>
      {participants.length === 0 ? (
        <p className="mt-3 text-sm text-ink/72">まだ参加者はいません。</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-ink/78">
          {participants.map((participant) => (
            <div key={participant.uid} className="rounded-[16px] bg-mist px-3 py-3">
              <div className="font-medium text-ink">
                {participant.displayName || participant.email || participant.uid}
              </div>
              <div className="mt-1 text-xs text-ink/68">
                {participant.email && participant.displayName ? participant.email : participant.uid}
              </div>
              <div className="mt-1 text-xs text-ink/68">
                参加登録: {participant.joinedAt.slice(0, 10)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
