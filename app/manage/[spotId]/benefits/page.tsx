"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore, updateSpotPlanBenefits } from "@/lib/firestore/spots";
import { Spot, PlanBenefits } from "@/lib/types";

/** 特典のコース閾値（プラットフォーム共通）。 */
const COURSE_THRESHOLDS = [5000, 10000] as const;

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
          5000: s.planBenefits?.[5000] ?? "",
          10000: s.planBenefits?.[10000] ?? "",
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
    for (const threshold of COURSE_THRESHOLDS) {
      const value = (benefits[threshold] ?? "").trim();
      if (value) cleaned[threshold] = value;
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
            <h1 className="mt-4 text-3xl font-extrabold text-ink">年会費コース特典（任意）</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/68">
              年会費コースに応じた特典を設定できます（任意）。
              何か返したいものがあれば、ここで自由に追加してください。
              もちろん空欄のままでも問題ありません。
            </p>
          </div>

          <div className="space-y-4">
            {COURSE_THRESHOLDS.map((threshold) => (
              <label key={threshold} className="block">
                <span className="text-sm font-semibold text-ink">¥{threshold.toLocaleString("ja-JP")}コース以上の特典</span>
                <input
                  type="text"
                  className="field mt-2 w-full"
                  value={benefits[threshold] ?? ""}
                  onChange={(e) => {
                    setBenefits((prev) => ({ ...prev, [threshold]: e.target.value }));
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
