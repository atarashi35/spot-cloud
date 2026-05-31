import Link from "next/link";
import { OwnerConsoleClient } from "@/components/owner/owner-console-client";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function ManagePage() {
  return (
    <PageShell className="space-y-8">
      <Card className="px-6 py-8 sm:px-8">
        <span className="chip">OPERATOR</span>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">運営するSPOT</h1>
          </div>
          <Link href="/owner/spots/new" className="cta-primary">
            SPOTを登録
          </Link>
        </div>
      </Card>

      <OwnerConsoleClient />
    </PageShell>
  );
}
