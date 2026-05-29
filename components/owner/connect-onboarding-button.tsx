"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type ConnectOnboardingButtonProps = {
  spotId: string;
  connected: boolean;
  className?: string;
  label?: string;
};

export function ConnectOnboardingButton({
  spotId,
  connected,
  className = "cta-primary",
  label
}: ConnectOnboardingButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startOnboarding() {
    if (!user) {
      setError("受取設定を始めるにはログインが必要です。");
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
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" className={className} onClick={startOnboarding} disabled={loading}>
        {loading ? "Stripeへ移動中..." : (label ?? (connected ? "受取設定を再開する" : "受取設定を始める"))}
      </button>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
