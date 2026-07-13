"use client";

import { useConnectOnboarding } from "@/hooks/use-connect-onboarding";

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
  const { start, loading, error } = useConnectOnboarding(spotId);

  return (
    <div className="space-y-2">
      <button type="button" className={className} onClick={() => void start()} disabled={loading}>
        {loading ? "受取設定の画面を開いています..." : (label ?? (connected ? "受取設定を再開する" : "受取設定を始める"))}
      </button>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
