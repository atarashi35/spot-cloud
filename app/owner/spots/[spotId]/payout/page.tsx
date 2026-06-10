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
        <h1 className="mt-4 text-3xl font-extrabold text-ink">受取設定</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/78">
          いまの受取状況と、応援会員募集を本番で開始できる状態かどうかを確認できます。
        </p>
        <SpotPayoutPanel spotId={spotId} />
      </section>
    </div>
  );
}
