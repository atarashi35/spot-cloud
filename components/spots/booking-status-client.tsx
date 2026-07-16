"use client";

import { useState } from "react";
import { BookingRequest, BookingRequestStatus } from "@/lib/types";

const statusCopy: Record<BookingRequestStatus, { title: string; description: string }> = {
  pending: { title: "依頼を確認中です", description: "SPOTからの返信をお待ちください。" },
  accepted: { title: "依頼が受諾されました", description: "下のボタンからお支払いにお進みください。" },
  declined: { title: "依頼は辞退されました", description: "またの機会にご検討いただけますと幸いです。" },
  payment_pending: { title: "お支払い手続き中です", description: "お支払いが完了していない場合は、下のボタンから再度お進みください。" },
  paid: { title: "お支払いが完了しました", description: "当日はどうぞよろしくお願いいたします。" },
  completed: { title: "対応が完了しました", description: "ご利用ありがとうございました。" },
  canceled: { title: "この依頼はキャンセルされました", description: "" }
};

export function BookingStatusClient({
  spotId,
  bookingRequestId,
  initialBooking
}: {
  spotId: string;
  bookingRequestId: string;
  initialBooking: BookingRequest;
}) {
  const [booking] = useState(initialBooking);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToPayment() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/booking-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId, bookingRequestId })
      });
      const data = (await res.json()) as { url?: string; message?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.message ?? "支払い手続きの開始に失敗しました。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "支払い手続きの開始に失敗しました。");
      setLoading(false);
    }
  }

  const copy = statusCopy[booking.status];

  return (
    <div className="panel space-y-4 px-6 py-8">
      <div>
        <p className="text-sm font-bold text-ink/60">{booking.spotName}への出演依頼</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">{copy.title}</h1>
        {copy.description ? <p className="mt-2 text-sm text-ink/68">{copy.description}</p> : null}
      </div>

      <div className="rounded-[16px] bg-mist p-4 text-sm text-ink/72">
        <p>希望日: {booking.eventDate}</p>
        <p>場所: {booking.eventLocation}</p>
        <p className="mt-2">
          出演料 ¥{booking.performerFeeAmount.toLocaleString()} + SPOT手数料 ¥{booking.platformFeeAmount.toLocaleString()}
          {" "}= お支払い総額 <strong>¥{booking.totalAmount.toLocaleString()}</strong>
        </p>
      </div>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      {booking.status === "accepted" || booking.status === "payment_pending" ? (
        <button type="button" className="cta-primary w-full" disabled={loading} onClick={goToPayment}>
          {loading ? "移動中..." : "支払いへ進む"}
        </button>
      ) : null}
    </div>
  );
}
