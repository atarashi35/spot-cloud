"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type MonthData = { label: string; gmv: number; platformFee: number };

export function AdminRevenueChart() {
  const { user } = useAuth();
  const [months, setMonths] = useState<MonthData[] | null>(null);
  const [view, setView] = useState<"gmv" | "fee">("gmv");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { months: MonthData[] };
        setMonths(data.months);
      }
    })();
  }, [user]);

  if (!months) {
    return <div className="h-48 animate-pulse rounded-[20px] bg-mist" />;
  }

  const values = months.map((m) => (view === "gmv" ? m.gmv : m.platformFee));
  const max = Math.max(...values, 1);

  return (
    <div className="rounded-[24px] border border-ink/8 bg-white px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-ink/45">REVENUE</p>
          <p className="mt-0.5 text-lg font-bold text-ink">月次収益グラフ（6ヶ月）</p>
        </div>
        <div className="flex rounded-full border border-ink/10 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView("gmv")}
            className={`rounded-full px-3 py-1.5 transition ${view === "gmv" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
          >
            GMV
          </button>
          <button
            type="button"
            onClick={() => setView("fee")}
            className={`rounded-full px-3 py-1.5 transition ${view === "fee" ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
          >
            収益
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2">
        {months.map((m, i) => {
          const val = view === "gmv" ? m.gmv : m.platformFee;
          const pct = max > 0 ? (val / max) * 100 : 0;
          const isLatest = i === months.length - 1;
          return (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-ink/55">
                {val > 0 ? `¥${(val / 1000).toFixed(0)}k` : "—"}
              </span>
              <div className="relative w-full" style={{ height: "120px" }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t-[6px] transition-all duration-500 ${isLatest ? "bg-ink" : "bg-ink/20"}`}
                  style={{ height: `${Math.max(pct, val > 0 ? 4 : 1)}%` }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${isLatest ? "text-ink" : "text-ink/40"}`}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
