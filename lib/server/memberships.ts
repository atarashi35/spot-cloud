import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { MembershipStatus, PlanAmount, SocioAgeRange, SocioGender } from "@/lib/types";

type MembershipPayload = {
  uid: string;
  displayName?: string;
  email?: string;
  affiliation?: string;
  ageRange?: SocioAgeRange;
  gender?: SocioGender;
  address?: string;
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
    const previousStatus = snapshot.exists ? (snapshot.data()?.status as string | null) : null;

    // "active" と "canceling" はどちらも請求中 → socioCount に含める
    const isPaying = (s: string | null) => s === "active" || s === "canceling";
    const becameActive = !isPaying(previousStatus) && isPaying(payload.status);
    const becameInactive = isPaying(previousStatus) && !isPaying(payload.status);

    // 解約確定時に canceledAt を記録。再登録時は既存の canceledAt を保持（merge で残る）。
    const canceledAtField: Record<string, unknown> = {};
    if (becameInactive) {
      canceledAtField.canceledAt = FieldValue.serverTimestamp();
    }

    transaction.set(
      memberRef,
      {
        uid: payload.uid,
        displayName: payload.displayName ?? "",
        email: payload.email ?? "",
        affiliation: payload.affiliation ?? "",
        ageRange: payload.ageRange ?? "",
        gender: payload.gender ?? "",
        address: payload.address ?? "",
        planAmount: payload.planAmount,
        stripeCustomerId: payload.stripeCustomerId,
        stripeSubscriptionId: payload.stripeSubscriptionId,
        status: payload.status,
        joinedAt: snapshot.exists ? snapshot.data()?.joinedAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        ...canceledAtField,
      },
      { merge: true }
    );

    transaction.set(
      membershipRef,
      {
        spotId: payload.spotId,
        spotName: payload.spotName,
        affiliation: payload.affiliation ?? "",
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
    displayName: String(member.displayName ?? ""),
    email: String(member.email ?? ""),
    affiliation: String(member.affiliation ?? ""),
    ageRange: String(member.ageRange ?? "") as SocioAgeRange,
    gender: String(member.gender ?? "") as SocioGender,
    spotId,
    spotName,
    planAmount: Number(member.planAmount ?? 500) as PlanAmount,
    stripeCustomerId: String(member.stripeCustomerId ?? ""),
    stripeSubscriptionId: String(member.stripeSubscriptionId ?? ""),
    status: member.status as MembershipStatus
  };
}

/**
 * users/{uid}/memberships に存在するが spots/{spotId}/members/{uid} が欠けている場合に補完する。
 * claim-memberships API から呼び出す。
 */
export async function repairMissingMemberDocs(uid: string) {
  const db = getAdminDb();
  const membershipsSnap = await db.collection(`users/${uid}/memberships`).get();
  if (membershipsSnap.empty) return { repairedCount: 0 };

  let repairedCount = 0;

  await Promise.all(
    membershipsSnap.docs.map(async (membershipDoc) => {
      const spotId = membershipDoc.id;
      const memberRef = db.doc(`spots/${spotId}/members/${uid}`);
      const memberSnap = await memberRef.get();

      if (memberSnap.exists) return; // 既に存在する

      const data = membershipDoc.data();
      // spots側ドキュメントが欠けているため最低限の情報で補完
      await memberRef.set({
        uid,
        displayName: "",
        email: "",
        affiliation: String(data.affiliation ?? ""),
        ageRange: "",
        gender: "",
        planAmount: Number(data.planAmount ?? 100),
        stripeCustomerId: "",
        stripeSubscriptionId: "",
        status: data.status ?? "active",
        joinedAt: data.joinedAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      repairedCount++;
    })
  );

  return { repairedCount };
}

export async function reconcileMembershipsByEmail(uid: string, email: string) {
  const normalizedEmail = email.trim();

  if (!uid || !normalizedEmail) {
    return { reconciledCount: 0 };
  }

  const db = getAdminDb();
  const snapshot = await db
    .collectionGroup("members")
    .where("email", "==", normalizedEmail)
    .get();

  let reconciledCount = 0;

  for (const doc of snapshot.docs) {
    const spotId = doc.ref.parent.parent?.id;

    if (!spotId) {
      continue;
    }

    const sourceUid = String(doc.data().uid ?? doc.id);
    const sourceMemberRef = db.doc(`spots/${spotId}/members/${sourceUid}`);
    const targetMemberRef = db.doc(`spots/${spotId}/members/${uid}`);
    const sourceMembershipRef = db.doc(`users/${sourceUid}/memberships/${spotId}`);
    const targetMembershipRef = db.doc(`users/${uid}/memberships/${spotId}`);
    const spotRef = db.doc(`spots/${spotId}`);

    await db.runTransaction(async (transaction) => {
      // Firestoreトランザクションは全 read を write より先に行う必要があるため
      // すべてのドキュメントを最初にまとめて取得する
      const [sourceMemberSnap, targetMemberSnap, sourceMembershipSnap, targetMembershipSnap, spotSnap] =
        await Promise.all([
          transaction.get(sourceMemberRef),
          transaction.get(targetMemberRef),
          transaction.get(sourceMembershipRef),
          transaction.get(targetMembershipRef),
          transaction.get(spotRef)
        ]);

      if (!sourceMemberSnap.exists) {
        return;
      }

      const sourceMember = sourceMemberSnap.data() ?? {};
      const sourceMembership = sourceMembershipSnap.exists ? sourceMembershipSnap.data() ?? {} : {};
      const joinedAt =
        sourceMember.joinedAt ??
        sourceMembership.joinedAt ??
        FieldValue.serverTimestamp();
      const targetMember = targetMemberSnap.exists ? targetMemberSnap.data() ?? {} : {};
      const targetMembership = targetMembershipSnap.exists ? targetMembershipSnap.data() ?? {} : {};
      const spotName =
        String(sourceMembership.spotName ?? "") || String(spotSnap.data()?.name ?? "");
      const planAmount = Number(
        sourceMember.planAmount ?? sourceMembership.planAmount ?? 100
      ) as PlanAmount;
      const status = (sourceMember.status ?? sourceMembership.status ?? "active") as MembershipStatus;

      // ── ターゲット側の既存状態を確認して socioCount のずれを防ぐ ──────────
      const isPaying = (s: string | null | undefined) => s === "active" || s === "canceling";
      const targetPreviousStatus = targetMemberSnap.exists
        ? (targetMemberSnap.data()?.status as string | null)
        : null;
      const keepTargetMembership = isPaying(targetPreviousStatus) && !isPaying(status);
      const resolvedStatus = keepTargetMembership
        ? (targetPreviousStatus as MembershipStatus)
        : status;
      const resolvedJoinedAt =
        targetMember.joinedAt ??
        targetMembership.joinedAt ??
        joinedAt;

      transaction.set(
        targetMemberRef,
        {
          ...(keepTargetMembership ? sourceMember : {}),
          ...targetMember,
          ...(!keepTargetMembership ? sourceMember : {}),
          uid,
          email: normalizedEmail,
          joinedAt: resolvedJoinedAt,
          status: resolvedStatus,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      transaction.set(
        targetMembershipRef,
        {
          spotId,
          spotName: String(targetMembership.spotName ?? "") || spotName,
          affiliation: String(
            targetMembership.affiliation ??
              targetMember.affiliation ??
              sourceMember.affiliation ??
              sourceMembership.affiliation ??
              ""
          ),
          planAmount: keepTargetMembership
            ? (Number(
                targetMembership.planAmount ?? targetMember.planAmount ?? planAmount
              ) as PlanAmount)
            : planAmount,
          status: resolvedStatus,
          joinedAt: resolvedJoinedAt,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      if (sourceUid !== uid) {
        transaction.delete(sourceMemberRef);

        if (sourceMembershipSnap.exists) {
          transaction.delete(sourceMembershipRef);
        }

        // socioCount の調整:
        // source が paying で target が paying でなかった場合 → 実質変化なし（sourceが既にカウント済み）
        // source が paying で target も paying だった場合 → source 削除でカウントが減るので +1 補正
        if (isPaying(status) && isPaying(targetPreviousStatus)) {
          // ターゲットに既存 active/canceling があり、source を削除しても count を維持する
          transaction.update(spotRef, {
            socioCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          });
        } else if (!isPaying(status) && !isPaying(targetPreviousStatus)) {
          // 両方 non-paying → カウント変化なし
        }
        // isPaying(status) && !isPaying(targetPreviousStatus):
        //   source の paying はそのままカウントに残る（doc が uid に移るだけ） → 変化なし
      }
    });

    reconciledCount += 1;
  }

  return { reconciledCount };
}
