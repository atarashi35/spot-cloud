"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/providers/auth-provider";
import { getEventParticipation } from "@/lib/firestore/events";
import { EventParticipantStatus, EventParticipationMode } from "@/lib/types";

type EventJoinButtonProps = {
  spotId: string;
  eventId: string;
  /** イベントドキュメントに保持されている参加人数（他サポーターのデータを取得しないための安全な代替） */
  participantCount: number;
  participationMode?: EventParticipationMode;
  registrationQuestions?: string[];
};

type ParticipationState = EventParticipantStatus | "none";

function RegistrationFields({
  questions,
  answers,
  onAnswerChange,
  plusOneCount,
  onPlusOneChange
}: {
  questions: string[];
  answers: Record<string, string>;
  onAnswerChange: (question: string, value: string) => void;
  plusOneCount: number;
  onPlusOneChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-[16px] bg-mist px-4 py-3">
      {questions.map((q) => (
        <label key={q} className="block space-y-1">
          <span className="text-xs font-medium text-ink/72">{q}</span>
          <input
            type="text"
            className="field h-10 text-sm"
            value={answers[q] ?? ""}
            onChange={(e) => onAnswerChange(q, e.target.value)}
          />
        </label>
      ))}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-ink/72">同伴者の人数（任意、本人を除く）</span>
        <input
          type="number"
          min={0}
          max={10}
          className="field h-10 w-24 text-sm"
          value={plusOneCount}
          onChange={(e) => onPlusOneChange(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
        />
      </label>
    </div>
  );
}

export function EventJoinButton({
  spotId,
  eventId,
  participantCount,
  participationMode,
  registrationQuestions
}: EventJoinButtonProps) {
  const mode: EventParticipationMode = participationMode ?? "open";
  const questions = registrationQuestions ?? [];
  const { user } = useAuth();
  const [state, setState] = useState<ParticipationState>("none");
  // 楽観的更新用のローカルカウント（Firestoreの値をベースに ±1 で管理）
  const [localCount, setLocalCount] = useState(participantCount);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [plusOneCount, setPlusOneCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 自分の参加状態のみ取得（他サポーターのデータは取得しない）
    void getEventParticipation(spotId, eventId, user.uid)
      .then((participation) => {
        setState(participation?.status ?? "none");
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId, spotId, user]);

  async function apply() {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plusOneCount, answers }),
      });
      const data = (await response.json()) as { status?: EventParticipantStatus; error?: string };
      if (!response.ok) throw new Error("申込に失敗しました。");
      setState(data.status ?? "accepted");
      if (data.status === "accepted") {
        setLocalCount((c) => c + 1 + plusOneCount);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント参加の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("取消に失敗しました。");
      setState("none");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント参加の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function respond(decision: "accept" | "decline") {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, plusOneCount, answers }),
      });
      const data = (await response.json()) as { status?: EventParticipantStatus };
      if (!response.ok) throw new Error("返信に失敗しました。");
      setState(data.status ?? (decision === "accept" ? "accepted" : "declined"));
      if (decision === "accept" && data.status === "accepted") {
        setLocalCount((c) => c + 1 + plusOneCount);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "返信に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-4">
        <button type="button" className="cta-primary w-full" disabled>
          確認中...
        </button>
      </div>
    );
  }

  const checkInUrl =
    typeof window !== "undefined" ? `${window.location.origin}/spots/${spotId}/events/${eventId}/checkin/${user.uid}` : "";

  const CheckInQr = state === "accepted" && (
    <div className="mt-3 rounded-[16px] bg-mist px-4 py-4 text-center">
      <p className="text-xs text-ink/65">当日はこのQRコードを運営者に提示してください</p>
      <div className="mt-2 flex justify-center">
        <div className="rounded-[12px] bg-white p-3">
          <QRCode value={checkInUrl} size={120} />
        </div>
      </div>
    </div>
  );

  if (mode === "open") {
    const joined = state === "accepted";
    return (
      <div className="mt-4 space-y-2">
        {!joined && questions.length > 0 ? (
          <RegistrationFields
            questions={questions}
            answers={answers}
            onAnswerChange={(q, v) => setAnswers((prev) => ({ ...prev, [q]: v }))}
            plusOneCount={plusOneCount}
            onPlusOneChange={setPlusOneCount}
          />
        ) : null}
        {state === "waitlisted" ? (
          <button type="button" className="cta-secondary w-full" disabled>
            キャンセル待ちです
          </button>
        ) : (
          <button type="button" className="cta-primary w-full" onClick={() => void (joined ? withdraw() : apply())} disabled={saving}>
            {saving ? "更新中..." : joined ? "参加を取り消す" : "参加する"}
          </button>
        )}
        <p className="text-xs text-ink/72">
          {joined ? "参加予定として登録されています。" : "参加予定者に登録すると、運営者が把握できます。"} 現在 {localCount} 人
        </p>
        {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
        {CheckInQr}
      </div>
    );
  }

  if (mode === "application") {
    return (
      <div className="mt-4 space-y-2">
        {state === "none" && (
          <>
            {questions.length > 0 ? (
              <RegistrationFields
                questions={questions}
                answers={answers}
                onAnswerChange={(q, v) => setAnswers((prev) => ({ ...prev, [q]: v }))}
                plusOneCount={plusOneCount}
                onPlusOneChange={setPlusOneCount}
              />
            ) : null}
            <button type="button" className="cta-primary w-full" onClick={() => void apply()} disabled={saving}>
              {saving ? "申込中..." : "参加を申し込む"}
            </button>
          </>
        )}
        {state === "pending" && (
          <>
            <button type="button" className="cta-secondary w-full" disabled>
              承認待ちです
            </button>
            <button type="button" className="w-full text-xs text-ink/60 underline" onClick={() => void withdraw()} disabled={saving}>
              申込を取り下げる
            </button>
          </>
        )}
        {state === "waitlisted" && (
          <button type="button" className="cta-secondary w-full" disabled>
            キャンセル待ちです（空きが出ると自動で参加確定になります）
          </button>
        )}
        {state === "accepted" && (
          <button type="button" className="cta-primary w-full" onClick={() => void withdraw()} disabled={saving}>
            {saving ? "更新中..." : "参加を取り消す（参加確定済み）"}
          </button>
        )}
        {state === "declined" && (
          <button type="button" className="cta-secondary w-full" disabled>
            今回は見送りとなりました
          </button>
        )}
        <p className="text-xs text-ink/72">
          {state === "none" ? "申込後、運営者が承認すると参加確定します。" : null} 現在 {localCount} 人が参加確定
        </p>
        {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
        {CheckInQr}
      </div>
    );
  }

  // mode === "invitation"
  return (
    <div className="mt-4 space-y-2">
      {state === "none" && (
        <p className="rounded-[16px] bg-mist px-4 py-3 text-sm text-ink/72">
          このイベントは招待制です。運営者からの招待をお待ちください。
        </p>
      )}
      {state === "invited" && (
        <>
          <p className="rounded-[16px] bg-mist px-4 py-3 text-sm text-ink/78">運営者から招待が届いています。</p>
          {questions.length > 0 ? (
            <RegistrationFields
              questions={questions}
              answers={answers}
              onAnswerChange={(q, v) => setAnswers((prev) => ({ ...prev, [q]: v }))}
              plusOneCount={plusOneCount}
              onPlusOneChange={setPlusOneCount}
            />
          ) : null}
          <div className="flex gap-2">
            <button type="button" className="cta-primary flex-1" onClick={() => void respond("accept")} disabled={saving}>
              {saving ? "更新中..." : "参加する"}
            </button>
            <button type="button" className="cta-secondary flex-1" onClick={() => void respond("decline")} disabled={saving}>
              辞退する
            </button>
          </div>
        </>
      )}
      {state === "waitlisted" && (
        <button type="button" className="cta-secondary w-full" disabled>
          キャンセル待ちです（空きが出ると自動で参加確定になります）
        </button>
      )}
      {state === "accepted" && (
        <button type="button" className="cta-primary w-full" onClick={() => void withdraw()} disabled={saving}>
          {saving ? "更新中..." : "参加を取り消す（参加確定済み）"}
        </button>
      )}
      {state === "declined" && (
        <button type="button" className="cta-secondary w-full" disabled>
          招待を辞退しました
        </button>
      )}
      <p className="text-xs text-ink/72">現在 {localCount} 人が参加確定</p>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
      {CheckInQr}
    </div>
  );
}
