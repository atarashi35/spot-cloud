import { NextRequest, NextResponse } from "next/server";
import { createBookingRequest, getBookingRequestById } from "@/lib/server/bookings";
import { sendBookingRequestReceived } from "@/lib/server/mailer";

/**
 * 出演依頼の作成。組織者はFirebase Authを持たない前提のため未認証エンドポイント。
 * 認可はSpotの公開状態・spotType・受付フラグをサーバー側で検証することで担保する
 * （firestore.rules 側は create: if false としている）。
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  try {
    const { spotId } = await params;
    const body = (await request.json()) as {
      organizerName?: string;
      organizerOrg?: string;
      organizerEmail?: string;
      organizerPhone?: string;
      eventDate?: string;
      eventLocation?: string;
      eventDescription?: string;
      message?: string;
    };

    if (!body.organizerName?.trim() || !body.organizerEmail?.trim() || !body.eventDate?.trim() || !body.eventLocation?.trim() || !body.eventDescription?.trim()) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const bookingRequestId = await createBookingRequest(spotId, {
      organizerName: body.organizerName.trim(),
      organizerOrg: body.organizerOrg?.trim(),
      organizerEmail: body.organizerEmail.trim(),
      organizerPhone: body.organizerPhone?.trim(),
      eventDate: body.eventDate.trim(),
      eventLocation: body.eventLocation.trim(),
      eventDescription: body.eventDescription.trim(),
      message: body.message?.trim()
    });

    const booking = await getBookingRequestById(spotId, bookingRequestId);

    if (booking) {
      await Promise.allSettled([sendBookingRequestReceived(booking)]);
    }

    return NextResponse.json({ ok: true, bookingRequestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "依頼の送信に失敗しました。";
    const knownErrors = ["spot_not_found", "spot_not_published", "not_a_performer_spot", "bookings_disabled", "connect_not_ready", "performer_fee_not_set"];
    const status = knownErrors.includes(message) ? 409 : 500;
    return NextResponse.json({ error: "booking_create_error", message }, { status });
  }
}
