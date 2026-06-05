import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/server/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));

    const snapshot = await getAdminDb()
      .collectionGroup("members")
      .orderBy("joinedAt", "desc")
      .limit(500)
      .get();

    const socios = snapshot.docs.map((d) => {
      const data = d.data();
      const spotId = d.ref.parent.parent?.id ?? "";
      return {
        uid: String(data.uid ?? ""),
        displayName: String(data.displayName ?? ""),
        email: String(data.email ?? ""),
        affiliation: String(data.affiliation ?? ""),
        spotId,
        spotName: String(data.spotName ?? spotId),
        planAmount: Number(data.planAmount ?? 100),
        status: String(data.status ?? "active"),
        joinedAt: data.joinedAt?.toDate?.().toISOString() ?? String(data.joinedAt ?? ""),
      };
    });

    return NextResponse.json({ socios });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    const status = message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
