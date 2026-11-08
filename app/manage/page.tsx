import { OwnerSpotList } from "@/components/owner/owner-spot-list";
import { PageShell } from "@/components/ui/page-shell";

export default function ManagePage() {
  return (
    <PageShell className="space-y-8">
      <h1 className="pt-8 text-3xl font-bold text-ink">運営中のSPOT</h1>
      <OwnerSpotList />
    </PageShell>
  );
}
