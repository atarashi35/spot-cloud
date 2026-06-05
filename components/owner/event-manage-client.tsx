"use client";

import { useEffect, useState } from "react";
import { EventListPanel } from "@/components/owner/event-list-panel";
import { EventForm } from "@/components/owner/event-form";
import { ModalShell } from "@/components/ui/modal-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

export function EventManageClient({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const [spotName, setSpotName] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
        { label: "イベント管理" },
      ]} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{spotName ?? "…"}</h1>
          <p className="mt-1 text-sm text-ink/55">イベント管理</p>
        </div>
        <button type="button" className="cta-primary" onClick={() => setCreateOpen(true)}>
          イベントを作成
        </button>
      </div>

      <ModalShell
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="イベントを作成"
        size="lg"
      >
        <EventForm
          spotId={spotId}
          mode="create"
          onSuccess={() => { setCreateOpen(false); setReloadKey((k) => k + 1); }}
        />
      </ModalShell>

      <EventListPanel key={reloadKey} spotId={spotId} defaultOpen />
    </div>
  );
}
