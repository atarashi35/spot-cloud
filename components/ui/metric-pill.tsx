import { ReactNode } from "react";

export function MetricPill({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-full border border-ink/10 bg-white/75 px-4 py-2.5 text-sm">
      <span className="text-ink/48">{label}</span>
      <span className="ml-2 font-semibold text-ink">{value}</span>
    </div>
  );
}
