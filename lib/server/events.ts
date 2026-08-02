import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { EventEmailInvite, EventParticipant, EventParticipantStatus } from "@/lib/types";

function seatsOf(data: FirebaseFirestore.DocumentData | undefined): number {
  return 1 + Number(data?.plusOneCount ?? 0);
}

/** capacityが設定されている場合、seats分の空きがあるかを判定する。capacity未設定なら常にtrue。 */
function hasRoom(participantCount: number, capacity: number | undefined, seats: number): boolean {
  if (!capacity) return true;
  return participantCount + seats <= capacity;
}

function mapParticipant(uid: string, data: FirebaseFirestore.DocumentData): EventParticipant {
  return {
    uid,
    displayName: typeof data.displayName === "string" && data.displayName ? data.displayName : undefined,
    email: typeof data.email === "string" && data.email ? data.email : undefined,
    status: (data.status as EventParticipantStatus) ?? "accepted",
    joinedAt: data.joinedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    plusOneCount: typeof data.plusOneCount === "number" && data.plusOneCount > 0 ? data.plusOneCount : undefined,
    answers: data.answers && typeof data.answers === "object" ? (data.answers as Record<string, string>) : undefined,
    checkedInAt: data.checkedInAt?.toDate?.().toISOString?.() ?? undefined
  };
}

function mapEmailInvite(id: string, data: FirebaseFirestore.DocumentData): EventEmailInvite {
  return {
    id,
    email: String(data.email ?? ""),
    displayName: typeof data.displayName === "string" && data.displayName ? data.displayName : undefined,
    status: data.status === "redeemed" ? "redeemed" : "sent",
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString()
  };
}

/** オーナーが承認制イベントの参加希望を承諾する。pending→accepted/waitlisted のみ許可。 */
export async function acceptEventParticipant(spotId: string, eventId: string, uid: string) {
  const db = getAdminDb();
  const participantRef = db.doc(`spots/${spotId}/events/${eventId}/participants/${uid}`);
  const eventRef = db.doc(`spots/${spotId}/events/${eventId}`);

  return db.runTransaction(async (transaction) => {
    const [snapshot, eventSnap] = await Promise.all([transaction.get(participantRef), transaction.get(eventRef)]);

    if (!snapshot.exists || snapshot.data()?.status !== "pending") {
      throw new Error("invalid_status_transition");
    }

    const seats = seatsOf(snapshot.data());
    const capacity = Number(eventSnap.data()?.capacity ?? 0) || undefined;
    const participantCount = Number(eventSnap.data()?.participantCount ?? 0);
    const status: EventParticipantStatus = hasRoom(participantCount, capacity, seats) ? "accepted" : "waitlisted";

    transaction.update(participantRef, { status, updatedAt: FieldValue.serverTimestamp() });

    if (status === "accepted") {
      transaction.update(eventRef, {
        participantCount: FieldValue.increment(seats),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return mapParticipant(uid, { ...snapshot.data(), status });
  });
}

/** オーナーが承認制イベントの参加希望を辞退する。pending→declined のみ許可。 */
export async function declineEventParticipant(spotId: string, eventId: string, uid: string) {
  const db = getAdminDb();
  const participantRef = db.doc(`spots/${spotId}/events/${eventId}/participants/${uid}`);
  const snapshot = await participantRef.get();

  if (!snapshot.exists || snapshot.data()?.status !== "pending") {
    throw new Error("invalid_status_transition");
  }

  await participantRef.update({ status: "declined", updatedAt: FieldValue.serverTimestamp() });
  return mapParticipant(uid, { ...snapshot.data(), status: "declined" });
}

/**
 * オーナーが招待制イベントに既存のサポーターを招待する。
 * 対象は現在有効なサポーター（active/canceling）のみ。既に参加記録があるサポーターはスキップする。
 */
export async function inviteEventParticipants(spotId: string, eventId: string, uids: string[]) {
  const db = getAdminDb();
  const uniqueUids = [...new Set(uids)];

  const [memberSnaps, participantSnaps] = await Promise.all([
    db.getAll(...uniqueUids.map((uid) => db.doc(`spots/${spotId}/members/${uid}`))),
    db.getAll(...uniqueUids.map((uid) => db.doc(`spots/${spotId}/events/${eventId}/participants/${uid}`)))
  ]);

  const invited: EventParticipant[] = [];
  const skipped: string[] = [];
  const batch = db.batch();

  uniqueUids.forEach((uid, index) => {
    const memberSnap = memberSnaps[index];
    const memberStatus = memberSnap.data()?.status;
    const alreadyHasRecord = participantSnaps[index].exists;

    if (!memberSnap.exists || (memberStatus !== "active" && memberStatus !== "canceling") || alreadyHasRecord) {
      skipped.push(uid);
      return;
    }

    const data = {
      uid,
      displayName: String(memberSnap.data()?.displayName ?? ""),
      email: String(memberSnap.data()?.email ?? ""),
      status: "invited" as EventParticipantStatus,
      joinedAt: FieldValue.serverTimestamp()
    };

    batch.set(db.doc(`spots/${spotId}/events/${eventId}/participants/${uid}`), data);
    invited.push(mapParticipant(uid, data));
  });

  if (invited.length > 0) {
    await batch.commit();
  }

  return { invited, skipped };
}

/** 招待された本人が招待に応諾/辞退する。invited→accepted(またはwaitlisted)/declined のみ許可。 */
export async function respondToEventInvitation(
  spotId: string,
  eventId: string,
  uid: string,
  decision: "accept" | "decline",
  extra?: { plusOneCount?: number; answers?: Record<string, string> }
) {
  const db = getAdminDb();
  const participantRef = db.doc(`spots/${spotId}/events/${eventId}/participants/${uid}`);
  const eventRef = db.doc(`spots/${spotId}/events/${eventId}`);

  return db.runTransaction(async (transaction) => {
    const [snapshot, eventSnap] = await Promise.all([transaction.get(participantRef), transaction.get(eventRef)]);

    if (!snapshot.exists || snapshot.data()?.status !== "invited") {
      throw new Error("invalid_status_transition");
    }

    if (decision === "decline") {
      transaction.update(participantRef, { status: "declined", updatedAt: FieldValue.serverTimestamp() });
      return mapParticipant(uid, { ...snapshot.data(), status: "declined" });
    }

    const plusOneCount = Math.max(0, Number(extra?.plusOneCount ?? 0));
    const seats = 1 + plusOneCount;
    const capacity = Number(eventSnap.data()?.capacity ?? 0) || undefined;
    const participantCount = Number(eventSnap.data()?.participantCount ?? 0);
    const status: EventParticipantStatus = hasRoom(participantCount, capacity, seats) ? "accepted" : "waitlisted";

    const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      status,
      plusOneCount,
      answers: extra?.answers ?? {},
      updatedAt: FieldValue.serverTimestamp()
    };
    transaction.update(participantRef, updateData);

    if (status === "accepted") {
      transaction.update(eventRef, {
        participantCount: FieldValue.increment(seats),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return mapParticipant(uid, { ...snapshot.data(), ...updateData, status });
  });
}

/** オーナーが招待制イベントに未加入の相手をメールアドレスで招待する。既に同じメールへ送信済み(sent)ならスキップ。 */
export async function createEventEmailInvites(
  spotId: string,
  eventId: string,
  invites: { email: string; displayName?: string }[]
) {
  const db = getAdminDb();
  const normalized = [...new Map(invites.map((i) => [i.email.trim().toLowerCase(), i])).values()].filter(
    (i) => i.email.trim()
  );

  const collectionRef = db.collection(`spots/${spotId}/events/${eventId}/emailInvites`);
  const existingSnap = await collectionRef.where("status", "==", "sent").get();
  const existingEmails = new Set(existingSnap.docs.map((d) => String(d.data().email ?? "").toLowerCase()));

  const created: EventEmailInvite[] = [];
  const skipped: string[] = [];

  await Promise.all(
    normalized.map(async (invite) => {
      const email = invite.email.trim();

      if (existingEmails.has(email.toLowerCase())) {
        skipped.push(email);
        return;
      }

      const data = {
        email,
        displayName: invite.displayName?.trim() ?? "",
        status: "sent" as const,
        createdAt: FieldValue.serverTimestamp()
      };
      const ref = await collectionRef.add(data);
      created.push(mapEmailInvite(ref.id, data));
    })
  );

  return { created, skipped };
}

export async function listEventEmailInvites(spotId: string, eventId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection(`spots/${spotId}/events/${eventId}/emailInvites`).get();
  return snapshot.docs.map((doc) => mapEmailInvite(doc.id, doc.data()));
}

/**
 * メール招待を受け取った本人がログイン後に参加を確定する。
 * オーナーが既に招待した時点で承認は済んでいるため、応諾＝accepted（invitedを経由しない）。
 * 定員超過ならwaitlistedになる。
 */
export async function redeemEventEmailInvite(
  spotId: string,
  eventId: string,
  inviteId: string,
  user: { uid: string; displayName?: string; email?: string },
  extra?: { plusOneCount?: number; answers?: Record<string, string> }
) {
  const db = getAdminDb();
  const inviteRef = db.doc(`spots/${spotId}/events/${eventId}/emailInvites/${inviteId}`);
  const participantRef = db.doc(`spots/${spotId}/events/${eventId}/participants/${user.uid}`);
  const eventRef = db.doc(`spots/${spotId}/events/${eventId}`);

  return db.runTransaction(async (transaction) => {
    const [inviteSnap, participantSnap, eventSnap] = await Promise.all([
      transaction.get(inviteRef),
      transaction.get(participantRef),
      transaction.get(eventRef)
    ]);

    if (!inviteSnap.exists) {
      throw new Error("invite_not_found");
    }

    if (participantSnap.exists) {
      // 既に参加記録がある（別経路で参加済み等）場合は招待を消化済みにするだけ
      transaction.set(inviteRef, { status: "redeemed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return mapParticipant(user.uid, participantSnap.data() ?? {});
    }

    const plusOneCount = Math.max(0, Number(extra?.plusOneCount ?? 0));
    const seats = 1 + plusOneCount;
    const capacity = Number(eventSnap.data()?.capacity ?? 0) || undefined;
    const participantCount = Number(eventSnap.data()?.participantCount ?? 0);
    const status: EventParticipantStatus = hasRoom(participantCount, capacity, seats) ? "accepted" : "waitlisted";

    const data = {
      uid: user.uid,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      status,
      plusOneCount,
      answers: extra?.answers ?? {},
      joinedAt: FieldValue.serverTimestamp()
    };

    transaction.set(participantRef, data);
    if (status === "accepted") {
      transaction.update(eventRef, {
        participantCount: FieldValue.increment(seats),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    transaction.set(inviteRef, { status: "redeemed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return mapParticipant(user.uid, data);
  });
}

/**
 * accepted参加者が抜けて空きが出た際、waitlisted（申込順）を先着で繰り上げる。
 * capacity未設定のイベントでは何もしない。
 */
export async function promoteFromWaitlist(spotId: string, eventId: string) {
  const db = getAdminDb();
  const eventRef = db.doc(`spots/${spotId}/events/${eventId}`);
  const eventSnap = await eventRef.get();
  const capacity = Number(eventSnap.data()?.capacity ?? 0) || undefined;

  if (!capacity) {
    return { promoted: [] as EventParticipant[] };
  }

  const waitlistSnap = await db
    .collection(`spots/${spotId}/events/${eventId}/participants`)
    .where("status", "==", "waitlisted")
    .orderBy("joinedAt", "asc")
    .get();

  const promoted: EventParticipant[] = [];

  for (const doc of waitlistSnap.docs) {
    const seats = seatsOf(doc.data());

    // eslint-disable-next-line no-await-in-loop
    const result = await db.runTransaction(async (transaction) => {
      const [participantSnap, freshEventSnap] = await Promise.all([
        transaction.get(doc.ref),
        transaction.get(eventRef)
      ]);

      if (!participantSnap.exists || participantSnap.data()?.status !== "waitlisted") {
        return null;
      }

      const currentCount = Number(freshEventSnap.data()?.participantCount ?? 0);
      if (!hasRoom(currentCount, capacity, seats)) {
        return null;
      }

      transaction.update(doc.ref, { status: "accepted", updatedAt: FieldValue.serverTimestamp() });
      transaction.update(eventRef, {
        participantCount: FieldValue.increment(seats),
        updatedAt: FieldValue.serverTimestamp()
      });

      return mapParticipant(doc.id, { ...participantSnap.data(), status: "accepted" });
    });

    if (!result) {
      // 先頭のwaitlistが入らない = それ以降も先着順的に入らない可能性が高いので打ち切り
      break;
    }

    promoted.push(result);
  }

  return { promoted };
}

/** オーナーが当日チェックインの有無を切り替える。accepted状態の参加者のみ対象。 */
export async function setEventParticipantCheckIn(
  spotId: string,
  eventId: string,
  uid: string,
  checkedIn: boolean
) {
  const db = getAdminDb();
  const participantRef = db.doc(`spots/${spotId}/events/${eventId}/participants/${uid}`);
  const snapshot = await participantRef.get();

  if (!snapshot.exists || snapshot.data()?.status !== "accepted") {
    throw new Error("invalid_status_transition");
  }

  await participantRef.update({
    checkedInAt: checkedIn ? FieldValue.serverTimestamp() : FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp()
  });

  const updated = await participantRef.get();
  return mapParticipant(uid, updated.data() ?? {});
}
