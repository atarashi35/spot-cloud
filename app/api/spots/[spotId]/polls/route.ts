import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

async function viewer(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try { return await getAdminAuth().verifyIdToken(header.slice(7)); } catch { return null; }
}

async function access(spotId: string, uid: string) {
  const db = getAdminDb();
  const [spot, follower, member] = await Promise.all([
    db.doc(`spots/${spotId}`).get(), db.doc(`spots/${spotId}/followers/${uid}`).get(), db.doc(`spots/${spotId}/members/${uid}`).get(),
  ]);
  const info = spot.data();
  const owner = info?.ownerUid === uid;
  const paid = ["active", "canceling"].includes(member.data()?.status);
  return { spot, owner, paid, supporter: paid || follower.exists };
}

function canView(scope: unknown, owner: boolean, supporter: boolean, paid: boolean) {
  return owner || scope === "public" || (scope === "supporters" && supporter) || (scope === "paid" && paid);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const identity = await viewer(req);
  if (!identity) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const { spotId } = await params;
    const state = await access(spotId, identity.uid);
    if (!state.spot.exists || (!state.owner && (!state.spot.data()?.isPublished || state.spot.data()?.isSuspended))) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const snap = await state.spot.ref.collection("polls").orderBy("createdAt", "desc").limit(30).get();
    const polls = await Promise.all(snap.docs.filter((doc) => canView(doc.data().scope, state.owner, state.supporter, state.paid)).map(async (doc) => {
      const data = doc.data();
      const response = await doc.ref.collection("responses").doc(identity.uid).get();
      return { id: doc.id, title: data.title, body: data.body, options: data.options, scope: data.scope, deadline: data.deadline, multiple: data.multiple, createdAt: data.createdAt, counts: data.counts, responseCount: data.responseCount, selected: response.data()?.optionIds ?? [], canVote: !state.owner };
    }));
    return NextResponse.json({ polls }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "polls_unavailable" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const identity = await viewer(req);
  if (!identity) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const { spotId } = await params;
    const state = await access(spotId, identity.uid);
    if (!state.owner) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const data = await req.json();
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const body = typeof data.body === "string" ? data.body.trim() : "";
    const options = Array.isArray(data.options) ? data.options.map((v: unknown) => typeof v === "string" ? v.trim() : "").filter(Boolean) : [];
    const scope = data.scope;
    const deadline = data.deadline || null;
    if (!title || title.length > 200 || body.length > 5000 || options.length < 2 || options.length > 20 || options.some((x: string) => x.length > 200) || !["public", "supporters", "paid"].includes(scope) || (deadline && (typeof deadline !== "string" || !Number.isFinite(Date.parse(deadline)) || Date.parse(deadline) <= Date.now()))) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const ref = await state.spot.ref.collection("polls").add({ title, body, options: options.map((text: string, i: number) => ({ id: String(i), text })), scope, deadline, multiple: Boolean(data.multiple), counts: {}, responseCount: 0, createdAt: new Date().toISOString(), createdBy: identity.uid });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const identity = await viewer(req);
  if (!identity) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const { spotId } = await params;
    const input = await req.json();
    if (typeof input.pollId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(input.pollId) || !Array.isArray(input.optionIds)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const db = getAdminDb();
    const spot = db.doc(`spots/${spotId}`), poll = spot.collection("polls").doc(input.pollId), response = poll.collection("responses").doc(identity.uid);
    await db.runTransaction(async (tx) => {
      const [s, p, previous, f, m] = await Promise.all([tx.get(spot), tx.get(poll), tx.get(response), tx.get(spot.collection("followers").doc(identity.uid)), tx.get(spot.collection("members").doc(identity.uid))]);
      const data = p.data(), owner = s.data()?.ownerUid === identity.uid, paid = ["active", "canceling"].includes(m.data()?.status);
      if (!s.exists || !s.data()?.isPublished || s.data()?.isSuspended || !data || owner || !canView(data.scope, false, paid || f.exists, paid)) throw new Error("forbidden");
      if (previous.exists || (data.deadline && Date.parse(data.deadline) <= Date.now())) throw new Error("closed");
      const chosen = [...new Set(input.optionIds)] as unknown[];
      if (!chosen.length || (!data.multiple && chosen.length !== 1) || chosen.some((id) => typeof id !== "string" || !data.options.some((o: {id: string}) => o.id === id))) throw new Error("invalid_input");
      const changes: Record<string, unknown> = { responseCount: FieldValue.increment(1) };
      for (const id of chosen) changes[`counts.${id}`] = FieldValue.increment(1);
      tx.create(response, { uid: identity.uid, optionIds: chosen, createdAt: new Date().toISOString() });
      tx.update(poll, changes);
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "vote_failed" }, { status: 400 }); }
}
