import { AccountPageClient } from "@/components/account/account-page-client";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        eyebrow="MY ACCOUNT"
        title="サポート中のSPOT"
        subtitle="サポート中のSPOTの限定コンテンツにアクセスできます。"
      />
      <PageShell>
        <AccountPageClient />
      </PageShell>
    </div>
  );
}
