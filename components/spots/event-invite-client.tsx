"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import QRCode from "react-qr-code";
import { EmptyState } from "@/components/empty-state";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { buildGoogleCalendarUrl, buildIcsDataUrl } from "@/lib/ics";
import { EventParticipantStatus } from "@/lib/types";

type InviteInfo = {
  spotName: string;
  eventTitle: string;
  eventStartAt: string;
  eventEndAt?: string;
  eventLocation?: string;
  eventDescription?: string;
  registrationQuestions?: string[];
  invitedEmail: string;
  status: "sent" | "redeemed";
};

type Props = {
  spotId: string;
  eventId: string;
  inviteId: string;
};

export function EventInviteClient({ spotId, eventId, inviteId }: Props) {
  const { authReady, user } = useAuth();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [resultStatus, setResultStatus] = useState<EventParticipantStatus | null>(null);
  const [autoRedeemRequested, setAutoRedeemRequested] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [plusOneCount, setPlusOneCount] = useState(0);

  useEffect(() => {
    void fetch(`/api/spots/${spotId}/events/${eventId}/invite/${inviteId}`)
      .then(async (response) => {
        const data = (await response.json()) as InviteInfo & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "invite_lookup_failed");
        setInvite(data);
        if (data.status === "redeemed") setResultStatus("accepted");
      })
      .catch(() => {
        setError("この招待は見つかりませんでした。リンクが正しいかご確認ください。");
      })
      .finally(() => setLoading(false));
  }, [spotId, eventId, inviteId]);

  // ログイン完了（Googleポップアップ即時 or メールリンク経由の再訪問）後に自動で参加確定する
  useEffect(() => {
    if (user && autoRedeemRequested && !resultStatus && !redeeming) {
      setAutoRedeemRequested(false);
      void handleParticipate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, autoRedeemRequested]);

  async function handleParticipate() {
    if (!user) {
      setAutoRedeemRequested(true);
      setLoginOpen(true);
      return;
    }

    setRedeeming(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/invite/${inviteId}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plusOneCount, answers })
      });
      const data = (await response.json()) as { status?: EventParticipantStatus };

      if (!response.ok) throw new Error("参加確定に失敗しました。");
      setResultStatus(data.status ?? "accepted");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "参加確定に失敗しました。");
    } finally {
      setRedeeming(false);
    }
  }

  if (loading || !authReady) {
    return <div className="panel mx-auto max-w-lg px-8 py-10 text-sm text-ink/72">読み込み中です。</div>;
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState title="招待が見つかりません" description={error ?? "リンクをご確認ください。"} />
      </div>
    );
  }

  const questions = invite.registrationQuestions ?? [];
  const checkInUrl =
    user && typeof window !== "undefined" ? `${window.location.origin}/spots/${spotId}/events/${eventId}/checkin/${user.uid}` : "";

  return (
    <div className="mx-auto max-w-lg">
      <div className="panel px-8 py-10">
        <span className="chip">招待</span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">{invite.spotName}から招待が届いています</h1>

        <div className="mt-6 rounded-[20px] bg-mist px-5 py-5">
          <p className="text-lg font-bold text-ink">{invite.eventTitle}</p>
          {invite.eventStartAt ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-ink/72">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{invite.eventStartAt}</span>
            </div>
          ) : null}
          {invite.eventLocation ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-ink/72">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{invite.eventLocation}</span>
            </div>
          ) : null}
          {invite.eventDescription ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{invite.eventDescription}</p>
          ) : null}
        </div>

        {resultStatus === "accepted" ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-[20px] bg-mist px-5 py-4 text-sm text-ink/78">
              参加が確定しました。当日お会いできるのを楽しみにしています。
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <a
                href={buildGoogleCalendarUrl({
                  title: invite.eventTitle,
                  description: invite.eventDescription,
                  location: invite.eventLocation,
                  startAt: invite.eventStartAt,
                  endAt: invite.eventEndAt
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink/60 underline hover:text-ink"
              >
                Googleカレンダーに追加
              </a>
              <a
                href={buildIcsDataUrl({
                  title: invite.eventTitle,
                  description: invite.eventDescription,
                  location: invite.eventLocation,
                  startAt: invite.eventStartAt,
                  endAt: invite.eventEndAt
                })}
                download={`${invite.eventTitle}.ics`}
                className="text-ink/60 underline hover:text-ink"
              >
                カレンダーに追加（.ics）
              </a>
            </div>
            {checkInUrl ? (
              <div className="rounded-[16px] bg-mist px-4 py-4 text-center">
                <p className="text-xs text-ink/65">当日はこのQRコードを運営者に提示してください</p>
                <div className="mt-2 flex justify-center">
                  <div className="rounded-[12px] bg-white p-3">
                    <QRCode value={checkInUrl} size={120} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : resultStatus === "waitlisted" ? (
          <div className="mt-6 rounded-[20px] bg-mist px-5 py-4 text-sm text-ink/78">
            定員に達しているため、キャンセル待ちで登録しました。空きが出れば自動的に参加確定になります。
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {!user ? (
              <p className="text-xs text-ink/65">
                参加を確定するには、アカウント作成（無料）が必要です。応援会員登録は不要です。
              </p>
            ) : null}
            {questions.length > 0 ? (
              <div className="space-y-3 rounded-[16px] bg-mist px-4 py-3">
                {questions.map((q) => (
                  <label key={q} className="block space-y-1">
                    <span className="text-xs font-medium text-ink/72">{q}</span>
                    <input
                      type="text"
                      className="field h-10 text-sm"
                      value={answers[q] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
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
                    onChange={(e) => setPlusOneCount(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                  />
                </label>
              </div>
            ) : null}
            <button type="button" className="cta-primary w-full" onClick={() => void handleParticipate()} disabled={redeeming}>
              {redeeming ? "処理中..." : !user ? "ログインして参加する" : "参加する"}
            </button>
            {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
          </div>
        )}

        <div className="mt-6 text-sm">
          <Link href={`/spots/${spotId}`} className="text-ink/68 hover:text-ink transition-colors">
            ← {invite.spotName} を見る
          </Link>
        </div>
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
        returnTo={`/spots/${spotId}/events/${eventId}/invite/${inviteId}`}
      />
    </div>
  );
}
