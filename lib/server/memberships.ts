import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { MembershipStatus, PlanAmount } from "@/lib/types";

type MembershipPayload = {
  uid: string;
  spotId: string;
  spotName: string;
  planAmount: PlanAmount;
  status: MembershipStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

export async function upsertMembership(payload: MembershipPayload) {
  const db = getAdminDb();
  const memberRef = db.doc(`spots/${payload.spotId}/members/${payload.uid}`);
  const membershipRef = db.doc(`users/${payload.uid}/memberships/${payload.spotId}`);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(memberRef);
    const previousStatus = snapshot.exists ? snapshot.data()?.status : null;
    const becameActive = previousStatus !== "active" && payload.status === "active";
    const becameInactive = previousStatus === "active" && payload.status !== "active";

    transaction.set(
      memberRef,
      {
        uid: payload.uid,
        planAmount: payload.planAmount,
        stripeCustomerId: payload.stripeCustomerId,
        stripeSubscriptionId: payload.stripeSubscriptionId,
        status: payload.status,
        joinedAt: snapshot.exists ? snapshot.data()?.joinedAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    transaction.set(
      membershipRef,
      {
        spotId: payload.spotId,
        spotName: payload.spotName,
        planAmount: payload.planAmount,
        status: payload.status,
        joinedAt: snapshot.exists ? snapshot.data()?.joinedAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    if (becameActive) {
      transaction.update(db.doc(`spots/${payload.spotId}`), {
        socioCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    if (becameInactive) {
      transaction.update(db.doc(`spots/${payload.spotId}`), {
        socioCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  });
}

export async function getMembershipBySubscriptionId(subscriptionId: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collectionGroup("members")
    .where("stripeSubscriptionId", "==", subscriptionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const member = doc.data();
  const spotId = doc.ref.parent.parent?.id;

  if (!spotId) {
    return null;
  }

  const spotSnapshot = await db.doc(`spots/${spotId}`).get();
  const spotName = String(spotSnapshot.data()?.name ?? "");

  return {
    uid: String(member.uid ?? ""),
    spotId,
    spotName,
    planAmount: Number(member.planAmount ?? 500) as PlanAmount,
    stripeCustomerId: String(member.stripeCustomerId ?? ""),
    stripeSubscriptionId: String(member.stripeSubscriptionId ?? ""),
    status: member.status as MembershipStatus
  };
}
