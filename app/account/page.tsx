import { AccountPageClient } from "@/components/account/account-page-client";
import { PageShell } from "@/components/ui/page-shell";

export default function AccountPage() {
  return (
    <div className="pb-20 pt-6">
      <PageShell>
        <AccountPageClient />
      </PageShell>
    </div>
  );
}
