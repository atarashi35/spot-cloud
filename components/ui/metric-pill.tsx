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
      <span className="text-ink/55">{label}</span>
      <span className="ml-2 font-extrabold text-teal-600">{value}</span>
    </div>
  );
}
