"use client";

import { useState } from "react";
import { AdminConsoleClient } from "@/components/admin/admin-console-client";
import { AdminSociosClient } from "@/components/admin/admin-socios-client";

type Tab = "spots" | "socios";

export function AdminTabs() {
  const [tab, setTab] = useState<Tab>("spots");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-full border border-ink/10 bg-mist p-1 w-fit">
        {([
          { key: "spots", label: "SPOT管理" },
          { key: "socios", label: "ソシオ一覧" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-ink text-white shadow-sm" : "text-ink/65 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "spots" && <AdminConsoleClient />}
      {tab === "socios" && <AdminSociosClient />}
    </div>
  );
}
