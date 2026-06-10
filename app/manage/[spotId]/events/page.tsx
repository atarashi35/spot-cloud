import { notFound } from "next/navigation";
import { EventManageClient } from "@/components/owner/event-manage-client";
import { PageShell } from "@/components/ui/page-shell";
import { FEATURE_EVENTS } from "@/lib/flags";

export default async function EventsPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  if (!FEATURE_EVENTS) {
    notFound();
  }

  const { spotId } = await params;

  return (
    <PageShell className="space-y-6">
      <EventManageClient spotId={spotId} />
    </PageShell>
  );
}
