import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { calcBookingPlatformFee } from "@/lib/booking/fee-tiers";
import { BookingRequest, BookingRequestStatus } from "@/lib/types";

type CreateBookingRequestInput = {
  organizerName: string;
  organizerOrg?: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventDate: string;
  eventLocation: string;
  eventDescription: string;
  message?: string;
};

function mapBookingRequest(spotId: string, id: string, data: FirebaseFirestore.DocumentData): BookingRequest {
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
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString()
  };
}

/**
 * 出演依頼を作成する。組織者はFirebase Authを持たないため、このAdmin SDK経由の
 * サーバー関数のみが作成経路（firestore.rules は create: if false）。
 */
export async function createBookingRequest(spotId: string, input: CreateBookingRequestInput) {
  const db = getAdminDb();
  const spotSnapshot = await db.doc(`spots/${spotId}`).get();

  if (!spotSnapshot.exists) {
    throw new Error("spot_not_found");
  }

  const spot = spotSnapshot.data() ?? {};

  if (!spot.isPublished) {
    throw new Error("spot_not_published");
  }

  if (spot.bookingsEnabled === false) {
    throw new Error("bookings_disabled");
  }

  const connectedAccountId = String(spot.stripeConnectedAccountId ?? "");

  if (!connectedAccountId) {
    throw new Error("connect_not_ready");
  }

  const performerFeeAmount = Number(spot.performerFee ?? 0);

  if (!performerFeeAmount || performerFeeAmount <= 0) {
    throw new Error("performer_fee_not_set");
  }

  const platformFeeAmount = calcBookingPlatformFee(performerFeeAmount);
  const totalAmount = performerFeeAmount + platformFeeAmount;

  const ref = await db.collection(`spots/${spotId}/bookingRequests`).add({
    spotId,
    spotName: String(spot.name ?? ""),
    status: "pending" satisfies BookingRequestStatus,
    organizerName: input.organizerName,
    organizerOrg: input.organizerOrg ?? "",
    organizerEmail: input.organizerEmail,
    organizerPhone: input.organizerPhone ?? "",
    eventDate: input.eventDate,
    eventLocation: input.eventLocation,
    eventDescription: input.eventDescription,
    message: input.message ?? "",
    performerFeeAmount,
    platformFeeAmount,
    totalAmount,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return ref.id;
}

export async function getBookingRequestById(spotId: string, bookingRequestId: string) {
  const snapshot = await getAdminDb().doc(`spots/${spotId}/bookingRequests/${bookingRequestId}`).get();

  if (!snapshot.exists) {
    return null;
  }

  return mapBookingRequest(spotId, snapshot.id, snapshot.data() ?? {});
}

/** オーナーが依頼を受諾する。pending→accepted のみ許可。 */
export async function acceptBookingRequest(spotId: string, bookingRequestId: string) {
  const db = getAdminDb();
  const ref = db.doc(`spots/${spotId}/bookingRequests/${bookingRequestId}`);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.status !== "pending") {
    throw new Error("invalid_status_transition");
  }

  await ref.update({ status: "accepted" satisfies BookingRequestStatus, updatedAt: FieldValue.serverTimestamp() });
  return mapBookingRequest(spotId, bookingRequestId, { ...snapshot.data(), status: "accepted" });
}

export async function declineBookingRequest(spotId: string, bookingRequestId: string, declineReason?: string) {
  const db = getAdminDb();
  const ref = db.doc(`spots/${spotId}/bookingRequests/${bookingRequestId}`);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.status !== "pending") {
    throw new Error("invalid_status_transition");
  }

  await ref.update({
    status: "declined" satisfies BookingRequestStatus,
    declineReason: declineReason ?? "",
    updatedAt: FieldValue.serverTimestamp()
  });
  return mapBookingRequest(spotId, bookingRequestId, { ...snapshot.data(), status: "declined" });
}

/** Checkout Session作成成功時に呼ぶ。accepted→payment_pending。 */
export async function markBookingRequestPaymentPending(
  spotId: string,
  bookingRequestId: string,
  stripeCheckoutSessionId: string
) {
  const db = getAdminDb();
  const ref = db.doc(`spots/${spotId}/bookingRequests/${bookingRequestId}`);
  await ref.update({
    status: "payment_pending" satisfies BookingRequestStatus,
    stripeCheckoutSessionId,
    updatedAt: FieldValue.serverTimestamp()
  });
}

/** Webhookから呼ぶ。冪等（既にpaidなら何もしない）。 */
export async function markBookingRequestPaid(spotId: string, bookingRequestId: string, stripePaymentIntentId: string) {
  const db = getAdminDb();
  const ref = db.doc(`spots/${spotId}/bookingRequests/${bookingRequestId}`);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.status === "paid") {
    return false;
  }

  await ref.update({
    status: "paid" satisfies BookingRequestStatus,
    stripePaymentIntentId,
    paidAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return true;
}
