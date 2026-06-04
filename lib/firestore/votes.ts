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
