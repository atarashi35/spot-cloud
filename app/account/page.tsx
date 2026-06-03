import { AccountPageClient } from "@/components/account/account-page-client";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function AccountPage() {
  return (
    <PageShell className="space-y-8">
      <Card className="px-6 py-8 sm:px-8">
        <h1 className="text-3xl font-bold text-ink">応援中のSPOT</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          応援しているSPOTの限定コンテンツにアクセスできます。
        </p>
      </Card>
      <AccountPageClient />
    </PageShell>
  );
}
