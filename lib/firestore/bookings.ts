"use client";

import { Timestamp, collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { BookingRequest, BookingRequestStatus } from "@/lib/types";

function parseTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function mapBookingRequest(spotId: string, id: string, data: Record<string, unknown>): BookingRequest {
  return {
    id,
    spotId,
    spotName: String(data.spotName ?? ""),
    status: data.status as BookingRequestStatus,
    organizerName: String(data.organizerName ?? ""),
    organizerOrg: typeof data.organizerOrg === "string" && data.organizerOrg ? data.organizerOrg : undefined,
    organizerEmail: String(data.organizerEmail ?? ""),
    organizerPhone: typeof data.organizerPhone === "string" && data.organizerPhone ? data.organizerPhone : undefined,
    eventDate: String(data.eventDate ?? ""),
    eventLocation: String(data.eventLocation ?? ""),
    eventDescription: String(data.eventDescription ?? ""),
    message: typeof data.message === "string" && data.message ? data.message : undefined,
    performerFeeAmount: Number(data.performerFeeAmount ?? 0),
    platformFeeAmount: Number(data.platformFeeAmount ?? 0),
    totalAmount: Number(data.totalAmount ?? 0),
    declineReason: typeof data.declineReason === "string" && data.declineReason ? data.declineReason : undefined,
    stripeCheckoutSessionId:
      typeof data.stripeCheckoutSessionId === "string" && data.stripeCheckoutSessionId
        ? data.stripeCheckoutSessionId
        : undefined,
    stripePaymentIntentId:
      typeof data.stripePaymentIntentId === "string" && data.stripePaymentIntentId
        ? data.stripePaymentIntentId
        : undefined,
    paidAt: typeof data.paidAt === "string" ? data.paidAt : undefined,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt)
  };
}

/** オーナー専用（firestore.rules で isResourceOwner のみ read 可）。新しい依頼が先頭に来るよう降順。 */
export async function listSpotBookingRequestsFromFirestore(spotId: string) {
  const q = query(collection(getFirestoreDb(), "spots", spotId, "bookingRequests"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapBookingRequest(spotId, item.id, item.data()));
}

export async function getSpotBookingRequestFromFirestore(spotId: string, bookingRequestId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "spots", spotId, "bookingRequests", bookingRequestId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapBookingRequest(spotId, snapshot.id, snapshot.data());
}

/**
 * 金銭・Stripeに関わらない単純な状態遷移のみ（paid→completed、各状態→canceled）。
 * pending→accepted/declined はメール送信を伴うためサーバーAPI経由（lib/server/bookings.ts）を使う。
 * firestore.rules 側も affectedKeys を status/declineReason/updatedAt のみに制限している。
 */
export async function updateBookingRequestStatusInFirestore(
  spotId: string,
  bookingRequestId: string,
  patch: { status: BookingRequestStatus; declineReason?: string }
) {
  await updateDoc(doc(getFirestoreDb(), "spots", spotId, "bookingRequests", bookingRequestId), {
    status: patch.status,
    ...(patch.declineReason !== undefined ? { declineReason: patch.declineReason } : {}),
    updatedAt: new Date().toISOString()
  });
}
