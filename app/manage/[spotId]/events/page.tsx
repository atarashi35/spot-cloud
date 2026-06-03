import { EventManageClient } from "@/components/owner/event-manage-client";
import { PageShell } from "@/components/ui/page-shell";

export default async function EventsPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <PageShell className="space-y-6">
      <EventManageClient spotId={spotId} />
    </PageShell>
  );
}
