import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/server/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));

    const body = (await request.json()) as { isPublished?: boolean; isSuspended?: boolean };
    const { spotId } = await params;

    if (typeof body.isPublished !== "boolean" && typeof body.isSuspended !== "boolean") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const ref = getAdminDb().doc(`spots/${spotId}`);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    await ref.update({
      ...(typeof body.isPublished === "boolean" ? { isPublished: body.isPublished } : {}),
      ...(typeof body.isSuspended === "boolean" ? { isSuspended: body.isSuspended } : {}),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    const status = message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
