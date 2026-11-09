export function canReceiveActivity(scope: "public" | "supporters" | "paid", minPlanAmount: number, membership: { status?: string; planAmount?: number } | null, follows: boolean): boolean {
  const active = membership?.status === "active" || membership?.status === "canceling";
  if (active && Number(membership?.planAmount ?? 0) >= minPlanAmount) return true;
  return scope !== "paid" && follows;
}
