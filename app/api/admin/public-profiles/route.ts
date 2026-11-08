import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/server/admin";
import { listProfilesForReview } from "@/lib/server/public-profiles";

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));
    return NextResponse.json({ profiles: await listProfilesForReview() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    return NextResponse.json({ error: message }, { status: message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500 });
  }
}
