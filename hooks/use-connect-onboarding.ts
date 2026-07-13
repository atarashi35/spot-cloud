"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function useConnectOnboarding(spotId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function start() {
    if (inFlight.current) return;
    inFlight.current = true;

    if (!user) {
      setError("受取設定を始めるにはログインが必要です。");
      inFlight.current = false;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spotId })
      });

      const data = (await response.json()) as { url?: string; error?: string; message?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? data.error ?? "connect_onboarding_error");
      }

      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connect onboarding を開始できませんでした。");
      setLoading(false);
      inFlight.current = false;
    }
  }

  return { start, loading, error };
}
