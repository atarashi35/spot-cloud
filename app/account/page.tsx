import { DashboardMembershipsClient } from "@/components/dashboard/dashboard-memberships-client";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function AccountPage() {
  return (
    <PageShell>
      <Card className="px-6 py-8 sm:px-8">
        <span className="chip">SOCIO</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">所属中のSPOT</h1>
        <div className="mt-8">
          <DashboardMembershipsClient />
        </div>
      </Card>
    </PageShell>
  );
}
