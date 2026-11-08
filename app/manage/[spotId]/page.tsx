import Link from "next/link";
import { OwnerConsoleClient } from "@/components/owner/owner-console-client";
import { PageShell } from "@/components/ui/page-shell";

export default async function ManageSpotPage({ params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = await params;
  return <PageShell className="space-y-6 py-8"><Link href="/manage" className="text-sm font-semibold text-moss">← 運営中のSPOT</Link><OwnerConsoleClient selectedSpotId={spotId} /></PageShell>;
}
