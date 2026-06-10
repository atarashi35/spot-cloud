import { AdminStatsCards } from "@/components/admin/admin-stats-cards";
import { AdminRevenueChart } from "@/components/admin/admin-revenue-chart";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default function AdminPage() {
  return (
    <div className="shell space-y-6 py-8">

      <div>
        <span className="chip">ADMIN</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">管理ダッシュボード</h1>
        <p className="mt-2 text-sm text-ink/68">プラットフォーム全体の状況を確認・管理できます。</p>
      </div>

      <AdminStatsCards />
      <AdminRevenueChart />
      <AdminTabs />

    </div>
  );
}
