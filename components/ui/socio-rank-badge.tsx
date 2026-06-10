import { Gem } from "lucide-react";
import { getSocioRank, SocioRankKey } from "@/lib/socio-rank";

const toneClassMap: Record<SocioRankKey, string> = {
  bronze: "border-[#c07a43]/25 bg-[linear-gradient(135deg,rgba(255,245,236,0.96),rgba(238,206,177,0.95))] text-[#8a4f21]",
  silver: "border-slate-300/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(228,233,239,0.96))] text-slate-700",
  gold: "border-amber-300/70 bg-[linear-gradient(135deg,rgba(255,251,232,0.98),rgba(255,223,130,0.94))] text-amber-800",
  platinum: "border-cyan-200/80 bg-[linear-gradient(135deg,rgba(244,252,255,0.98),rgba(198,235,244,0.96))] text-cyan-900"
};

export function SocioRankBadge({
  socioCount,
  compact = false
}: {
  socioCount: number;
  compact?: boolean;
}) {
  const rank = getSocioRank(socioCount);

  if (!rank) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-[0_8px_24px_rgba(19,35,28,0.08)] ${toneClassMap[rank.key]} ${
        compact ? "gap-1.5 px-2.5 py-1 text-[13px]" : "gap-2 px-3 py-1.5 text-xs"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/70">
        <Gem className="h-3 w-3" />
      </span>
      <span className="font-semibold tracking-[0.16em]">SUPPORTER {rank.label}</span>
    </span>
  );
}
