import { AccountPageClient } from "@/components/account/account-page-client";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function AccountPage() {
  return (
    <PageShell className="space-y-8">
      <Card className="px-6 py-8 sm:px-8">
        <span className="chip">MY SOCIO</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">マイソシオ</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          所属中のSPOTと限定コンテンツへのポータルです。
        </p>
      </Card>
      <AccountPageClient />
    </PageShell>
  );
}
