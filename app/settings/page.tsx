import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function SettingsPage() {
  return (
    <PageShell className="space-y-8">
      <Card className="px-6 py-8 sm:px-8">
        <span className="chip">SETTINGS</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">設定</h1>
      </Card>
      <SettingsPageClient />
    </PageShell>
  );
}
