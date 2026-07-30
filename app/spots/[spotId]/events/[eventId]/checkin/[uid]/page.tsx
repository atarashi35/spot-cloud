import { EventCheckinClient } from "@/components/spots/event-checkin-client";

export default async function EventCheckinPage({
  params
}: {
  params: Promise<{ spotId: string; eventId: string; uid: string }>;
}) {
  const { spotId, eventId, uid } = await params;
  return <EventCheckinClient spotId={spotId} eventId={eventId} uid={uid} />;
}
