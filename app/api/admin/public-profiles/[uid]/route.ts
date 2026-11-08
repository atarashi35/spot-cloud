import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/server/admin";
import { reviewPublicProfile } from "@/lib/server/public-profiles";

export async function PATCH(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));
    const { uid } = await context.params;
    const body = await request.json() as { status?: string; note?: string };
    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    await reviewPublicProfile(uid, body.status, body.note);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    return NextResponse.json({ error: message }, { status: message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500 });
  }
}
