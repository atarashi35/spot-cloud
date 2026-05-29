import { AdminConsoleClient } from "@/components/admin/admin-console-client";

export default function AdminPage() {
  return (
    <div className="shell">
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">ADMIN</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">全 SPOT 管理</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          管理者 1 人で公開/非公開切替と不正 SPOT 停止を行うための簡易画面です。
        </p>
        <div className="mt-8">
          <AdminConsoleClient />
        </div>
      </section>
    </div>
  );
}
