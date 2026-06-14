"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore, updateSpotPlanBenefits } from "@/lib/firestore/spots";
import { Spot, PlanBenefits, planOptions } from "@/lib/types";

/**
 * 特典（任意）の後設定ページ。
 * 特典はオンボーディングに出さず、運営が落ち着いてから自由に設定できる。
 * 文化層の「返礼を考えねば」という負荷で登録が止まるのを避けるための分離。
 */

export default function BenefitsPage({ params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = use(params);
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "forbidden">("loading");
  const [benefits, setBenefits] = useState<PlanBenefits>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    void getSpotFromFirestore(spotId)
      .then((s) => {
        if (!s) {
          setStatus("missing");
          return;
        }
        if (!user || s.ownerUid !== user.uid) {
          setStatus("forbidden");
          return;
        }
        setSpot(s);
        setBenefits({
          300: s.planBenefits?.[300] ?? "",
          500: s.planBenefits?.[500] ?? "",
          1000: s.planBenefits?.[1000] ?? "",
        });
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [authReady, user, spotId]);

  async function handleSave() {
    if (!spot) return;
    setSaving(true);
    setSaved(false);
    // 空文字は保存しない（未設定として扱う）
    const cleaned: PlanBenefits = {};
    for (const amount of planOptions) {
      const value = (benefits[amount] ?? "").trim();
      if (value) cleaned[amount] = value;
    }
    try {
      await updateSpotPlanBenefits(spot.id, cleaned);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "管理", href: "/dashboard" }, { label: "特典設定" }]} />

      {status === "loading" && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ink/40" />
        </div>
      )}

      {status === "missing" && (
        <p className="py-20 text-center text-sm text-ink/65">SPOTが見つかりませんでした。</p>
      )}

      {status === "forbidden" && (
        <p className="py-20 text-center text-sm text-ink/65">このSPOTの管理権限がありません。</p>
      )}

      {status === "ready" && spot && (
        <>
          <div>
            <span className="chip">特典設定</span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink">プラン特典（任意）</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/68">
              プランごとの特典は<strong>設定しなくて構いません</strong>。
              何も返さず、純粋な応援を受け取るのがSPOTの基本です。
              用意できるものがあるときだけ、後からここで自由に追加できます。
            </p>
          </div>

          <div className="space-y-4">
            {planOptions.map((amount) => (
              <label key={amount} className="block">
                <span className="text-sm font-semibold text-ink">月{amount.toLocaleString()}円プランの特典</span>
                <input
                  type="text"
                  className="field mt-2 w-full"
                  value={benefits[amount] ?? ""}
                  onChange={(e) => {
                    setBenefits((prev) => ({ ...prev, [amount]: e.target.value }));
                    setSaved(false);
                  }}
                  placeholder="例：ドリンク1杯サービス（空欄でもOK）"
                />
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="cta-primary inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              保存する
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-moss">
                <Check className="h-4 w-4" />
                保存しました
              </span>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
