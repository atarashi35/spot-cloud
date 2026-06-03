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
        <h1 className="text-3xl font-bold text-ink">QR</h1>
        <SpotSharePanel spotId={spotId} />
      </section>
    </div>
  );
}
