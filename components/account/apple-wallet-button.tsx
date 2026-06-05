"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";

// Apple Walletへの追加ボタン
// iOSのSafariでのみ表示する（Androidやデスクトップでは非表示）

function isAppleDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function AppleWalletButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleAdd = useCallback(async () => {
    if (!user) return;
    setStatus("loading");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/wallet/apple", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `status ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "socio.pkpass";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus("idle");
    } catch (err) {
      console.error("[AppleWalletButton]", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [user]);

  // AppleデバイスのSafari以外では表示しない
  if (!isAppleDevice()) return null;

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={status === "loading"}
      className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
    >
      {status === "loading" ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          追加中...
        </>
      ) : status === "error" ? (
        "エラーが発生しました"
      ) : (
        <>
          {/* Apple公式SVGアイコン */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple Walletに追加
        </>
      )}
    </button>
  );
}
