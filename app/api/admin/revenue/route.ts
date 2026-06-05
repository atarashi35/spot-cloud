import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { verifyAdminToken } from "@/lib/server/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request.headers.get("authorization"));

    if (!stripe) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }

    // 過去6ヶ月分の月次データを集計
    const months: { label: string; gmv: number; platformFee: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = `${start.getMonth() + 1}月`;

      // application fees = プラットフォーム収益（SPOT手数料 + Stripe手数料分）
      const fees = await stripe.applicationFees.list({
        limit: 100,
        created: {
          gte: Math.floor(start.getTime() / 1000),
          lt: Math.floor(end.getTime() / 1000),
        },
      });

      const platformFee = fees.data.reduce((sum, f) => sum + f.amount, 0);
      // GMV = application_fee / BILLING_APPLICATION_FEE_PERCENT
      const feeRate = Number(process.env.BILLING_APPLICATION_FEE_PERCENT ?? "13.24") / 100;
      const gmv = feeRate > 0 ? Math.round(platformFee / feeRate) : 0;

      months.push({ label, gmv, platformFee });
    }

    // 今月の累計
    const current = months[months.length - 1];

    return NextResponse.json({ months, current });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin_error";
    const status = message === "missing_auth" ? 401 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
