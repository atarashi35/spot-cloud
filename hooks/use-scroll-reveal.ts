"use client";

import { useEffect, useRef } from "react";

/**
 * スクロールで要素が表示領域に入ったとき .is-visible を付与するフック。
 * 要素には事前に className="reveal" を付けておく。
 * staggerChildren=true の場合、直接の子要素それぞれに stagger delay を付ける。
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; staggerChildren?: boolean; staggerDelay?: number } = {}
) {
  const ref = useRef<T>(null);
  const { threshold = 0.12, staggerChildren = false, staggerDelay = 80 } = options;

  useEffect(() => {
    const el = ref.current;
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
    return () => observer.disconnect();
  }, [threshold, staggerChildren, staggerDelay]);

  return ref;
}
