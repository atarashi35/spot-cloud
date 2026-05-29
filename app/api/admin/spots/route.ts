import { NextRequest, NextResponse } from "next/server";
import { listAdminSpots, verifyAdminToken } from "@/lib/server/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));
    const spots = await listAdminSpots();

    return NextResponse.json({ spots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    const status = message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
