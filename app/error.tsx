"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/58">Error</p>
      <h1 className="text-2xl font-extrabold text-ink">問題が発生しました</h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-ink/68">
        ページの読み込みに失敗しました。再試行しても解決しない場合はお問い合わせください。
      </p>
      <button type="button" onClick={reset} className="cta-primary">
        もう一度試す
      </button>
    </div>
  );
}
