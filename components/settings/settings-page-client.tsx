"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";

function getLoginMethodLabel(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  if (hasGoogle && hasPassword) {
    return "Google / メール";
  }

  if (hasGoogle) {
    return "Google";
  }

  if (hasPassword) {
    return "メール";
  }

  return "未設定";
}

export function SettingsPageClient() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* アカウント情報 */}
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">ACCOUNT</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">アカウント情報</h2>
        {user ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricPill label="名前" value={user.displayName ?? "未設定"} />
            <MetricPill label="メール" value={user.email ?? "未設定"} />
            <MetricPill label="ログイン方法" value={getLoginMethodLabel(user)} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/55">ログインするとアカウント情報が表示されます。</p>
        )}
      </section>

      {/* 通知 */}
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

      {/* サポート */}
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

      {/* 利用情報 */}
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
