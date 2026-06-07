import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { SpotMembership } from "@/lib/types";

async function requireOwner(request: NextRequest, spotId: string) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "missing_auth" }, { status: 401 }) };
  }

  const decodedToken = await getAdminAuth().verifyIdToken(
    authorization.slice("Bearer ".length)
  );

  const db = getAdminDb();
  const spotSnap = await db.doc(`spots/${spotId}`).get();
  if (!spotSnap.exists) {
    return { error: NextResponse.json({ error: "spot_not_found" }, { status: 404 }) };
  }
  if (String(spotSnap.data()?.ownerUid ?? "") !== decodedToken.uid) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { db };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const { spotId } = await params;
    const auth = await requireOwner(request, spotId);
    if ("error" in auth) {
      return auth.error;
    }

    const snapshot = await auth.db
      .collection(`spots/${spotId}/members`)
      .orderBy("joinedAt", "desc")
      .get();

    // users/{uid} プロフィールを一括取得
    const uids = snapshot.docs.map((doc) => String(doc.data().uid ?? doc.id));
    const profileSnaps = uids.length > 0
      ? await auth.db.getAll(...uids.map((uid) => auth.db.doc(`users/${uid}`)))
      : [];
    const profileMap = new Map(
      profileSnaps.map((snap) => [snap.id, snap.exists ? snap.data() ?? {} : {}])
    );

    function str(v: unknown): string | undefined {
      return typeof v === "string" && v.trim() ? v.trim() : undefined;
    }

    const members: SpotMembership[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      const uid = String(d.uid ?? doc.id);
      const p = profileMap.get(uid) ?? {};
      const joinedAt =
        d.joinedAt instanceof Timestamp
          ? d.joinedAt.toDate().toISOString()
          : new Date().toISOString();
      const updatedAt =
        d.updatedAt instanceof Timestamp
          ? d.updatedAt.toDate().toISOString()
          : new Date().toISOString();

      return {
        uid,
        displayName: str(p.profileDisplayName) ?? str(d.displayName) ?? "",
        email: String(d.email ?? ""),
        affiliation: String(d.affiliation ?? ""),
        ageRange: d.ageRange ?? undefined,
        gender: d.gender ?? undefined,
        planAmount: Number(d.planAmount ?? 100) as SpotMembership["planAmount"],
        stripeCustomerId: String(d.stripeCustomerId ?? ""),
        stripeSubscriptionId: String(d.stripeSubscriptionId ?? ""),
        status: d.status ?? "active",
        joinedAt,
        updatedAt,
        avatarUrl: str(p.avatarUrl),
        occupation: str(p.occupation),
        specialty: str(p.specialty),
        bio: str(p.bio),
      };
    });

    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json(
      {
        error: "members_lookup_failed",
        message: error instanceof Error ? error.message : "ソシオ一覧を取得できませんでした。"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const { spotId } = await params;
    const auth = await requireOwner(request, spotId);
    if ("error" in auth) {
      return auth.error;
    }

    const body = (await request.json()) as {
      uid?: string;
      affiliation?: string;
    };

    const uid = body.uid?.trim() ?? "";
    const affiliation = body.affiliation?.trim() ?? "";

    if (!uid) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const memberRef = auth.db.doc(`spots/${spotId}/members/${uid}`);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      return NextResponse.json({ error: "member_not_found" }, { status: 404 });
    }

    await Promise.all([
      memberRef.set(
        {
          affiliation,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      ),
      auth.db.doc(`users/${uid}/memberships/${spotId}`).set(
        {
          affiliation,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      )
    ]);

    return NextResponse.json({ ok: true, affiliation });
  } catch (error) {
    return NextResponse.json(
      {
        error: "member_update_failed",
        message: error instanceof Error ? error.message : "所属を更新できませんでした。"
      },
      { status: 500 }
    );
  }
}
