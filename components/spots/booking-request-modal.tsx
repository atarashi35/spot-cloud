"use client";

import { FormEvent, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { Spot } from "@/lib/types";

export function BookingRequestModal({ spot, open, onClose }: { spot: Spot; open: boolean; onClose: () => void }) {
  const [organizerName, setOrganizerName] = useState("");
  const [organizerOrg, setOrganizerOrg] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleClose() {
    onClose();
    // 次回開いたときのために少し遅らせてリセット
    setTimeout(() => {
      setSubmitted(false);
      setError(null);
      setOrganizerName("");
      setOrganizerOrg("");
      setOrganizerEmail("");
      setOrganizerPhone("");
      setEventDate("");
      setEventLocation("");
      setEventDescription("");
      setMessage("");
    }, 200);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/spots/${spot.id}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerName,
          organizerOrg,
          organizerEmail,
          organizerPhone,
          eventDate,
          eventLocation,
          eventDescription,
          message
        })
      });

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message ?? "依頼の送信に失敗しました。");
      }

      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "依頼の送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={handleClose} title={`${spot.name}に出演依頼`} size="md">
      {submitted ? (
        <div className="py-6 text-center">
          <p className="text-base font-bold text-ink">依頼を送信しました</p>
          <p className="mt-2 text-sm leading-6 text-ink/68">
            {spot.name}からの返信をメールでお待ちください。
          </p>
          <button type="button" className="cta-primary mt-5" onClick={handleClose}>
            閉じる
          </button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          {spot.performerFee ? (
            <div className="rounded-[16px] bg-mist px-4 py-3 text-sm text-ink/72">
              出演料の目安: <strong>¥{spot.performerFee.toLocaleString()}</strong>
              {spot.performerFeeNote ? `（${spot.performerFeeNote}）` : ""}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="お名前"
              required
            />
            <input
              className="field"
              value={organizerOrg}
              onChange={(e) => setOrganizerOrg(e.target.value)}
              placeholder="団体名（任意）"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              type="email"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              placeholder="メールアドレス"
              required
            />
            <input
              className="field"
              type="tel"
              value={organizerPhone}
              onChange={(e) => setOrganizerPhone(e.target.value)}
              placeholder="電話番号（任意）"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <input
              className="field"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="場所"
              required
            />
          </div>
          <textarea
            className="field min-h-24"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="依頼内容（イベントの目的・規模など）"
            required
          />
          <textarea
            className="field min-h-16"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="メッセージ（任意）"
          />
          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
          <button type="submit" className="cta-primary w-full" disabled={submitting}>
            {submitting ? "送信中..." : "依頼を送信する"}
          </button>
        </form>
      )}
    </ModalShell>
  );
}
