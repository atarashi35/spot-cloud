"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getEventParticipation,
  joinSpotEventInFirestore,
  leaveSpotEventInFirestore
} from "@/lib/firestore/events";

type EventJoinButtonProps = {
  spotId: string;
  eventId: string;
  /** イベントドキュメントに保持されている参加人数（他ソシオのデータを取得しないための安全な代替） */
  participantCount: number;
};

export function EventJoinButton({ spotId, eventId, participantCount }: EventJoinButtonProps) {
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  // 楽観的更新用のローカルカウント（Firestoreの値をベースに ±1 で管理）
  const [localCount, setLocalCount] = useState(participantCount);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 自分の参加状態のみ取得（他ソシオのデータは取得しない）
    void getEventParticipation(spotId, eventId, user.uid)
      .then((participation) => {
        setJoined(Boolean(participation));
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
        setLocalCount((c) => Math.max(0, c - 1));
      } else {
        await joinSpotEventInFirestore(spotId, eventId, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email
        });
        setJoined(true);
        setLocalCount((c) => c + 1);
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
      <p className="text-xs text-ink/72">
        {joined ? "参加予定として登録されています。" : "参加予定者に登録すると、運営者が把握できます。"} 現在 {localCount} 人
      </p>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
