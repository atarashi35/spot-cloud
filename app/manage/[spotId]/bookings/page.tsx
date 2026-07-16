import { notFound } from "next/navigation";
import { BookingManageClient } from "@/components/owner/booking-manage-client";
import { PageShell } from "@/components/ui/page-shell";
import { FEATURE_BOOKINGS } from "@/lib/flags";

export default async function BookingsPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  if (!FEATURE_BOOKINGS) {
    notFound();
  }

  const { spotId } = await params;

  return (
    <PageShell className="space-y-6">
      <BookingManageClient spotId={spotId} />
    </PageShell>
  );
}
