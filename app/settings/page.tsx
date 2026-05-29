import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

export default function SettingsPage() {
  return (
    <PageShell>
      <Card className="px-6 py-8 sm:px-8">
        <span className="chip">SETTINGS</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">設定</h1>
        <div className="mt-8">
          <EmptyState
            title="設定項目はこれから整理します"
            description="まずはソシオ中心の導線と情報設計を優先しています。設定はここに集約していきます。"
          />
        </div>
      </Card>
    </PageShell>
  );
}
