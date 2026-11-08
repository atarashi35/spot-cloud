import { AccountPageClient } from "@/components/account/account-page-client";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        eyebrow="MY ACCOUNT"
        title="マイページ"
        subtitle="参加中のSPOTと会員証を確認できます。"
      />
      <PageShell>
        <AccountPageClient />
      </PageShell>
    </div>
  );
}
