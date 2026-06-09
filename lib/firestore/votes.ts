import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { OpinionBoxEntry, PollOption, SpotVote, VoteResponse, VoteType } from "@/lib/types";

const VOTE_WAITING_DAYS = 30;

/**
 * 再登録後30日以内かどうかをチェックしてアンケート投票権を返す。
 * - 初回登録（canceledAt なし）→ 投票可
 * - 解約→再登録で joinedAt が canceledAt より後かつ30日未満 → 投票不可
 */
export async function getVotingEligibility(
  spotId: string,
  uid: string
): Promise<{ eligible: boolean; waitUntil?: Date }> {
  const memberSnap = await getDoc(
    doc(getFirestoreDb(), "spots", spotId, "members", uid)
  );
  if (!memberSnap.exists()) return { eligible: false };

  const data = memberSnap.data();
  const canceledAt = data.canceledAt?.toDate?.() as Date | undefined;
  const joinedAt = data.joinedAt?.toDate?.() as Date | undefined;

  if (!canceledAt || !joinedAt) return { eligible: true };

  // 再登録（joinedAt が canceledAt より後）かどうか
  if (joinedAt <= canceledAt) return { eligible: true };

  const waitUntil = new Date(joinedAt.getTime() + VOTE_WAITING_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now < waitUntil) {
    return { eligible: false, waitUntil };
  }

  return { eligible: true };
}

// ─── votes コレクション ───────────────────────────────────────────────

function votesCol(spotId: string) {
  return collection(getFirestoreDb(), "spots", spotId, "votes");
}
function voteDoc(spotId: string, voteId: string) {
  return doc(getFirestoreDb(), "spots", spotId, "votes", voteId);
}
function responsesCol(spotId: string, voteId: string) {
  return collection(getFirestoreDb(), "spots", spotId, "votes", voteId, "responses");
}
function responseDoc(spotId: string, voteId: string, uid: string) {
  return doc(getFirestoreDb(), "spots", spotId, "votes", voteId, "responses", uid);
}

export async function createVote(
  spotId: string,
  data: {
    type: VoteType;
    title: string;
    body?: string;
    options?: PollOption[];
    deadline?: string;
    createdBy: string;
  }
): Promise<string> {
  const ref = await addDoc(votesCol(spotId), {
    spotId,
    type: data.type,
    status: "open",
    title: data.title,
    body: data.body ?? "",
    options: data.options ?? [],
    deadline: data.deadline ?? null,
    responseCount: 0,
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function listVotes(spotId: string): Promise<SpotVote[]> {
  const snap = await getDocs(
    query(votesCol(spotId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SpotVote));
}

export async function listOpenVotes(spotId: string): Promise<SpotVote[]> {
  const snap = await getDocs(
    query(votesCol(spotId), where("status", "==", "open"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SpotVote));
}

export async function deleteVote(spotId: string, voteId: string): Promise<void> {
  await deleteDoc(voteDoc(spotId, voteId));
}

export async function closeVote(spotId: string, voteId: string): Promise<void> {
  await updateDoc(voteDoc(spotId, voteId), {
    status: "closed",
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserResponse(
  spotId: string,
  voteId: string,
  uid: string
): Promise<VoteResponse | null> {
  const snap = await getDoc(responseDoc(spotId, voteId, uid));
  if (!snap.exists()) return null;
  return snap.data() as VoteResponse;
}

export async function submitResponse(
  spotId: string,
  voteId: string,
  uid: string,
  data: { optionId?: string; text?: string; amount: number }
): Promise<void> {
  const { eligible, waitUntil } = await getVotingEligibility(spotId, uid);
  if (!eligible) {
    const msg = waitUntil
      ? `再登録から${VOTE_WAITING_DAYS}日間は投票できません（${waitUntil.toLocaleDateString("ja-JP")}以降に解禁）`
      : "投票権がありません";
    throw new Error(msg);
  }

  await runTransaction(getFirestoreDb(), async (tx) => {
    const resRef = responseDoc(spotId, voteId, uid);
    const existing = await tx.get(resRef);
    if (existing.exists()) throw new Error("already_responded");

    tx.set(resRef, {
      uid,
      optionId: data.optionId ?? null,
      text: data.text ?? null,
      amount: data.amount,
      createdAt: new Date().toISOString(),
    });
    tx.update(voteDoc(spotId, voteId), {
      responseCount: increment(1),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function listResponses(
  spotId: string,
  voteId: string
): Promise<VoteResponse[]> {
  const snap = await getDocs(
    query(responsesCol(spotId, voteId), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => d.data() as VoteResponse);
}

// ─── opinion box ─────────────────────────────────────────────────────

function opinionsCol(spotId: string) {
  return collection(getFirestoreDb(), "spots", spotId, "opinions");
}

export async function submitOpinion(
  spotId: string,
  uid: string,
  text: string,
  amount: number
): Promise<void> {
  await addDoc(opinionsCol(spotId), {
    text,
    uid,
    amount,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

export async function listOpinions(spotId: string): Promise<OpinionBoxEntry[]> {
  const snap = await getDocs(
    query(opinionsCol(spotId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OpinionBoxEntry));
}

export async function markOpinionRead(spotId: string, opinionId: string): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "spots", spotId, "opinions", opinionId), { isRead: true });
}

export async function setOpinionBoxEnabled(spotId: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "spots", spotId), { opinionBoxEnabled: enabled });
}
