import { notFound } from "next/navigation";
import { getBookingRequestById } from "@/lib/server/bookings";
import { PageShell } from "@/components/ui/page-shell";
import { BookingStatusClient } from "@/components/spots/booking-status-client";

export default async function BookingStatusPage({
  params
}: {
  params: Promise<{ spotId: string; bookingRequestId: string }>;
}) {
  const { spotId, bookingRequestId } = await params;
  const booking = await getBookingRequestById(spotId, bookingRequestId);

  if (!booking) {
    notFound();
  }

  return (
    <PageShell className="max-w-2xl space-y-6 py-10">
      <BookingStatusClient spotId={spotId} bookingRequestId={bookingRequestId} initialBooking={booking} />
    </PageShell>
  );
}
