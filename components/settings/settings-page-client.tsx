import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";

export function SettingsPageClient() {
  return (
    <div className="space-y-6">
      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="chip">NOTIFY</span>
            <h2 className="mt-4 text-2xl font-bold text-ink">通知</h2>
          </div>
          <StatusBadge>準備中</StatusBadge>
        </div>
        <p className="mt-4 text-sm text-ink/62">
          お知らせやイベント更新の通知設定はここに集約します。
        </p>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="chip">SUPPORT</span>
            <h2 className="mt-4 text-2xl font-bold text-ink">サポート</h2>
          </div>
          <StatusBadge>準備中</StatusBadge>
        </div>
        <p className="mt-4 text-sm text-ink/62">
          お問い合わせやヘルプの入口はここにまとめます。
        </p>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">LEGAL</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">利用情報</h2>
        <div className="mt-5 flex flex-col gap-3">
          <Link href="/terms" className="cta-secondary justify-start">利用規約</Link>
          <Link href="/privacy" className="cta-secondary justify-start">プライバシーポリシー</Link>
          <Link href="/law" className="cta-secondary justify-start">特定商取引法に基づく表記</Link>
        </div>
      </section>
    </div>
  );
}
