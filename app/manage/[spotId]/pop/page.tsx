"use client";

import { use, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Loader2, Printer } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

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
      className="pop-print flex flex-col bg-white"
      style={{ width: "210mm", height: "297mm", padding: "18mm 18mm 0" }}
    >
      {/* ロゴ */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/spot_logo_horizontal.svg" alt="SPOT" style={{ height: "14mm", width: "auto", marginBottom: "16mm", display: "block", alignSelf: "flex-start" }} />

      {/* メインコピー */}
      <h1
        style={{
          fontSize: getNameFontSize(spot.name),
          fontWeight: 900,
          color: "#111111",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          wordBreak: "break-all",
          marginBottom: "4mm",
        }}
      >
        {spot.name}の
      </h1>
      <p style={{ fontSize: "18mm", fontWeight: 900, color: "#111111", lineHeight: 1.1, marginBottom: "14mm" }}>
        応援会員に<br />なりませんか？
      </p>

      {/* QR */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "10mm" }}>
        <div style={{ border: "2px solid #e0e0e0", borderRadius: "6mm", padding: "8mm", background: "#fff" }}>
          <QRCode value={buildJoinUrl(spot.id)} size={300} bgColor="#ffffff" fgColor="#111111" level="M" />
        </div>
      </div>

      {/* 価格 */}
      <p style={{ fontSize: "10mm", fontWeight: 700, color: "#111111", textAlign: "center", marginBottom: "4mm" }}>
        年会費¥3,000〜
      </p>
      <p style={{ fontSize: "5.5mm", color: "#888888", textAlign: "center", marginBottom: "14mm" }}>
        QRコードをスキャンして応援会員登録
      </p>

      {/* フッター */}
      <div
        style={{ borderTop: "1px solid #e8e8e8", padding: "5mm 0", textAlign: "center" }}
      >
        <span style={{ fontSize: "4.5mm", color: "#aaa" }}>spotcloud.app</span>
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
        <Breadcrumb items={[{ label: "管理", href: "/dashboard" }, { label: "QRカード" }]} />
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
            <span className="chip">QRカード</span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink">目立つ場所に置くQRカードを印刷</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/68">
              A4サイズで印刷されます。レジ横・受付・会場など、目に入る場所に置いてください。
              声をかけるときに一言添えると、応援会員の入会につながります。
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
