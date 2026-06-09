"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * スクロールで要素が表示領域に入ったとき .is-visible を付与するフック。
 * 要素には事前に className="reveal" を付けておく。
 * staggerChildren=true の場合、直接の子要素それぞれに stagger delay を付ける。
 *
 * コールバックRef方式を採用しているため、条件付きレンダリングで
 * 要素が遅れてマウントされる場合でも正しく動作する。
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; staggerChildren?: boolean; staggerDelay?: number } = {}
) {
  const { threshold = 0.12, staggerChildren = false, staggerDelay = 80 } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (el: T | null) => {
      // 前のオブザーバーをクリーンアップ
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          if (staggerChildren) {
            Array.from(el.children).forEach((child, i) => {
              (child as HTMLElement).style.animationDelay = `${i * staggerDelay}ms`;
              child.classList.add("reveal", "is-visible");
            });
          } else {
            el.classList.add("is-visible");
          }
          observer.disconnect();
        },
        { threshold }
      );

      observer.observe(el);
      observerRef.current = observer;
    },
    [threshold, staggerChildren, staggerDelay]
  );

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return ref;
}
