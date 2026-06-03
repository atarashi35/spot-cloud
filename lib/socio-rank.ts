export type SocioRankKey = "bronze" | "silver" | "gold" | "platinum";

export type SocioRank = {
  key: SocioRankKey;
  label: "Bronze" | "Silver" | "Gold" | "Platinum";
  minCount: number;
};

export const socioRanks: readonly SocioRank[] = [
  { key: "bronze", label: "Bronze", minCount: 10 },
  { key: "silver", label: "Silver", minCount: 30 },
  { key: "gold", label: "Gold", minCount: 50 },
  { key: "platinum", label: "Platinum", minCount: 100 }
] as const;

export function getSocioRank(socioCount: number): SocioRank | null {
  for (let index = socioRanks.length - 1; index >= 0; index -= 1) {
    const rank = socioRanks[index];
    if (socioCount >= rank.minCount) {
      return rank;
    }
  }

  return null;
}

export function getNextSocioRank(socioCount: number): SocioRank | null {
  return socioRanks.find((rank) => socioCount < rank.minCount) ?? null;
}

export function getSocioRankProgress(socioCount: number) {
  const currentRank = getSocioRank(socioCount);
  const nextRank = getNextSocioRank(socioCount);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      remainingCount: 0,
      progressPercent: 100
    };
  }

  const previousThreshold = currentRank?.minCount ?? 0;
  const span = nextRank.minCount - previousThreshold;
  const progressed = socioCount - previousThreshold;
  const progressPercent = span <= 0 ? 0 : Math.max(0, Math.min(100, (progressed / span) * 100));

  return {
    currentRank,
    nextRank,
    remainingCount: Math.max(0, nextRank.minCount - socioCount),
    progressPercent
  };
}
