import { SpotSharePanel } from "@/components/owner/spot-share-panel";

export default async function SpotSharePage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">SHARE QR</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">配布用 QR を表示</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          SPOT 紹介用と加入直行用の QR をまとめて発行し、店頭や会合でそのまま使えるようにします。
        </p>
        <SpotSharePanel spotId={spotId} />
      </section>
    </div>
  );
}
