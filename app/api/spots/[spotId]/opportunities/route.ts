import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendActivityEmail } from "@/lib/server/mailer";

async function identity(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try { return await getAdminAuth().verifyIdToken(auth.slice(7)); } catch { return null; }
}
async function context(spotId: string, uid: string) {
  const spot = getAdminDb().doc(`spots/${spotId}`);
  const [doc, follower, member] = await Promise.all([spot.get(), spot.collection("followers").doc(uid).get(), spot.collection("members").doc(uid).get()]);
  return { spot, doc, owner: doc.data()?.ownerUid === uid, supporter: follower.exists || ["active", "canceling"].includes(member.data()?.status) };
}
function allowed(scope: unknown, owner: boolean, supporter: boolean) { return owner || scope === "public" || (scope === "supporters" && supporter); }

export async function GET(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const user = await identity(req); if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const { spotId } = await params, c = await context(spotId, user.uid);
    if (!c.doc.exists || (!c.owner && (!c.doc.data()?.isPublished || c.doc.data()?.isSuspended))) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const docs = await c.spot.collection("opportunities").orderBy("createdAt", "desc").limit(30).get();
    const opportunities = await Promise.all(docs.docs.filter((d) => allowed(d.data().scope, c.owner, c.supporter)).map(async (d) => {
      const data = d.data();
      const own = await d.ref.collection("applications").doc(user.uid).get();
      const applications = c.owner ? (await d.ref.collection("applications").get()).docs.map((v) => ({ uid: v.id, name: v.data().name, email: v.data().email, createdAt: v.data().createdAt })) : undefined;
      return { id: d.id, title: data.title, body: data.body, scope: data.scope, deadline: data.deadline, status: data.status, createdAt: data.createdAt, applied: own.exists, owner: c.owner, applications };
    }));
    return NextResponse.json({ opportunities }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const user = await identity(req); if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const { spotId } = await params, c = await context(spotId, user.uid); if (!c.owner) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const input = await req.json(), title = typeof input.title === "string" ? input.title.trim() : "", body = typeof input.body === "string" ? input.body.trim() : "", deadline = input.deadline || null;
    if (!title || title.length > 200 || !body || body.length > 5000 || !["public", "supporters"].includes(input.scope) || (deadline && (typeof deadline !== "string" || !Number.isFinite(Date.parse(deadline)) || Date.parse(deadline) <= Date.now()))) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const ref = await c.spot.collection("opportunities").add({ title, body, scope: input.scope, deadline, status: "open", createdAt: new Date().toISOString(), createdBy: user.uid });
    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const user = await identity(req); if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const { spotId } = await params, input = await req.json();
    if (typeof input.id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(input.id) || !["apply", "cancel", "close"].includes(input.action)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const db = getAdminDb(), spot = db.doc(`spots/${spotId}`), opportunity = spot.collection("opportunities").doc(input.id), application = opportunity.collection("applications").doc(user.uid);
    const authUser = input.action === "apply" ? await getAdminAuth().getUser(user.uid) : null;
    if (input.action === "apply" && (!authUser?.email || !authUser.emailVerified)) return NextResponse.json({ error: "verified_email_required" }, { status: 400 });
    const notice = await db.runTransaction(async (tx) => {
      const [s, o, a, f, m, profile] = await Promise.all([tx.get(spot), tx.get(opportunity), tx.get(application), tx.get(spot.collection("followers").doc(user.uid)), tx.get(spot.collection("members").doc(user.uid)), tx.get(db.doc(`users/${user.uid}`))]);
      const data = o.data(), owner = s.data()?.ownerUid === user.uid, supporter = f.exists || ["active", "canceling"].includes(m.data()?.status);
      if (!data || !s.exists) throw Error("not_found");
      if (input.action === "close") { if (!owner) throw Error("forbidden"); tx.update(opportunity, { status: "closed" }); return null; }
      if (input.action === "cancel") { if (a.exists) tx.delete(application); return null; }
      if (owner || !s.data()?.isPublished || s.data()?.isSuspended || !allowed(data.scope, false, supporter) || data.status !== "open" || (data.deadline && Date.parse(data.deadline) <= Date.now())) throw Error("forbidden");
      if (a.exists) return null;
      const ownerUid = String(s.data()?.ownerUid ?? "");
      const ownerProfile = ownerUid ? await tx.get(db.doc(`users/${ownerUid}`)) : null;
      const name = String(profile.data()?.profileDisplayName || authUser?.displayName || "SPOT会員");
      tx.create(application, { name, email: authUser!.email, createdAt: new Date().toISOString() });
      const settings = ownerProfile?.data()?.notificationPreferences?.applications;
      if (ownerUid && settings?.inApp !== false) tx.create(db.collection(`users/${ownerUid}/notifications`).doc(), { type: "new_application", title: "募集に申し出がありました", body: String(data.title), spotId, spotName: String(s.data()?.name ?? ""), resourceId: input.id, isRead: false, createdAt: FieldValue.serverTimestamp() });
      return ownerUid && settings?.email !== false ? { ownerUid, spotName: String(s.data()?.name ?? ""), title: String(data.title) } : null;
    });
    if (notice) {
      try {
        const owner = await getAdminAuth().getUser(notice.ownerUid);
        if (owner.email) await sendActivityEmail({ to: owner.email, displayName: "", spotId, spotName: notice.spotName, title: "募集に申し出がありました", body: notice.title, destination: "/" });
      } catch (error) { console.error("[opportunities] notification email failed", error); }
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "action_failed" }, { status: 400 }); }
}
