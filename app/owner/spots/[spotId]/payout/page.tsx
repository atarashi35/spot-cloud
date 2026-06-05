import { SpotPayoutPanel } from "@/components/owner/spot-payout-panel";
import { SpotBreadcrumb } from "@/components/owner/spot-breadcrumb";

export default async function SpotPayoutPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="panel px-6 py-8 sm:px-8">
        <SpotBreadcrumb spotId={spotId} current="受取設定" />
        <h1 className="mt-4 text-3xl font-bold text-ink">受取設定</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          いまの受取状況と、ソシオ募集を本番で開始できる状態かどうかを確認できます。
        </p>
        <SpotPayoutPanel spotId={spotId} />
      </section>
    </div>
  );
}
