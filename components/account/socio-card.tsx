"use client";

import { useRef, useCallback, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import type { UserMembership } from "@/lib/types";
import { buildSocioCardData, buildShareText } from "@/lib/socio-card-data";
export type { SocioCardData } from "@/lib/socio-card-data";

// ─── 軌道ドット設計 ──────────────────────────────────────────────────────────

const RINGS = [
  { radius: 46, duration: 9 },
  { radius: 64, duration: 14 },
  { radius: 82, duration: 20 },
  { radius: 100, duration: 27 },
] as const;

function assignDotsToRings(count: number) {
  const dots: { radius: number; duration: number; startAngle: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    const ringIndex = i % RINGS.length;
    const ring = RINGS[ringIndex];
    const posInRing = Math.floor(i / RINGS.length);
    const totalInRing = Math.ceil(count / RINGS.length);
    const startAngle = (posInRing / Math.max(totalInRing, 1)) * 360 + ringIndex * 37;
    dots.push({
      radius: ring.radius,
      duration: ring.duration + ringIndex * 3,
      startAngle,
      size: ringIndex === 0 ? 4 : ringIndex === 1 ? 3.5 : ringIndex === 2 ? 3 : 2.5,
    });
  }
  return dots;
}

function buildDotCSS(dots: ReturnType<typeof assignDotsToRings>): string {
  return dots
    .map((dot, i) => {
      const s = dot.startAngle;
      const r = dot.radius;
      return `
        @keyframes orbit-dot-${i} {
          from { transform: rotate(${s}deg) translateX(${r}px) rotate(${-s}deg); }
          to   { transform: rotate(${s + 360}deg) translateX(${r}px) rotate(${-(s + 360)}deg); }
        }
        .socio-dot-${i} { animation: orbit-dot-${i} ${dot.duration}s linear infinite; }
      `;
    })
    .join("");
}

// ─── PNG保存 ─────────────────────────────────────────────────────────────────

async function captureCardAsPng(el: HTMLElement): Promise<Blob> {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(el, { pixelRatio: 3, cacheBust: true });
  if (!blob) throw new Error("toBlob failed");
  return blob;
}

// ─── 日付フォーマット ─────────────────────────────────────────────────────────

function toYM(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月〜`;
}

// ─── コンポーネント ──────────────────────────────────────────────────────────

type Props = {
  uid: string;
  displayName: string;
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId" | "status">[];
};

export function SocioCard({ uid, displayName, memberships }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const data = useMemo(
    () => buildSocioCardData(uid, displayName, memberships),
    [uid, displayName, memberships]
  );

  const dots = useMemo(() => assignDotsToRings(Math.max(data.spotCount, 1)), [data.spotCount]);
  const dotCSS = useMemo(() => buildDotCSS(dots), [dots]);

  const spotsLabel = data.spotCount === 1 ? "SPOT" : "SPOTS";

  // ─── tilt（表面のみ有効） ──────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isFlipped) return;
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ rotateX: (0.5 - y) * 22, rotateY: (x - 0.5) * 28, glareX: x * 100, glareY: y * 100 });
  }, [isFlipped]);

  const handlePointerLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
    setIsHovering(false);
  }, []);

  // ─── 保存 & シェア ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    // 裏面表示中は表面に戻してからキャプチャ
    const wasFlipped = isFlipped;
    if (wasFlipped) setIsFlipped(false);
    await new Promise((r) => setTimeout(r, 320));
    try {
      const blob = await captureCardAsPng(cardRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spot-socio-card.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      if (wasFlipped) setIsFlipped(true);
    }
  }, [isFlipped]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    const wasFlipped = isFlipped;
    if (wasFlipped) setIsFlipped(false);
    await new Promise((r) => setTimeout(r, 320));
    try {
      const blob = await captureCardAsPng(cardRef.current);
      const file = new File([blob], "spot-socio-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SPOT SOCIO CARD",
          text: buildShareText(data),
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "spot-socio-card.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // キャンセルは無視
    } finally {
      if (wasFlipped) setIsFlipped(true);
    }
  }, [isFlipped, data]);

  // ─── tiltのY回転 + flip回転を合成 ────────────────────────────────────────

  const flipY = isFlipped ? 180 : 0;
  const tiltTransform = isFlipped
    ? `perspective(900px) rotateY(${flipY}deg)`
    : `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY + flipY}deg)`;

  return (
    <div className="space-y-4">
      <style>{dotCSS}</style>

      {/* tilt + flip コンテナ */}
      <div
        ref={tiltRef}
        className="rounded-[24px] cursor-pointer"
        style={{
          boxShadow: isHovering
            ? "0 32px 70px rgba(0,0,0,0.45), 0 6px 24px rgba(232,38,26,0.22)"
            : "0 24px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(232,38,26,0.15)",
          transform: tiltTransform,
          transition: isHovering && !isFlipped
            ? "transform 0.08s ease-out, box-shadow 0.2s"
            : "transform 0.55s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s",
          willChange: "transform",
          transformStyle: "preserve-3d",
        }}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => { if (!isFlipped) setIsHovering(true); }}
        onPointerLeave={handlePointerLeave}
        onClick={handleFlip}
      >
        {/* ── 表面 ── */}
        <div
          ref={cardRef}
          className="relative w-full overflow-hidden rounded-[24px] select-none"
          style={{
            aspectRatio: "1.586",
            background: "linear-gradient(135deg, #111111 0%, #1a1a1a 40%, #0d0d0d 100%)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* グレア */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,${isHovering ? 0.10 : 0}), transparent 65%)`,
              transition: isHovering ? "none" : "background 0.5s",
            }}
          />

          {/* 赤コア + 軌道ドット */}
          <div
            className="absolute"
            style={{ top: "50%", right: "30%", transform: "translate(50%, -50%)" }}
            aria-hidden="true"
          >
            <div
              className="rounded-full"
              style={{
                width: 22, height: 22,
                background: "radial-gradient(circle at 35% 35%, #ff4d3f, #e8261a 60%, #a01a11)",
                boxShadow: "0 0 20px rgba(232,38,26,0.65), 0 0 44px rgba(232,38,26,0.28)",
              }}
            />
            {dots.map((dot, i) => (
              <div key={i} className={`socio-dot-${i} absolute inset-0 flex items-center justify-center`}>
                <div
                  className="rounded-full"
                  style={{
                    width: dot.size, height: dot.size,
                    background: `rgba(255,255,255,${0.7 - (dot.radius - 46) / 100})`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* カードコンテンツ（表面） */}
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full" style={{ width: 10, height: 10, background: "#e8261a", boxShadow: "0 0 8px rgba(232,38,26,0.7)" }} />
                <span className="font-bold tracking-[0.22em] text-white" style={{ fontSize: 13 }}>SPOT</span>
              </div>
              <span className="font-semibold tracking-[0.25em] text-white/50" style={{ fontSize: 11 }}>SOCIO</span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="font-bold text-white tabular-nums" style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.01em" }}>
                  {data.spotCount}
                  <span className="ml-1.5 font-semibold text-white/50" style={{ fontSize: 13, letterSpacing: "0.15em" }}>{spotsLabel}</span>
                </div>
                <div className="mt-2 truncate font-semibold text-white/80" style={{ fontSize: 13, letterSpacing: "0.04em" }}>
                  {displayName}
                </div>
              </div>
              <div className="shrink-0 rounded-[8px] bg-white p-1.5">
                <QRCode value={data.verifyUrl} size={52} bgColor="#ffffff" fgColor="#111111" level="M" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 裏面 ── */}
        <div
          className="absolute inset-0 w-full overflow-hidden rounded-[24px] select-none"
          style={{
            aspectRatio: "1.586",
            background: "linear-gradient(135deg, #0d0d0d 0%, #161616 50%, #111111 100%)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute inset-0 flex flex-col p-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <span className="font-semibold tracking-[0.22em] text-white/40" style={{ fontSize: 10 }}>
                SOCIO DETAILS
              </span>
              <div className="flex items-center gap-1.5">
                <div className="rounded-full" style={{ width: 7, height: 7, background: "#e8261a", boxShadow: "0 0 6px rgba(232,38,26,0.6)" }} />
                <span className="font-bold tracking-[0.18em] text-white/60" style={{ fontSize: 10 }}>SPOT</span>
              </div>
            </div>

            {/* SPOT一覧 */}
            <div className="mt-3 flex-1 overflow-hidden">
              {data.memberships.length === 0 ? (
                <p className="text-xs text-white/30">まだSPOTに参加していません</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.memberships.map((m) => (
                    <li key={m.spotId} className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-semibold text-white/85" style={{ fontSize: 12 }}>
                        {m.spotName}
                      </span>
                      <span className="shrink-0 text-white/35" style={{ fontSize: 10 }}>
                        {toYM(m.joinedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* フッター：SPOTS数 + ソシオID */}
            <div className="mt-auto flex items-end justify-between pt-3 border-t border-white/8">
              <div>
                <span className="font-bold text-white tabular-nums" style={{ fontSize: 20, lineHeight: 1 }}>
                  {data.spotCount}
                </span>
                <span className="ml-1 font-semibold text-white/40" style={{ fontSize: 10, letterSpacing: "0.15em" }}>
                  {spotsLabel}
                </span>
              </div>
              <span className="font-mono text-white/25" style={{ fontSize: 9 }}>
                ID: {uid.slice(0, 12)}…
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ヒント */}
      <p className="text-center text-xs text-ink/35">
        {isFlipped ? "タップして表面に戻す" : "タップして裏面を見る"}
      </p>

      {/* アクションボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-full border border-ink/15 bg-white py-2.5 text-sm font-semibold text-ink transition hover:bg-sand active:scale-[0.98]"
        >
          カードを保存
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 rounded-full bg-moss py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          シェアする
        </button>
      </div>
    </div>
  );
}
