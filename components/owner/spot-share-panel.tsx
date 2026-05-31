"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

type ShareTarget = {
  key: string;
  label: string;
  description: string;
  url: string;
};

function buildOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

function QrCard({
  target,
  onCopy,
  onDownload
}: {
  target: ShareTarget;
  onCopy: (text: string) => Promise<void>;
  onDownload: (key: string, label: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (svg) {
      svg.setAttribute("data-qr-key", target.key);
    }
  }, [target.key]);

  return (
    <article className="rounded-[28px] border border-ink/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-ink">{target.label}</h3>
          <p className="mt-2 text-sm leading-7 text-ink/65">{target.description}</p>
        </div>
      </div>
      <div className="mt-5 rounded-[24px] bg-mist p-5">
        <div ref={containerRef} className="mx-auto flex w-fit rounded-[20px] bg-white p-4">
          <QRCode value={target.url} size={192} />
        </div>
      </div>
      <div className="mt-5 rounded-[20px] bg-mist px-4 py-3 text-xs leading-6 text-ink/62">
        {target.url}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="cta-secondary" onClick={() => onCopy(target.url)}>
          URLをコピー
        </button>
        <button type="button" className="cta-secondary" onClick={() => onDownload(target.key, target.label)}>
          QRを保存
        </button>
        <a href={target.url} target="_blank" rel="noreferrer" className="cta-primary">
          リンク確認
        </a>
      </div>
    </article>
  );
}

export function SpotSharePanel({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    void getSpotFromFirestore(spotId)
      .then((nextSpot) => {
        if (!nextSpot) {
          setError("SPOT が見つかりません。");
          return;
        }

        if (nextSpot.ownerUid !== user.uid) {
          setError("この配布ページは運営者のみ利用できます。");
          return;
        }

        setSpot(nextSpot);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authReady, spotId, user]);

  const targets = useMemo(() => {
    if (!spot) {
      return [];
    }

    const origin = buildOrigin();
    const detailUrl = `${origin}/spots/${spot.id}`;

    return [
      {
        key: "detail",
        label: "SPOT詳細ページ",
        description: "まず場所の説明を読んでもらいたいときの基本QRです。",
        url: detailUrl
      },
      {
        key: "join-select",
        label: "プランを選んで加入",
        description: "100円 / 300円 / 500円 の中から、その場で選んでもらうための加入QRです。",
        url: `${detailUrl}/join`
      }
    ] satisfies ShareTarget[];
  }, [spot]);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("URL をコピーしました。");
    } catch {
      setNotice("コピーに失敗しました。ブラウザ権限を確認してください。");
    }
  }

  function handleDownload(key: string, label: string) {
    const svg = document.querySelector(`svg[data-qr-key="${key}"]`);

    if (!svg) {
      setNotice("QR の保存に失敗しました。");
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${spot?.name ?? "spot"}-${label}.svg`;
    link.click();

    URL.revokeObjectURL(url);
    setNotice("QR を保存しました。");
  }

  if (!authReady || loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">配布用リンクを読み込み中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="QR配布ページはログイン後に利用できます"
        description="Google ログインした状態で、自分の SPOT の配布用 QR を作成できます。"
      />
    );
  }

  if (error || !spot) {
    return (
      <EmptyState
        title="配布用 QR を準備できませんでした"
        description={error ?? "SPOT の取得で問題が発生しました。"}
      />
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-[28px] bg-mist px-5 py-5">
        <h2 className="text-2xl font-bold text-ink">{spot.name} の QR 配布</h2>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          店頭POPや会合で見せるための配布用リンクです。まず説明を見せるなら詳細QR、その場加入を促すなら金額別の加入QRを使ってください。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/manage" className="cta-secondary">
            マイSPOT
          </Link>
          <Link href={`/spots/${spot.id}`} className="cta-primary">
            公開ページを確認
          </Link>
        </div>
        {notice ? <p className="mt-4 text-sm font-medium text-ink/70">{notice}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {targets.map((target) => (
          <QrCard
            key={target.key}
            target={target}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </div>
  );
}
