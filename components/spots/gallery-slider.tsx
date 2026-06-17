"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Props = { images: string[] };

export function GallerySlider({ images }: Props) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  if (images.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  // スワイプ対応
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    startX.current = null;
  }

  return (
    <div className="panel overflow-hidden">
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* トラック */}
        <div
          className="flex transition-transform duration-400 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((url, i) => (
            <div key={url} className="relative w-full shrink-0 aspect-[3/2]">
              <Image
                src={url}
                alt={`ギャラリー ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 900px"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* 矢印ボタン（2枚以上） */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink shadow backdrop-blur-sm transition hover:bg-white hover:shadow-md"
              aria-label="前の画像"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink shadow backdrop-blur-sm transition hover:bg-white hover:shadow-md"
              aria-label="次の画像"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 枚数バッジ */}
        {images.length > 1 && (
          <div className="absolute right-4 bottom-4 rounded-full bg-ink/50 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
            {index + 1} / {images.length}
          </div>
        )}
      </div>

      {/* ドットインジケーター（6枚以下のとき） */}
      {images.length > 1 && images.length <= 6 && (
        <div className="flex justify-center gap-2 py-3">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index ? "w-5 h-1.5 bg-ink" : "w-1.5 h-1.5 bg-ink/25"
              }`}
              aria-label={`${i + 1}枚目`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
