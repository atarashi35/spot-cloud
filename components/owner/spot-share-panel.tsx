"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

export function SpotSharePanel({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"spot" | "signup" | null>(null);
  const spotQrRef = useRef<HTMLDivElement>(null);
  const signupQrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { setLoading(false); return; }

    void getSpotFromFirestore(spotId)
      .then((nextSpot) => {
        if (!nextSpot) { setError("SPOT が見つかりません。"); return; }
        if (nextSpot.ownerUid !== user.uid) { setError("運営者のみ利用できます。"); return; }
        setSpot(nextSpot);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authReady, spotId, user]);

  const spotUrl = spot
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/spots/${spot.id}`
    : "";
  const signupUrl = spot ? `${spotUrl}?signup=1` : "";

  async function handleCopy(kind: "spot" | "signup") {
    const url = kind === "spot" ? spotUrl : signupUrl;
    await navigator.clipboard.writeText(url);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleDownload(kind: "spot" | "signup") {
    const svg =
      (kind === "spot" ? spotQrRef.current : signupQrRef.current)?.querySelector("svg");
    if (!svg) return;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 白背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${spot?.name ?? "spot"}-${kind === "spot" ? "detail" : "signup"}-QR.png`;
      link.click();
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  }

  if (!authReady || loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">読み込み中です。</div>;
  }

  if (!user) {
    return <EmptyState title="ログインが必要です" description="運営者アカウントでログインしてください。" />;
  }

  if (error || !spot) {
    return <EmptyState title="取得できませんでした" description={error ?? "SPOT の取得で問題が発生しました。"} />;
  }

  return (
    <div className="py-3">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[28px] bg-mist px-5 py-6 text-center">
          <h2 className="text-lg font-semibold text-ink">SPOT詳細ページへのリンク</h2>
          <p className="mt-1.5 text-xs leading-5 text-ink/55">
            SPOTの紹介ページを見てもらうためのQR。<br />
            チラシや店頭POPに掲載するのに最適です。
          </p>
          <div ref={spotQrRef} className="mt-5 inline-flex rounded-[20px] bg-white p-5 shadow-sm">
            <QRCode value={spotUrl} size={210} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="cta-primary flex items-center gap-2"
              onClick={() => handleDownload("spot")}
            >
              <Download className="h-4 w-4" />
              保存
            </button>
            <button
              type="button"
              className="cta-secondary flex items-center gap-2"
              onClick={() => void handleCopy("spot")}
            >
              {copied === "spot" ? <Check className="h-4 w-4 text-moss" /> : <Copy className="h-4 w-4" />}
              {copied === "spot" ? "コピー済み" : "コピー"}
            </button>
          </div>
        </section>

        <section className="rounded-[28px] bg-mist px-5 py-6 text-center">
          <h2 className="text-lg font-semibold text-ink">ソシオ登録へのリンク</h2>
          <p className="mt-1.5 text-xs leading-5 text-ink/55">
            スキャンするとソシオ加入画面が開くQR。<br />
            「ソシオ募集中」の告知に直接使えます。
          </p>
          <div ref={signupQrRef} className="mt-5 inline-flex rounded-[20px] bg-white p-5 shadow-sm">
            <QRCode value={signupUrl} size={210} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="cta-primary flex items-center gap-2"
              onClick={() => handleDownload("signup")}
            >
              <Download className="h-4 w-4" />
              保存
            </button>
            <button
              type="button"
              className="cta-secondary flex items-center gap-2"
              onClick={() => void handleCopy("signup")}
            >
              {copied === "signup" ? <Check className="h-4 w-4 text-moss" /> : <Copy className="h-4 w-4" />}
              {copied === "signup" ? "コピー済み" : "コピー"}
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5 text-center">
        <Link href="/manage" className="text-sm text-ink/45 transition hover:text-ink">
          戻る
        </Link>
      </div>
    </div>
  );
}
