"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";

// Google Walletへの追加ボタン
// Android / Google系ブラウザでのみ表示

function isGoogleWalletAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  // iOSは除外（Apple Walletを使う）
  if (/iPhone|iPad|iPod/.test(ua)) return false;
  // Android または Chrome（デスクトップも含む）で表示
  return /Android/.test(ua) || /Chrome/.test(ua);
}

export function GoogleWalletButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleAdd = useCallback(async () => {
    if (!user) return;
    setStatus("loading");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/wallet/google", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `status ${res.status}`);
      }
      const { url } = await res.json();
      // Google Walletの保存ページへリダイレクト
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus("idle");
    } catch (err) {
      console.error("[GoogleWalletButton]", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [user]);

  if (!isGoogleWalletAvailable()) return null;

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={status === "loading"}
      className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
      style={{
        background: "linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      {status === "loading" ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          処理中...
        </>
      ) : status === "error" ? (
        "エラーが発生しました"
      ) : (
        <>
          {/* Google Wallet アイコン */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect width="24" height="24" rx="4" fill="white" fillOpacity="0.15"/>
            <path d="M12 5.5C10.07 5.5 8.32 6.33 7.09 7.65L5 5.56C6.77 3.67 9.25 2.5 12 2.5C16.14 2.5 19.66 5.08 21.08 8.75H18.43C17.26 6.77 15.28 5.5 12 5.5Z" fill="white"/>
            <path d="M5.5 12C5.5 10.97 5.69 9.99 6.04 9.09L3.45 7.64C2.85 9.01 2.5 10.46 2.5 12C2.5 13.54 2.85 14.99 3.45 16.36L6.04 14.91C5.69 14.01 5.5 13.03 5.5 12Z" fill="white"/>
            <path d="M12 18.5C15.28 18.5 17.26 17.23 18.43 15.25H21.08C19.66 18.92 16.14 21.5 12 21.5C9.25 21.5 6.77 20.33 5 18.44L7.09 16.35C8.32 17.67 10.07 18.5 12 18.5Z" fill="white"/>
            <circle cx="12" cy="12" r="3.5" fill="white"/>
          </svg>
          Google Walletに追加
        </>
      )}
    </button>
  );
}
