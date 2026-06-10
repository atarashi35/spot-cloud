import { Metadata } from "next";
import Link from "next/link";
import { Timestamp } from "firebase-admin/firestore";
import { PageShell } from "@/components/ui/page-shell";
import { getAdminDb } from "@/lib/firebase/admin";
import { MembershipStatus } from "@/lib/types";

type VerificationPageProps = {
  params: Promise<{ uid: string }>;
};

type VerifiedMembership = {
  spotId: string;
  spotName: string;
  status: MembershipStatus;
  joinedAt: string;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: VerificationPageProps): Promise<Metadata> {
  const { uid } = await params;

  return {
    title: `Supporter Verification ${uid.slice(0, 8)} | SPOT`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string" && value) {
    return value;
  }

  return new Date().toISOString();
}

function toDateLabel(iso: string) {
  return iso.slice(0, 10).replace(/-/g, "/");
}

function getStatusLabel(status: MembershipStatus) {
  switch (status) {
    case "active":
      return "有効";
    case "canceling":
      return "解約予定";
    case "past_due":
      return "支払い確認待ち";
    case "canceled":
      return "解約済み";
    default:
      return status;
  }
}

function getStatusClassName(status: MembershipStatus) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "canceling":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "past_due":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "canceled":
    default:
      return "border-ink/10 bg-mist text-ink/72";
  }
}

async function getVerificationData(uid: string): Promise<{
  displayName: string;
  memberships: VerifiedMembership[];
}> {
  const db = getAdminDb();
  const [userSnap, membershipsSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.collection(`users/${uid}/memberships`).orderBy("joinedAt", "desc").get(),
  ]);

  const displayName =
    typeof userSnap.data()?.profileDisplayName === "string" &&
    userSnap.data()?.profileDisplayName.trim()
      ? userSnap.data()!.profileDisplayName.trim()
      : "";

  const memberships = membershipsSnap.docs
    .map((doc) => {
      const data = doc.data();

      return {
        spotId: doc.id,
        spotName: String(data.spotName ?? ""),
        status: (data.status ?? "active") as MembershipStatus,
        joinedAt: toIsoString(data.joinedAt),
      };
    })
    .filter((membership) => membership.spotName);

  return { displayName, memberships };
}

export default async function SocioVerificationPage({
  params,
}: VerificationPageProps) {
  const { uid } = await params;
  const { displayName, memberships } = await getVerificationData(uid);
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active" || membership.status === "canceling"
  );

  return (
    <PageShell className="py-10 sm:py-14">
      <div className="panel overflow-hidden">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(232,38,26,0.14),transparent_36%),linear-gradient(135deg,#121212_0%,#1b1b1b_55%,#2a2a2a_100%)] px-6 py-8 text-white sm:px-8">
          <span className="chip border-white/15 bg-white/10 text-white/80">SUPPORTER CARD</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">会員証の確認</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/72 sm:text-base">
            このページは SPOT の応援会員会員証に紐づく確認ページです。現在の加入状況を表示しています。
          </p>
        </div>

        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-4">
            <div className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-ink/72">DISPLAY NAME</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {displayName || "SUPPORTER"}
              </p>
              <p className="mt-4 text-xs text-ink/65">SUPPORTER ID</p>
              <p className="mt-1 break-all font-mono text-sm text-ink/75">{uid}</p>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">加入中の SPOT</h2>
                <span className="rounded-full border border-ink/10 bg-mist px-3 py-1 text-xs font-semibold text-ink/72">
                  {activeMemberships.length}件
                </span>
              </div>

              {memberships.length === 0 ? (
                <p className="mt-4 text-[15px] leading-relaxed text-ink/68">
                  この会員証に紐づく加入情報はまだ確認されていません。
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {memberships.map((membership) => (
                    <div
                      key={membership.spotId}
                      className="rounded-[20px] border border-ink/10 bg-mist/55 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-ink">{membership.spotName}</p>
                          <p className="mt-1 text-sm text-ink/68">
                            参加開始日 {toDateLabel(membership.joinedAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(membership.status)}`}
                        >
                          {getStatusLabel(membership.status)}
                        </span>
                      </div>
                      <Link
                        href={`/spots/${membership.spotId}`}
                        className="mt-4 inline-flex text-sm font-semibold text-moss transition hover:text-ink"
                      >
                        SPOTを見る →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-[24px] border border-ink/10 bg-mist/55 p-5">
            <p className="text-sm font-bold text-ink/72">STATUS</p>
            <p className="mt-3 text-3xl font-extrabold text-ink">{activeMemberships.length}</p>
            <p className="mt-1 text-sm text-ink/68">現在有効な加入数</p>
            <p className="mt-6 text-[15px] leading-relaxed text-ink/72">
              表示内容は Firebase 上の加入情報を元にリアルタイムで確認しています。情報に差異がある場合は運営へお問い合わせください。
            </p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
