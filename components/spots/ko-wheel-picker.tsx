"use client";

import { useEffect, useMemo, useRef } from "react";

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 3;

/**
 * 口数を選ぶドラムロール式ピッカー。スワイプ/マウスホイールでの
 * スクロールでまとめて値を変えられる（+/-連打の代替）。
 * スクロール停止位置を中央行にスナップし、その口数を onChange で返す。
 */
export function KoWheelPicker({
  value,
  onChange,
  min,
  max = 100
}: {
  value: number;
  onChange: (ko: number) => void;
  min: number;
  max?: number;
}) {
  const options = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [min, max]);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressNextScrollEvent = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const target = (value - min) * ROW_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      suppressNextScrollEvent.current = true;
      el.scrollTo({ top: target, behavior: "auto" });
    }
  }, [value, min]);

  function scrollToKo(ko: number, smooth: boolean) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: (ko - min) * ROW_HEIGHT, behavior: smooth ? "smooth" : "auto" });
  }

  function handleScroll() {
    if (suppressNextScrollEvent.current) {
      suppressNextScrollEvent.current = false;
      return;
    }
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ROW_HEIGHT)));
      const nextKo = min + idx;
      scrollToKo(nextKo, true);
      if (nextKo !== value) onChange(nextKo);
    }, 100);
  }

  return (
    <div className="relative" style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-[10px] border border-ink/10 bg-white shadow-sm"
        style={{ height: ROW_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="hide-scrollbar relative h-full snap-y snap-mandatory overflow-y-scroll"
        style={{ paddingBlock: ROW_HEIGHT }}
      >
        {options.map((ko) => (
          <div
            key={ko}
            role="button"
            aria-label={`${ko}口を選択`}
            onClick={() => { scrollToKo(ko, true); if (ko !== value) onChange(ko); }}
            className={`flex snap-center items-center justify-center font-bold tabular-nums transition ${
              ko === value ? "text-2xl text-ink" : "text-base text-ink/30"
            }`}
            style={{ height: ROW_HEIGHT }}
          >
            {ko}
          </div>
        ))}
      </div>
    </div>
  );
}
