import { ReactNode } from "react";

const toneClassMap = {
  neutral: "bg-white text-ink/80 border-ink/10",
  success: "bg-moss/10 text-moss border-moss/15",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200"
} as const;

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: keyof typeof toneClassMap;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.14em] ${toneClassMap[tone]}`}
    >
      {children}
    </span>
  );
}
