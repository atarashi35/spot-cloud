import { SpotSharePanel } from "@/components/owner/spot-share-panel";
import { SpotBreadcrumb } from "@/components/owner/spot-breadcrumb";

export default async function SpotSharePage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="panel px-6 py-8 sm:px-8">
        <SpotBreadcrumb spotId={spotId} current="QR・シェア" />
        <h1 className="mt-4 text-3xl font-extrabold text-ink">QRコード・リンク共有</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/72">
          チラシやSNSに掲載して、SPOTを知ってもらいましょう。
        </p>
        <SpotSharePanel spotId={spotId} />
      </section>
    </div>
  );
}
