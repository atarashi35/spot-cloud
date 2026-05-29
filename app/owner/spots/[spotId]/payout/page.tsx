import Link from "next/link";
import { SpotPayoutPanel } from "@/components/owner/spot-payout-panel";

export default async function SpotPayoutPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">PAYOUT SETUP</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">受取設定</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          この SPOT の加入受付を本番運用する前に、Stripe Connect の受取設定を完了させます。
        </p>
        <div className="mt-4">
          <Link href="/manage" className="cta-secondary">
            運営するSPOT
          </Link>
        </div>
        <SpotPayoutPanel spotId={spotId} />
      </section>
    </div>
  );
}
