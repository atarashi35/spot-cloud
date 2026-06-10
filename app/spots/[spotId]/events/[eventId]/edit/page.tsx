import { EventForm } from "@/components/owner/event-form";

export default async function EditEventPage({
  params
}: {
  params: Promise<{ spotId: string; eventId: string }>;
}) {
  const { spotId, eventId } = await params;

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">EDIT EVENT</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">イベントを編集</h1>
        <EventForm spotId={spotId} mode="edit" eventId={eventId} />
      </section>
    </div>
  );
}
