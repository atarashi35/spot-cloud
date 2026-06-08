"use client";

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
  const flyerQrRef = useRef<HTMLDivElement>(null);

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

  async function handleFlyerDownload() {
    const svg = flyerQrRef.current?.querySelector("svg");
    if (!svg || !spot) return;

    const W = 600;
    const H = 840;
    const SCALE = 3;
    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const qrSvgData = new XMLSerializer().serializeToString(svg);
    const qrImg = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvgData)}`
    );

    const logoSvgText = await fetch("/spot_logo_horizontal.svg").then(r => r.text());
    const logoBlob = new Blob([logoSvgText], { type: "image/svg+xml" });
    const logoUrl = URL.createObjectURL(logoBlob);
    const logoImg = await loadImage(logoUrl);
    URL.revokeObjectURL(logoUrl);

    // 背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // ロゴ
    const logoH = 32;
    const logoW = logoImg.naturalWidth > 0
      ? logoImg.naturalWidth * (logoH / logoImg.naturalHeight)
      : 120;
    ctx.drawImage(logoImg, 48, 52, logoW, logoH);

    // メインコピー
    ctx.fillStyle = "#111111";
    ctx.font = "bold 48px 'Helvetica Neue', 'Hiragino Sans', 'Yu Gothic', sans-serif";
    ctx.fillText("メンバーとして、", 48, 200);

    const spotName = spot.name ?? "";
    const nameText = `${spotName}に`;
    ctx.font = "bold 44px 'Helvetica Neue', 'Hiragino Sans', 'Yu Gothic', sans-serif";
    if (ctx.measureText(nameText).width > W - 96) {
      ctx.font = "bold 36px 'Helvetica Neue', 'Hiragino Sans', 'Yu Gothic', sans-serif";
    }
    ctx.fillText(nameText, 48, 262);

    ctx.font = "bold 48px 'Helvetica Neue', 'Hiragino Sans', 'Yu Gothic', sans-serif";
    ctx.fillText("関わろう。", 48, 324);

    // QRコード
    const qrSize = 220;
    const qrX = (W - qrSize) / 2;
    const qrY = 370;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 16);
    ctx.fill();
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // 料金
    ctx.textAlign = "center";
    ctx.font = "600 22px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "#111111";
    ctx.fillText("¥100 / ¥300 / ¥500 /月", W / 2, 650);

    ctx.font = "14px 'Helvetica Neue', 'Hiragino Sans', 'Yu Gothic', sans-serif";
    ctx.fillStyle = "#888888";
    ctx.fillText("QRコードをスキャンしてメンバー登録", W / 2, 682);

    ctx.fillStyle = "#e5e5e5";
    ctx.fillRect(48, 740, W - 96, 1);

    ctx.font = "12px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText("spotcloud.app", W / 2, 770);

    ctx.textAlign = "left";

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${spot.name ?? "spot"}-メンバー募集チラシ.png`;
    link.click();
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
          <h2 className="text-lg font-semibold text-ink">メンバー登録へのリンク</h2>
          <p className="mt-1.5 text-xs leading-5 text-ink/55">
            スキャンするとメンバー加入画面が開くQR。<br />
            「メンバー募集中」の告知に直接使えます。
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

      <section className="mt-5 rounded-[28px] bg-mist px-5 py-6">
        <h2 className="text-lg font-semibold text-ink">メンバー募集チラシ</h2>
        <p className="mt-1.5 text-xs leading-5 text-ink/55">
          印刷してそのまま使えるチラシをPNGで保存できます。<br />
          店頭POP・名刺・チラシに貼り付けてご利用ください。
        </p>

        {/* チラシプレビュー */}
        <div className="mt-5 flex justify-center">
          <div className="w-[240px] rounded-[16px] border border-ink/10 bg-white px-6 py-7 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/spot_logo_horizontal.svg" alt="SPOT" className="mb-4 h-5 w-auto" />
            <p className="text-[13px] font-bold leading-snug text-ink">
              メンバーとして、<br />
              <span className="text-[12px]">{spot.name}に</span><br />
              関わろう。
            </p>
            <div ref={flyerQrRef} className="my-4 flex justify-center">
              <QRCode value={signupUrl} size={90} />
            </div>
            <p className="text-center text-[8px] font-semibold text-ink">¥100 / ¥300 / ¥500 /月</p>
            <p className="mt-1 text-center text-[7px] text-ink/50">QRコードをスキャンしてメンバー登録</p>
            <div className="my-3 h-px bg-ink/10" />
            <p className="text-center text-[7px] text-ink/40">spotcloud.app</p>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            className="cta-primary flex items-center gap-2"
            onClick={() => void handleFlyerDownload()}
          >
            <Download className="h-4 w-4" />
            チラシをダウンロード
          </button>
        </div>
      </section>

    </div>
  );
}
