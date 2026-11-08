import Link from "next/link";
import { OwnerConsoleClient } from "@/components/owner/owner-console-client";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function ManagePage() {
  return (
    <PageShell className="space-y-8">
      <Card className="px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-extrabold text-ink">運営中のSPOT</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/owner/spots/new?kind=creator" className="cta-secondary">クリエイター登録</Link>
            <Link href="/owner/spots/new?kind=organization" className="cta-primary">団体登録</Link>
          </div>
        </div>
      </Card>

      <OwnerConsoleClient />
    </PageShell>
  );
}
