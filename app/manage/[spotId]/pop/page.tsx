"use client";

import { use, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Loader2, Printer } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, planOptions } from "@/lib/types";

/**
 * 店頭POP自動生成ページ。
 * A6サイズ（105×148mm）で印刷し、レジ横に置く。
 * レジ横が応援会員獲得の唯一の配布チャネルなので、このページが営業の本体。
 */

function buildJoinUrl(spotId: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://spotcloud.app");
  return `${base}/spots/${spotId}`;
}

function PopCard({ spot }: { spot: Spot }) {
  return (
    <div
      className="pop-print flex flex-col bg-white"
      style={{ width: "105mm", height: "148mm", padding: "9mm 8mm 7mm" }}
    >
      {/* 上部ラベル */}
      <p className="text-center font-semibold text-neutral-400" style={{ fontSize: "2.8mm", letterSpacing: "0.12em" }}>
        SPOT公式
      </p>

      {/* メインコピー: SPOT名 */}
      <h1 className="mt-1.5 text-center font-extrabold leading-tight text-neutral-900" style={{ fontSize: "7.8mm" }}>
        {spot.name}
      </h1>
      <p className="mt-1 text-center font-bold text-neutral-700" style={{ fontSize: "4.2mm" }}>
        の応援会員になれます
      </p>
      <p className="mt-1.5 text-center font-medium text-neutral-500" style={{ fontSize: "3.2mm", lineHeight: 1.5 }}>
        月300円から、店を続ける力になる。
      </p>

      {/* 価格チップ */}
      <div className="mt-3 flex items-center justify-center" style={{ gap: "2mm" }}>
        {planOptions.map((amount) => (
          <span
            key={amount}
            className="rounded-full border border-neutral-300 font-bold text-neutral-800"
            style={{ fontSize: "3.2mm", padding: "1.2mm 3mm" }}
          >
            月{amount.toLocaleString()}円
          </span>
        ))}
      </div>

      {/* QR */}
      <div className="mt-5 flex flex-col items-center">
        <div className="rounded-lg border border-neutral-200 bg-white" style={{ padding: "3mm" }}>
          <QRCode value={buildJoinUrl(spot.id)} size={120} bgColor="#ffffff" fgColor="#111111" level="M" />
        </div>
        <p className="mt-2 text-center font-semibold text-neutral-700" style={{ fontSize: "3.2mm" }}>
          スマホで読み取り、その場で入会できます
        </p>
        <p className="mt-0.5 text-center text-neutral-500" style={{ fontSize: "2.6mm" }}>
          番号入りのデジタル会員証と、店からの限定投稿が届きます。解約はいつでも。
        </p>
      </div>

      {/* フッター */}
      <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-neutral-200" style={{ paddingTop: "2.5mm" }}>
        <span className="rounded-full" style={{ width: "2mm", height: "2mm", background: "#e8261a" }} />
        <span className="font-bold tracking-[0.2em] text-neutral-800" style={{ fontSize: "2.8mm" }}>SPOT</span>
        <span className="text-neutral-400" style={{ fontSize: "2.4mm" }}>spotcloud.app</span>
      </div>
    </div>
  );
}

export default function PopPage({ params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = use(params);
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "forbidden">("loading");

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
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [authReady, user, spotId]);

  return (
    <PageShell className="space-y-6 py-8">
      {/* 印刷時はPOPのみを出力する */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pop-print, .pop-print * { visibility: visible; }
          .pop-print { position: fixed; top: 0; left: 0; margin: 0; }
        }
        @page { size: A6 portrait; margin: 0; }
      `}</style>

      <div className="print:hidden">
        <Breadcrumb items={[{ label: "管理", href: "/dashboard" }, { label: "店頭POP" }]} />
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-20 print:hidden">
          <Loader2 className="h-6 w-6 animate-spin text-ink/40" />
        </div>
      )}

      {status === "missing" && (
        <p className="py-20 text-center text-sm text-ink/65 print:hidden">SPOTが見つかりませんでした。</p>
      )}

      {status === "forbidden" && (
        <p className="py-20 text-center text-sm text-ink/65 print:hidden">このSPOTの管理権限がありません。</p>
      )}

      {status === "ready" && spot && (
        <>
          <div className="print:hidden">
            <span className="chip">店頭POP</span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink">レジ横に置くPOPを印刷</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/68">
              A6サイズ（はがきの一回り小さいサイズ）で印刷されます。
              レジ横に置いて、お会計のときに一言添えてください。応援会員の入会は、ほぼすべてここから生まれます。
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="cta-primary mt-5 inline-flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              印刷する
            </button>
            <p className="mt-2 text-xs text-ink/55">
              印刷ダイアログで用紙サイズを「A6」(なければA4・倍率100%)にしてください。
            </p>
          </div>

          {/* プレビュー（画面上は枠付き縮小表示） */}
          <div className="print:hidden">
            <p className="mb-3 text-sm font-bold text-ink/72">プレビュー</p>
            <div className="inline-block overflow-hidden rounded-xl border border-ink/12 shadow-[0_8px_30px_rgba(19,35,28,0.10)]">
              <PopCard spot={spot} />
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
