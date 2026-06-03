import { EventDetailClient } from "@/components/spots/event-detail-client";

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ spotId: string; eventId: string }>;
}) {
  const { spotId, eventId } = await params;
  return <EventDetailClient spotId={spotId} eventId={eventId} />;
}
