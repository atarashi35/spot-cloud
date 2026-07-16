"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { listSpotBookingRequestsFromFirestore, updateBookingRequestStatusInFirestore } from "@/lib/firestore/bookings";
import { BookingRequest, BookingRequestStatus } from "@/lib/types";

const statusLabel: Record<BookingRequestStatus, string> = {
  pending: "未対応",
  accepted: "受諾済み・支払いリンク未発行",
  declined: "辞退",
  payment_pending: "支払い待ち",
  paid: "支払い完了",
  completed: "完了",
  canceled: "キャンセル"
};

const statusTone: Record<BookingRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  declined: "bg-ink/10 text-ink/60",
  payment_pending: "bg-sky-100 text-sky-800",
  paid: "bg-moss/15 text-moss",
  completed: "bg-moss/15 text-moss",
  canceled: "bg-ink/10 text-ink/60"
};

function BookingRow({ spotId, booking, onChanged }: { spotId: string; booking: BookingRequest; onChanged: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  async function callOwnerAction(action: "accept" | "decline") {
    if (!user) return;
    setBusy(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/spots/${spotId}/bookings/${booking.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: action === "decline" ? JSON.stringify({ declineReason }) : undefined
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "処理に失敗しました。");
      }

      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function generatePaymentLink() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/booking-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId, bookingRequestId: booking.id })
      });
      const data = (await res.json()) as { url?: string; message?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "支払いリンクの発行に失敗しました。");
      }

      setPaymentUrl(data.url);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "支払いリンクの発行に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function markCompleted() {
    setBusy(true);
    setError(null);

    try {
      await updateBookingRequestStatusInFirestore(spotId, booking.id, { status: "completed" });
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[16px] bg-mist p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-ink">{booking.organizerName}</span>
            {booking.organizerOrg ? <span className="text-xs text-ink/60">（{booking.organizerOrg}）</span> : null}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[booking.status]}`}>
              {statusLabel[booking.status]}
            </span>
          </div>
          <div className="mt-1 text-xs text-ink/65">
            希望日: {booking.eventDate} ・ 場所: {booking.eventLocation}
          </div>
          <div className="mt-1 text-xs text-ink/65">
            出演料 ¥{booking.performerFeeAmount.toLocaleString()}（満額）+ SPOT手数料 ¥{booking.platformFeeAmount.toLocaleString()}
            = 依頼側お支払い総額 ¥{booking.totalAmount.toLocaleString()}
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/72">{booking.eventDescription}</p>
          {booking.message ? <p className="mt-1 text-xs text-ink/60">メッセージ: {booking.message}</p> : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {booking.status === "pending" ? (
          <>
            <button type="button" className="cta-primary px-4 py-2 text-sm" disabled={busy} onClick={() => callOwnerAction("accept")}>
              受諾する
            </button>
            {showDeclineInput ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  className="field flex-1 text-sm"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="辞退理由（任意）"
                />
                <button
                  type="button"
                  className="rounded-full border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:border-ink/35"
                  disabled={busy}
                  onClick={() => callOwnerAction("decline")}
                >
                  辞退を送信
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="rounded-full border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:border-ink/35"
                disabled={busy}
                onClick={() => setShowDeclineInput(true)}
              >
                辞退する
              </button>
            )}
          </>
        ) : null}

        {booking.status === "accepted" ? (
          <button type="button" className="cta-primary px-4 py-2 text-sm" disabled={busy} onClick={generatePaymentLink}>
            支払いリンクを発行
          </button>
        ) : null}

        {booking.status === "payment_pending" ? (
          <button type="button" className="cta-primary px-4 py-2 text-sm" disabled={busy} onClick={generatePaymentLink}>
            支払いリンクを再発行
          </button>
        ) : null}

        {paymentUrl ? (
          <div className="flex flex-1 items-center gap-2">
            <input className="field flex-1 text-xs" readOnly value={paymentUrl} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="rounded-full border border-ink/20 px-3 py-2 text-xs text-ink/70 hover:border-ink/35"
              onClick={() => navigator.clipboard.writeText(paymentUrl)}
            >
              コピー
            </button>
          </div>
        ) : null}

        {booking.status === "paid" ? (
          <button type="button" className="cta-primary px-4 py-2 text-sm" disabled={busy} onClick={markCompleted}>
            完了にする
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function BookingListPanel({ spotId }: { spotId: string }) {
  const [bookings, setBookings] = useState<BookingRequest[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void listSpotBookingRequestsFromFirestore(spotId)
      .then(setBookings)
      .catch(() => setBookings([]));
  }, [spotId, reloadKey]);

  if (bookings === null) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-[16px] bg-mist" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return <p className="text-sm text-ink/65">まだ出演依頼はありません。</p>;
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingRow key={booking.id} spotId={spotId} booking={booking} onChanged={() => setReloadKey((k) => k + 1)} />
      ))}
    </div>
  );
}
