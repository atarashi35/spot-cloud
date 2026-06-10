"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import type { UserMembership } from "@/lib/types";
import { buildSocioCardData, buildShareContent } from "@/lib/socio-card-data";
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

/**
 * 表面要素をオフスクリーンにクローンしてキャプチャ。
 * カードが裏返し中でも transform なしで確実に取得できる。
 * setTimeout 不要 → ユーザージェスチャーのコンテキストを保持できる。
 */
async function captureCardAsPng(el: HTMLElement): Promise<Blob> {
  const { toBlob } = await import("html-to-image");

  // 元要素の実寸を取得してクローンに明示的に設定する。
  // 設定しないと fixed + off-screen 要素の幅が 0 になり toBlob が空 Blob を返す。
  const { width, height } = el.getBoundingClientRect();

  const clone = el.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: "fixed",
    top: "-9999px",
    left: "-9999px",
    width: `${width}px`,
    height: `${height}px`,
    transform: "none",
    backfaceVisibility: "visible",
    WebkitBackfaceVisibility: "visible",
    pointerEvents: "none",
  });
  document.body.appendChild(clone);

  try {
    const blob = await toBlob(clone, { pixelRatio: 3, cacheBust: true });
    if (!blob) throw new Error("toBlob が空を返しました（要素幅: ${width}px）");
    return blob;
  } finally {
    document.body.removeChild(clone);
  }
}

// ─── クリップボードコピー（execCommand フォールバック付き） ──────────────────

function legacyCopy(text: string, onResult: (msg: string) => void) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    onResult(ok ? "リンクをコピーしました！" : "コピーできませんでした。");
  } catch {
    onResult("コピーできませんでした。");
  }
}

// ─── 日付フォーマット ─────────────────────────────────────────────────────────

function toYM(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月〜`;
}

/** 「SINCE 2026.06」表記用 */
function toSince(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 会員番号の表示。3桁ゼロ埋め（1000人を超えたらそのまま） */
function formatMemberNo(n: number) {
  return `No.${n < 1000 ? String(n).padStart(3, "0") : String(n)}`;
}

// ─── コンポーネント ──────────────────────────────────────────────────────────

type Props = {
  uid: string;
  displayName: string;
  avatarUrl?: string | null;
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId" | "status">[];
  /** spotId → 会員番号（joinedAt順の通し番号）。/api/spots/[spotId]/socio-number から取得して渡す */
  memberNumbers?: Record<string, number | null>;
  /** LPデモなど閲覧専用の埋め込みでは false にして保存・コピー導線を隠す */
  showActions?: boolean;
  /** 暗い背景に埋め込む場合のヒント文字色の上書き */
  hintClassName?: string;
};

export function SocioCard({ uid, displayName, avatarUrl, memberships, memberNumbers, showActions = true, hintClassName = "text-ink/58" }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const data = useMemo(
    () => buildSocioCardData(uid, displayName, memberships),
    [uid, displayName, memberships]
  );
  const shareContent = useMemo(() => buildShareContent(data), [data]);

  const dots = useMemo(() => assignDotsToRings(Math.max(data.spotCount, 1)), [data.spotCount]);
  const dotCSS = useMemo(() => buildDotCSS(dots), [dots]);

  const spotsLabel = data.spotCount === 1 ? "SPOT" : "SPOTS";

  // 表面に大きく表示する主会員情報（最初の有効な所属）
  const primaryMembership = data.memberships[0] ?? null;
  const primaryNumber = primaryMembership
    ? memberNumbers?.[primaryMembership.spotId] ?? null
    : null;

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

  // トースト自動消去
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── 保存 & シェア ────────────────────────────────────────────────────────

  // 「カードを保存」: カード表面を PNG でダウンロード
  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const blob = await captureCardAsPng(cardRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spot-socio-card.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[SocioCard] save failed:", err);
      setToast({ message: "画像の保存に失敗しました。", ok: false });
    }
  }, []);

  // 「リンクをコピー」: SPOTの公開ページURLをコピー
  const handleShare = useCallback(() => {
    legacyCopy(`${shareContent.text}\n${shareContent.url}`, (msg) => {
      setToast({ message: msg, ok: msg.includes("コピーしました") });
    });
  }, [shareContent]);

  // ─── tiltのY回転 + flip回転を合成 ────────────────────────────────────────

  const flipY = isFlipped ? 180 : 0;
  const tiltTransform = isFlipped
    ? `perspective(900px) rotateY(${flipY}deg)`
    : `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY + flipY}deg)`;

  return (
    <div className="relative space-y-4">
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
              <span className="font-semibold tracking-[0.2em] text-white/70" style={{ fontSize: 11 }}>応援会員証</span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                {primaryMembership ? (
                  <>
                    <div className="truncate font-bold text-white" style={{ fontSize: 19, lineHeight: 1.25 }}>
                      {primaryMembership.spotName}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-3">
                      <span className="font-bold text-white tabular-nums" style={{ fontSize: 22, lineHeight: 1, letterSpacing: "0.02em" }}>
                        {primaryNumber !== null && primaryNumber !== undefined
                          ? formatMemberNo(primaryNumber)
                          : "MEMBER"}
                      </span>
                      <span className="font-semibold tracking-[0.18em] text-white/60" style={{ fontSize: 10 }}>
                        SINCE {toSince(primaryMembership.joinedAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="font-bold text-white tabular-nums" style={{ fontSize: 28, lineHeight: 1 }}>
                    {data.spotCount}
                    <span className="ml-1.5 font-semibold text-white/70" style={{ fontSize: 13, letterSpacing: "0.15em" }}>{spotsLabel}</span>
                  </div>
                )}
                <div className="mt-2.5 flex items-center gap-2 min-w-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded-full object-cover"
                      style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="rgba(255,255,255,0.5)">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    </div>
                  )}
                  <div className="truncate font-semibold text-white/80" style={{ fontSize: 13, letterSpacing: "0.04em" }}>
                    {displayName}
                  </div>
                </div>
              </div>
              {data.spotCount > 1 && (
                <div className="shrink-0 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <span className="font-bold text-white/80 tabular-nums" style={{ fontSize: 11 }}>+{data.spotCount - 1} SPOT</span>
                </div>
              )}
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
              <span className="font-semibold tracking-[0.22em] text-white/65" style={{ fontSize: 10 }}>
                SUPPORTER DETAILS
              </span>
              <div className="flex items-center gap-1.5">
                <div className="rounded-full" style={{ width: 7, height: 7, background: "#e8261a", boxShadow: "0 0 6px rgba(232,38,26,0.6)" }} />
                <span className="font-bold tracking-[0.18em] text-white/78" style={{ fontSize: 10 }}>SPOT</span>
              </div>
            </div>

            {/* SPOT一覧 */}
            <div className="mt-3 flex-1 overflow-hidden">
              {data.memberships.length === 0 ? (
                <p className="text-xs text-white/60">まだSPOTに参加していません</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.memberships.map((m) => {
                    const n = memberNumbers?.[m.spotId];
                    return (
                      <li key={m.spotId} className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-semibold text-white/85" style={{ fontSize: 12 }}>
                          {m.spotName}
                        </span>
                        <span className="shrink-0 text-white/55 tabular-nums" style={{ fontSize: 10 }}>
                          {n !== null && n !== undefined ? `${formatMemberNo(n)} · ` : ""}{toYM(m.joinedAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* フッター：SPOTS数 + 応援会員ID */}
            <div className="mt-auto flex items-end justify-between pt-3 border-t border-white/8">
              <div>
                <span className="font-bold text-white tabular-nums" style={{ fontSize: 20, lineHeight: 1 }}>
                  {data.spotCount}
                </span>
                <span className="ml-1 font-semibold text-white/65" style={{ fontSize: 10, letterSpacing: "0.15em" }}>
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
      <p className={`text-center text-xs ${hintClassName}`}>
        {isFlipped ? "タップして表面に戻す" : "タップして裏面を見る"}
      </p>

      {/* トースト通知 */}
      <div
        aria-live="polite"
        className={`pointer-events-none absolute inset-x-0 -top-12 flex justify-center transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {toast ? (
          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold shadow-md ${
              toast.ok
                ? "bg-[#355746] text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </span>
        ) : null}
      </div>

      {/* アクションボタン */}
      {showActions ? (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { void handleSave(); }}
          className="flex-1 rounded-full border border-ink/15 bg-white py-2.5 text-sm font-semibold text-ink transition hover:bg-sand active:scale-[0.98]"
        >
          カードを保存
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 rounded-full bg-moss py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          リンクをコピー
        </button>
      </div>
      ) : null}
    </div>
  );
}
