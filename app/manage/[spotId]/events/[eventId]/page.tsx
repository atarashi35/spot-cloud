import { notFound } from "next/navigation";
import { EventManageDetailClient } from "@/components/owner/event-manage-detail-client";
import { PageShell } from "@/components/ui/page-shell";
import { FEATURE_EVENTS } from "@/lib/flags";

export default async function EventManageDetailPage({
  params
}: {
  params: Promise<{ spotId: string; eventId: string }>;
}) {
  if (!FEATURE_EVENTS) {
    notFound();
  }

  const { spotId, eventId } = await params;

  return (
    <PageShell className="space-y-6">
      <EventManageDetailClient spotId={spotId} eventId={eventId} />
    </PageShell>
  );
}
