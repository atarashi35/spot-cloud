import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader eyebrow="SETTINGS" title="設定" />
      <PageShell>
        <SettingsPageClient />
      </PageShell>
    </div>
  );
}
