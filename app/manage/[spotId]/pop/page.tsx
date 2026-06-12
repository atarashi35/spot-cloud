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
 * A4サイズで印刷し、レジ横や壁に置く。
 * レジ横が応援会員獲得の唯一の配布チャネルなので、このページが営業の本体。
 */

function getNameFontSize(name: string): string {
  const len = name.length;
  if (len <= 8)  return "20mm";
  if (len <= 14) return "14mm";
  if (len <= 20) return "10mm";
  return "7.5mm";
}

function buildJoinUrl(spotId: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://spotcloud.app");
  return `${base}/spots/${spotId}`;
}

function PopCard({ spot }: { spot: Spot }) {
  return (
    <div
      className="pop-print flex flex-col overflow-hidden bg-white"
      style={{ width: "210mm", height: "297mm" }}
    >
      {/* ── 上部ダーク帯（店名ヒーロー） ── */}
      <div
        className="flex flex-shrink-0 flex-col justify-between"
        style={{ background: "#111111", padding: "11mm 14mm 12mm", height: "120mm" }}
      >
        {/* ブランドライン */}
        <div className="flex items-center" style={{ gap: "2.5mm" }}>
          <span style={{ width: "4.5mm", height: "4.5mm", borderRadius: "50%", background: "#e8261a", boxShadow: "0 0 6px rgba(232,38,26,0.7)", display: "inline-block" }} />
          <span style={{ fontSize: "5mm", fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.65)" }}>SPOT</span>
        </div>

        {/* 店名 + キャッチ */}
        <div>
          <h1
            style={{
              fontSize: getNameFontSize(spot.name),
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              wordBreak: "break-all",
            }}
          >
            {spot.name}
          </h1>
          <p style={{ fontSize: "8.5mm", fontWeight: 700, color: "rgba(255,255,255,0.72)", marginTop: "4mm", lineHeight: 1.25 }}>
            の応援会員に<br />なりませんか？
          </p>
        </div>
      </div>

      {/* ── 下部白帯（QRヒーロー） ── */}
      <div className="flex flex-1 flex-col items-center justify-between" style={{ padding: "10mm 14mm 0" }}>

        {/* 価格チップ */}
        <div className="flex items-center" style={{ gap: "4mm" }}>
          {planOptions.map((amount) => (
            <span
              key={amount}
              style={{
                fontSize: "6mm",
                fontWeight: 700,
                color: "#333",
                border: "1.5px solid #ccc",
                borderRadius: "100px",
                padding: "2mm 5mm",
              }}
            >
              月{amount.toLocaleString()}円
            </span>
          ))}
        </div>

        {/* QR */}
        <div className="flex flex-col items-center" style={{ gap: "5mm" }}>
          <div style={{ border: "2px solid #e0e0e0", borderRadius: "5mm", padding: "6mm", background: "#fff" }}>
            <QRCode value={buildJoinUrl(spot.id)} size={280} bgColor="#ffffff" fgColor="#111111" level="M" />
          </div>
          <p style={{ fontSize: "6.5mm", fontWeight: 700, color: "#222", textAlign: "center", lineHeight: 1.4 }}>
            スマホで読み取り、その場で入会
          </p>
          <p style={{ fontSize: "5mm", color: "#888", textAlign: "center", lineHeight: 1.5 }}>
            番号入りのデジタル会員証がその場で発行されます。解約はいつでも。
          </p>
        </div>

        {/* フッター */}
        <div
          className="flex w-full items-center justify-between"
          style={{ borderTop: "1px solid #e8e8e8", padding: "5mm 0" }}
        >
          <div className="flex items-center" style={{ gap: "2.5mm" }}>
            <span style={{ width: "4mm", height: "4mm", borderRadius: "50%", background: "#e8261a", display: "inline-block" }} />
            <span style={{ fontSize: "5.5mm", fontWeight: 800, letterSpacing: "0.2em", color: "#111" }}>SPOT</span>
          </div>
          <span style={{ fontSize: "4.5mm", color: "#aaa" }}>spotcloud.app</span>
        </div>
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
          .pop-print, .pop-print * {
            visibility: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pop-print { position: fixed; top: 0; left: 0; margin: 0; }
          .pop-card-wrapper { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
        }
        @page { size: A4 portrait; margin: 0; }
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
              A4サイズで印刷されます。レジ横や壁に貼って使ってください。
              お会計のときに一言添えると、応援会員の入会につながります。
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
              印刷ダイアログで用紙サイズ「A4」・余白「なし」・「背景のグラフィック」オンを確認してください。
            </p>
          </div>

          {/* プレビューラベルのみ印刷時非表示 */}
          <p className="mb-3 text-sm font-bold text-ink/72 print:hidden">プレビュー</p>
          {/* カードはprint:hiddenの外に置く — display:noneはvisibility:visibleで上書きできないため */}
          <div className="pop-card-wrapper inline-block overflow-hidden rounded-xl border border-ink/12 shadow-[0_8px_30px_rgba(19,35,28,0.10)]">
            <PopCard spot={spot} />
          </div>
        </>
      )}
    </PageShell>
  );
}
