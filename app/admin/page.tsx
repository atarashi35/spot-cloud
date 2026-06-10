import { AdminConsoleClient } from "@/components/admin/admin-console-client";

export default function AdminPage() {
  return (
    <div className="shell space-y-6 py-8">

      <div>
        <span className="chip">ADMIN</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">SPOT管理</h1>
        <p className="mt-2 text-sm text-ink/68">登録されたSPOTの公開状態を確認・管理できます。</p>
      </div>

      <AdminConsoleClient />

    </div>
  );
}
