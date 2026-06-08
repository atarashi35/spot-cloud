"use client";

import { useEffect, useState } from "react";
import { SocioListPanel } from "@/components/owner/socio-list-panel";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

export function SocioManageClient({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const [spotName, setSpotName] = useState<string | null>(null);

  useEffect(() => {
    void getSpotFromFirestore(spotId).then((spot) => {
      setSpotName(spot?.name ?? spotId);
    });
  }, [spotId]);

  if (!authReady || !user) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">読み込み中です。</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "管理", href: "/manage" },
        { label: spotName ?? "…", href: "/manage" },
        { label: "サポーター管理" },
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{spotName ?? "…"}</h1>
        <p className="mt-1 text-sm text-ink/55">サポーター管理</p>
      </div>
      <SocioListPanel spotId={spotId} spotName={spotName ?? spotId} defaultOpen />
    </div>
  );
}
