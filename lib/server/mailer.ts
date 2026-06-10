import { render } from "@react-email/components";
import { resend, FROM_ADDRESS } from "@/lib/resend/client";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAdminEmails } from "@/lib/auth/admin";
import { SocioWelcomeEmail } from "@/lib/resend/templates/socio-welcome";
import { SocioCancelingEmail } from "@/lib/resend/templates/socio-canceling";
import { PaymentFailedEmail } from "@/lib/resend/templates/payment-failed";
import { OwnerNewSocioEmail } from "@/lib/resend/templates/owner-new-socio";
import { OwnerSocioLeftEmail } from "@/lib/resend/templates/owner-socio-left";
import { OwnerOpinionEmail } from "@/lib/resend/templates/owner-opinion";
import { SociosNewPostEmail } from "@/lib/resend/templates/socios-new-post";
import { SociosNewEventEmail } from "@/lib/resend/templates/socios-new-event";
import { AdminNewSpotEmail } from "@/lib/resend/templates/admin-new-spot";

// Resend未設定時は静かにスキップ
async function send(to: string | string[], subject: string, element: React.ReactElement) {
  if (!resend) {
    console.warn("[mailer] RESEND_API_KEY not set, skipping email");
    return;
  }
  const html = await render(element);
  await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
}

// SPOTのアクティブ応援会員のメールアドレスを取得
async function getActiveSocioEmails(spotId: string): Promise<{ email: string; displayName: string }[]> {
  const db = getAdminDb();
  const [activeSnap, cancelingSnap] = await Promise.all([
    db.collection(`spots/${spotId}/members`).where("status", "==", "active").get(),
    db.collection(`spots/${spotId}/members`).where("status", "==", "canceling").get(),
  ]);
  return [...activeSnap.docs, ...cancelingSnap.docs]
    .map((d) => ({ email: String(d.data().email ?? ""), displayName: String(d.data().displayName ?? "") }))
    .filter((m) => m.email);
}

// SPOTオーナーのメールアドレスを取得
async function getOwnerEmail(spotId: string): Promise<string | null> {
  const db = getAdminDb();
  const spotSnap = await db.doc(`spots/${spotId}`).get();
  if (!spotSnap.exists) return null;
  const ownerUid = spotSnap.data()?.ownerUid;
  if (!ownerUid) return null;
  const userRecord = await db.doc(`users/${ownerUid}`).get();
  return String(userRecord.data()?.email ?? "") || null;
}

// ─── 応援会員向け ──────────────────────────────────────────────────────────────

export async function sendSocioWelcome(params: {
  to: string;
  spotName: string;
  spotId: string;
  planAmount: number;
  displayName: string;
}) {
  await send(
    params.to,
    `${params.spotName}の応援会員登録が完了しました`,
    SocioWelcomeEmail(params) as unknown as React.ReactElement
  );
}

export async function sendSocioCanceling(params: {
  to: string;
  spotName: string;
  spotId: string;
  displayName: string;
  periodEnd: string;
}) {
  await send(
    params.to,
    `${params.spotName}の応援会員解約手続きを受け付けました`,
    SocioCancelingEmail(params) as unknown as React.ReactElement
  );
}

export async function sendPaymentFailed(params: {
  to: string;
  spotName: string;
  displayName: string;
  portalUrl: string;
}) {
  await send(
    params.to,
    `【重要】${params.spotName}のお支払いに失敗しました`,
    PaymentFailedEmail(params) as unknown as React.ReactElement
  );
}

// ─── オーナー向け ─────────────────────────────────────────────────────────────

export async function sendOwnerNewSocio(params: {
  spotId: string;
  spotName: string;
  socioName: string;
  socioAffiliation: string;
  planAmount: number;
  totalSocios: number;
}) {
  const ownerEmail = await getOwnerEmail(params.spotId);
  if (!ownerEmail) return;
  await send(
    ownerEmail,
    `【${params.spotName}】新しい応援会員が加入しました`,
    OwnerNewSocioEmail({ ...params }) as unknown as React.ReactElement
  );
}

export async function sendOwnerSocioLeft(params: {
  spotId: string;
  spotName: string;
  socioName: string;
  totalSocios: number;
}) {
  const ownerEmail = await getOwnerEmail(params.spotId);
  if (!ownerEmail) return;
  await send(
    ownerEmail,
    `【${params.spotName}】応援会員が解約しました`,
    OwnerSocioLeftEmail({ ...params }) as unknown as React.ReactElement
  );
}

export async function sendOwnerOpinion(params: {
  spotId: string;
  spotName: string;
  question: string;
  answer: string;
  socioName: string;
}) {
  const ownerEmail = await getOwnerEmail(params.spotId);
  if (!ownerEmail) return;
  await send(
    ownerEmail,
    `【${params.spotName}】新しい意見が届きました`,
    OwnerOpinionEmail({ ...params }) as unknown as React.ReactElement
  );
}

// ─── 応援会員全員向け ───────────────────────────────────────────────────────────

export async function sendSociosNewPost(params: {
  spotId: string;
  spotName: string;
  postTitle: string;
  postBody: string;
}) {
  const socios = await getActiveSocioEmails(params.spotId);
  if (socios.length === 0) return;

  // Resendは1回のAPIで最大50件
  const chunks: typeof socios[] = [];
  for (let i = 0; i < socios.length; i += 50) chunks.push(socios.slice(i, i + 50));

  await Promise.all(
    chunks.map((chunk) =>
      Promise.all(
        chunk.map((s) =>
          send(
            s.email,
            `【${params.spotName}】新しいお知らせ: ${params.postTitle}`,
            SociosNewPostEmail({ ...params, displayName: s.displayName }) as unknown as React.ReactElement
          )
        )
      )
    )
  );
}

export async function sendSociosNewEvent(params: {
  spotId: string;
  spotName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventPlace: string;
}) {
  const socios = await getActiveSocioEmails(params.spotId);
  if (socios.length === 0) return;

  const chunks: typeof socios[] = [];
  for (let i = 0; i < socios.length; i += 50) chunks.push(socios.slice(i, i + 50));

  await Promise.all(
    chunks.map((chunk) =>
      Promise.all(
        chunk.map((s) =>
          send(
            s.email,
            `【${params.spotName}】新しいイベント: ${params.eventTitle}`,
            SociosNewEventEmail({ ...params, displayName: s.displayName }) as unknown as React.ReactElement
          )
        )
      )
    )
  );
}

// ─── 管理者向け ───────────────────────────────────────────────────────────────

export async function sendAdminNewSpot(params: {
  spotName: string;
  spotId: string;
  category: string;
  ownerEmail: string;
  prefecture: string;
}) {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return;
  await send(
    adminEmails,
    `【SPOT管理】新規SPOT登録: ${params.spotName}`,
    AdminNewSpotEmail({ ...params }) as unknown as React.ReactElement
  );
}
