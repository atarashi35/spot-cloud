import { EventForm } from "@/components/owner/event-form";

export default async function NewEventPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">OWNER EVENT</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">限定イベントを作成</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/78">
          イベント管理サービスではなく、所属の中で開かれる行為の告知として設計します。
        </p>
        <EventForm spotId={spotId} mode="create" />
      </section>
    </div>
  );
}
