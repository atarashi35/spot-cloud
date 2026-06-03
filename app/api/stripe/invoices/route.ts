import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";

export type InvoiceItem = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  spotId: string;
};

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );

    const uid = decodedToken.uid;

    // ユーザーの全メンバーシップを取得してcustomerIdを集める
    const membershipsSnap = await getAdminDb()
      .collectionGroup("members")
      .where("uid", "==", uid)
      .get();

    if (membershipsSnap.empty || !stripe) {
      return NextResponse.json({ invoices: [] });
    }

    const stripeClient = stripe;

    const invoices: InvoiceItem[] = [];

    await Promise.all(
      membershipsSnap.docs.map(async (doc) => {
        const data = doc.data();
        const customerId = String(data.stripeCustomerId ?? "");
        const spotId = doc.ref.parent.parent?.id ?? "";

        if (!customerId) return;

        const stripeInvoices = await stripeClient.invoices.list({
          customer: customerId,
          limit: 12
        });

        stripeInvoices.data.forEach((inv: (typeof stripeInvoices.data)[number]) => {
          invoices.push({
            id: inv.id ?? "",
            date: new Date((inv.created ?? 0) * 1000).toISOString(),
            amount: inv.amount_paid ?? 0,
            currency: inv.currency ?? "jpy",
            status: inv.status ?? "unknown",
            pdfUrl: inv.invoice_pdf ?? null,
            spotId
          });
        });
      })
    );

    invoices.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
