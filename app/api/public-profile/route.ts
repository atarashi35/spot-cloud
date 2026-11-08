import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile, savePublicProfile, verifyUserToken } from "@/lib/server/public-profiles";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserToken(request.headers.get("authorization"));
    return NextResponse.json({ profile: await getPublicProfile(user.uid) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "profile_error";
    return NextResponse.json({ error: message }, { status: message === "missing_auth" ? 401 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyUserToken(request.headers.get("authorization"));
    const profile = await savePublicProfile(user.uid, await request.json() as Record<string, unknown>);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "profile_error";
    const status = message === "missing_auth" ? 401 : message === "invalid_profile" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
