import { EventInviteClient } from "@/components/spots/event-invite-client";

export default async function EventInvitePage({
  params
}: {
  params: Promise<{ spotId: string; eventId: string; inviteId: string }>;
}) {
  const { spotId, eventId, inviteId } = await params;
  return <EventInviteClient spotId={spotId} eventId={eventId} inviteId={inviteId} />;
}
