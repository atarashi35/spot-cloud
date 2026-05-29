"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { PlanAmount, Spot } from "@/lib/types";
import { JoinFlowClient } from "@/components/spots/join-flow-client";

export function JoinPageClient({
  spotId,
  selectedPlan
}: {
  spotId: string;
  selectedPlan: PlanAmount;
}) {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    void getSpotFromFirestore(spotId)
      .then((nextSpot) => {
        if (!nextSpot) {
          setStatus("missing");
          return;
        }

        setSpot(nextSpot);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [spotId]);

  if (status === "loading") {
    return <div className="panel px-6 py-8 text-sm text-ink/60">加入ページを読み込み中です。</div>;
  }

  if (status === "error") {
    return (
      <EmptyState
        title="加入ページを開けませんでした"
        description="Firestore から SPOT 情報を取得できませんでした。"
      />
    );
  }

  if (status === "missing" || !spot) {
    return (
      <EmptyState
        title="SPOT が見つかりません"
        description="指定された SPOT は存在しないか、まだ公開されていません。"
      />
    );
  }

  if (spot.isSuspended) {
    return (
      <EmptyState
        title="この SPOT は現在加入受付を停止しています"
        description="公開停止中のため、加入ページは利用できません。"
      />
    );
  }

  if (!spot.stripeConnectedAccountId) {
    return (
      <EmptyState
        title="この SPOT はまだ加入受付前です"
        description="運営者の受取設定が完了すると、ここからプランを選んで加入できるようになります。"
      />
    );
  }

  return <JoinFlowClient spot={spot} selectedPlan={selectedPlan} />;
}
