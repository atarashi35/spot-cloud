import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { NotificationType } from "@/lib/types";

type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  spotId: string;
  spotName: string;
  resourceId?: string;
};

export async function notifySpotMembers(payload: NotifyPayload) {
  const db = getAdminDb();

  // active / canceling のメンバーを取得
  const [activeSnap, cancelingSnap] = await Promise.all([
    db.collection(`spots/${payload.spotId}/members`).where("status", "==", "active").get(),
    db.collection(`spots/${payload.spotId}/members`).where("status", "==", "canceling").get()
  ]);

  const uids = [
    ...activeSnap.docs.map((d) => d.data().uid as string),
    ...cancelingSnap.docs.map((d) => d.data().uid as string)
  ].filter(Boolean);

  if (uids.length === 0) return;

  // Firestoreバッチは500件上限なので分割
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 499) {
    chunks.push(uids.slice(i, i + 499));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      const batch = db.batch();
      chunk.forEach((uid) => {
        const ref = db.collection(`users/${uid}/notifications`).doc();
        batch.set(ref, {
          type: payload.type,
          title: payload.title,
          body: payload.body,
          spotId: payload.spotId,
          spotName: payload.spotName,
          resourceId: payload.resourceId ?? null,
          isRead: false,
          createdAt: FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    })
  );
}
