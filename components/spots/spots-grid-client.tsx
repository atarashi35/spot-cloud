"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { SpotCard } from "@/components/spot-card";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

export function SpotsGridClient() {
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listPublishedSpotsFromFirestore()
      .then((nextSpots) => {
        setSpots(nextSpots);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      });
  }, []);

  if (error) {
    return (
      <EmptyState
        title="SPOT 一覧を取得できませんでした"
        description={`Firestore 接続でエラーが出ています: ${error}`}
      />
    );
  }

  if (!spots) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">SPOT を読み込み中です。</div>;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-3">
      {spots.map((spot) => (
        <SpotCard key={spot.id} spot={spot} />
      ))}
    </section>
  );
}
