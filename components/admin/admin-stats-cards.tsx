"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type Stats = {
  total: number;
  published: number;
  suspended: number;
  stripeConnected: number;
  totalSocios: number;
  newSpots: number;
};

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-[20px] px-5 py-5 ${accent ? "bg-ink text-white" : "bg-mist"}`}>
      <p className={`text-xs font-semibold tracking-wider ${accent ? "text-white/68" : "text-ink/65"}`}>
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-white" : "text-ink"}`}>{value}</p>
      {sub && (
        <p className={`mt-1 text-xs ${accent ? "text-white/65" : "text-ink/65"}`}>{sub}</p>
      )}
    </div>
  );
}

export function AdminStatsCards() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<{ current: { gmv: number; platformFee: number } } | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, revRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/revenue", { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json() as Stats);
      if (revRes.ok) setRevenue(await revRes.json() as typeof revenue);
    })();
  }, [user]);

  if (!stats) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[20px] bg-mist" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="総SPOT数"
        value={stats.total}
        sub={`公開中 ${stats.published} / 停止 ${stats.suspended}`}
      />
      <KpiCard
        label="総ソシオ数"
        value={stats.totalSocios.toLocaleString()}
        sub={`Stripe連携 ${stats.stripeConnected}/${stats.total} SPOT`}
      />
      <KpiCard
        label="今月のGMV"
        value={revenue ? `¥${revenue.current.gmv.toLocaleString()}` : "—"}
        sub="ソシオ決済総額"
        accent
      />
      <KpiCard
        label="今月のプラットフォーム収益"
        value={revenue ? `¥${revenue.current.platformFee.toLocaleString()}` : "—"}
        sub={`過去30日の新規SPOT: ${stats.newSpots}件`}
      />
    </div>
  );
}
