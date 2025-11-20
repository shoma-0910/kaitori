import { RegionDemographics } from "@shared/schema";

export type StoreRank = "S" | "A" | "B" | "C" | "D";

export interface RankingCriteria {
  elderlyFemaleRatio: number;
}

export function calculateStoreRank(demographics: RegionDemographics): { rank: StoreRank; criteria: RankingCriteria } {
  const ageDistribution = demographics.ageDistribution?.value || [];
  const genderRatio = demographics.genderRatio?.value;
  const population = demographics.population?.value || 0;

  let elderlyFemaleRatio = 0;

  if (genderRatio && ageDistribution.length > 0) {
    let elderly60PlusPercentage = 0;
    
    for (const ageGroup of ageDistribution) {
      const range = ageGroup.range;
      if (range.includes("60") || range.includes("65") || range.includes("70") || 
          range.includes("75") || range.includes("80") || range.includes("85")) {
        elderly60PlusPercentage += ageGroup.percentage;
      }
    }

    const femaleRatio = genderRatio.female / 100;
    elderlyFemaleRatio = (elderly60PlusPercentage / 100) * femaleRatio;
  }

  let rank: StoreRank;
  if (elderlyFemaleRatio >= 0.25) {
    rank = "S";
  } else if (elderlyFemaleRatio >= 0.18) {
    rank = "A";
  } else if (elderlyFemaleRatio >= 0.12) {
    rank = "B";
  } else if (elderlyFemaleRatio >= 0.06) {
    rank = "C";
  } else {
    rank = "D";
  }

  return {
    rank,
    criteria: {
      elderlyFemaleRatio: Math.round(elderlyFemaleRatio * 10000) / 100,
    },
  };
}

export function getRankColor(rank: StoreRank): string {
  switch (rank) {
    case "S":
      return "#DC2626";
    case "A":
      return "#EA580C";
    case "B":
      return "#F59E0B";
    case "C":
      return "#10B981";
    case "D":
      return "#6B7280";
    default:
      return "#6B7280";
  }
}

export function getRankLabel(rank: StoreRank): string {
  switch (rank) {
    case "S":
      return "最優先";
    case "A":
      return "優先";
    case "B":
      return "通常";
    case "C":
      return "低優先";
    case "D":
      return "対象外";
    default:
      return "未評価";
  }
}
