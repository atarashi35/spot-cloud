import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/server/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));

    const snapshot = await getAdminDb().collection("spots").get();
    const spots = snapshot.docs.map((d) => d.data());

    const total = spots.length;
    const published = spots.filter((s) => s.isPublished && !s.isSuspended).length;
    const suspended = spots.filter((s) => s.isSuspended).length;
    const stripeConnected = spots.filter(
      (s) => typeof s.stripeConnectedAccountId === "string" && s.stripeConnectedAccountId
    ).length;
    const totalSocios = spots.reduce((sum, s) => sum + (Number(s.socioCount) || 0), 0);

    // 過去30日の新規SPOT
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newSpots = spots.filter((s) => {
      const createdAt = typeof s.createdAt === "string"
        ? s.createdAt
        : s.createdAt?.toDate?.().toISOString() ?? "";
      return createdAt >= thirtyDaysAgo;
    }).length;

    return NextResponse.json({
      total,
      published,
      suspended,
      stripeConnected,
      totalSocios,
      newSpots,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    const status = message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
