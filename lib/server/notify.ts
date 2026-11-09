import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { sendActivityEmails } from "@/lib/server/mailer";
import { canReceiveActivity } from "@/lib/server/notification-audience";

export type ActivityType = "new_post" | "new_event" | "new_poll" | "new_opportunity";
type Scope = "public" | "supporters" | "paid";
type NotifyPayload = { type: ActivityType; title: string; body: string; spotId: string; spotName: string; resourceId: string; scope: Scope; minPlanAmount?: number };
const preferenceKey: Record<ActivityType, string> = { new_post: "posts", new_event: "events", new_poll: "polls", new_opportunity: "opportunities" };

export async function notifySpotMembers(payload: NotifyPayload) {
  const db = getAdminDb();
  const base = db.doc(`spots/${payload.spotId}`);
  const [active, canceling, followers] = await Promise.all([
    base.collection("members").where("status", "==", "active").get(),
    base.collection("members").where("status", "==", "canceling").get(),
    payload.scope !== "paid" ? base.collection("followers").get() : Promise.resolve(null),
  ]);
  const recipients = new Map<string, { uid: string; email: string; name: string }>();
  for (const member of [...active.docs, ...canceling.docs]) {
    const data = member.data();
    if (!canReceiveActivity(payload.scope, payload.minPlanAmount ?? 0, { status: data.status, planAmount: data.planAmount }, false)) continue;
    recipients.set(member.id, { uid: member.id, email: String(data.email ?? ""), name: String(data.displayName ?? "") });
  }
  for (const follower of followers?.docs ?? []) {
    if (!recipients.has(follower.id) && canReceiveActivity(payload.scope, payload.minPlanAmount ?? 0, null, true)) recipients.set(follower.id, { uid: follower.id, email: "", name: "" });
  }
  const entries = [...recipients.values()];
  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100);
    const profiles = await Promise.all(chunk.map((entry) => db.doc(`users/${entry.uid}`).get()));
    const missing = chunk.filter((entry) => !entry.email).map((entry) => ({ uid: entry.uid }));
    const authUsers = missing.length ? await getAdminAuth().getUsers(missing).catch((error) => { console.error("[notification] recipient lookup failed", error); return null; }) : null;
    const emails = new Map(authUsers?.users.map((user) => [user.uid, user.email ?? ""]) ?? []);
    const batch = db.batch();
    const mails: { to: string; displayName: string }[] = [];
    chunk.forEach((entry, index) => {
      const prefs = profiles[index].data()?.notificationPreferences?.[preferenceKey[payload.type]];
      if (prefs?.inApp !== false) {
        batch.set(db.collection(`users/${entry.uid}/notifications`).doc(), { type: payload.type, title: payload.title, body: payload.body, spotId: payload.spotId, spotName: payload.spotName, resourceId: payload.resourceId, isRead: false, createdAt: FieldValue.serverTimestamp() });
      }
      const email = entry.email || emails.get(entry.uid);
      if (prefs?.email !== false && email) mails.push({ to: email, displayName: entry.name });
    });
    await batch.commit();
    const destination = payload.type === "new_post" ? `/spots/${payload.spotId}/posts/${payload.resourceId}` : payload.type === "new_event" ? `/spots/${payload.spotId}/events/${payload.resourceId}` : "/";
    try { await sendActivityEmails(mails, { ...payload, destination }); }
    catch (error) { console.error("[notification] email delivery failed", error); }
  }
}
