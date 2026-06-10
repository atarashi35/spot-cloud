"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";

type Socio = {
  uid: string;
  displayName: string;
  email: string;
  affiliation: string;
  spotId: string;
  spotName: string;
  planAmount: number;
  status: string;
  joinedAt: string;
};

type Filter = "all" | "active" | "canceling" | "canceled";

export function AdminSociosClient() {
  const { user } = useAuth();
  const [socios, setSocios] = useState<Socio[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/socios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { socios: Socio[] };
        setSocios(data.socios);
      }
    })();
  }, [user]);

  if (!socios) {
    return <div className="h-32 animate-pulse rounded-[20px] bg-mist" />;
  }

  const filtered = socios.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.displayName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.spotName.toLowerCase().includes(q) ||
        s.affiliation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusTone = (status: string): "success" | "neutral" | "danger" => {
    if (status === "active") return "success";
    if (status === "canceling") return "neutral";
    return "danger";
  };

  const statusLabel = (status: string) => {
    if (status === "active") return "有効";
    if (status === "canceling") return "解約予定";
    return "解約済";
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `すべて (${socios.length})` },
    { key: "active", label: `有効 (${socios.filter((s) => s.status === "active").length})` },
    { key: "canceling", label: `解約予定 (${socios.filter((s) => s.status === "canceling").length})` },
    { key: "canceled", label: `解約済 (${socios.filter((s) => s.status === "canceled").length})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key ? "bg-ink text-white" : "bg-mist text-ink/68 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="名前・メール・SPOT名で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-ink/12 bg-white px-4 py-2 text-sm outline-none focus:border-ink/30 sm:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-ink/8 bg-white">
        <div className="hidden grid-cols-[2fr_2fr_1fr_80px_100px] gap-4 border-b border-ink/8 px-5 py-3 text-[13px] font-semibold tracking-wider text-ink/60 sm:grid">
          <span>応援会員</span>
          <span>SPOT</span>
          <span>加入日</span>
          <span className="text-center">プラン</span>
          <span className="text-center">状態</span>
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-ink/60">該当する応援会員がいません</div>
        )}

        {filtered.map((s, i) => (
          <div
            key={`${s.uid}-${s.spotId}-${i}`}
            className="grid grid-cols-1 gap-2 border-b border-ink/6 px-5 py-4 last:border-0 sm:grid-cols-[2fr_2fr_1fr_80px_100px] sm:items-center sm:gap-4"
          >
            <div>
              <p className="font-semibold text-ink">{s.displayName || "—"}</p>
              <p className="text-xs text-ink/65">{s.email}</p>
              {s.affiliation && (
                <p className="text-xs text-ink/58">{s.affiliation}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{s.spotName}</p>
              <p className="text-xs text-ink/58">{s.spotId}</p>
            </div>
            <p className="text-xs text-ink/68">{s.joinedAt.slice(0, 10)}</p>
            <div className="text-center">
              <span className="text-sm font-bold text-ink">¥{s.planAmount}</span>
              <span className="text-xs text-ink/60">/月</span>
            </div>
            <div className="flex justify-center">
              <StatusBadge tone={statusTone(s.status)}>{statusLabel(s.status)}</StatusBadge>
            </div>
          </div>
        ))}
      </div>

      {socios.length >= 500 && (
        <p className="text-center text-xs text-ink/60">最新500件を表示しています</p>
      )}
    </div>
  );
}
