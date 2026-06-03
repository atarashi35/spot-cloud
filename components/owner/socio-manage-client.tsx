"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SocioListPanel } from "@/components/owner/socio-list-panel";
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
      <div className="flex items-center gap-3">
        <Link href="/manage" className="flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink transition-colors">
          <ArrowLeft className="h-4 w-4" />
          運営中のSPOT
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-ink">{spotName ?? "…"}</h1>
        <p className="mt-1 text-sm text-ink/55">ソシオ管理</p>
      </div>
      <SocioListPanel spotId={spotId} spotName={spotName ?? spotId} defaultOpen />
    </div>
  );
}
