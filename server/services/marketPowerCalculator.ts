import { StoreArchetype, ParkingSize } from "../../shared/schema";

export interface MarketPowerInput {
  storeArchetype?: StoreArchetype | null;
  parkingSize?: ParkingSize | null;
  parkingCapacity?: number | null;
  population1km?: number;
  population2km?: number;
  seniorFemalePopulation?: number;
  averageIncome?: number;
}

export interface MarketPowerResult {
  score: number;
  attractionCoefficient: number;
  parkingCoefficient: number;
  populationScore: number;
  seniorFemaleScore: number;
  incomeScore: number;
  breakdown: {
    label: string;
    value: number;
    description: string;
  }[];
}

const ARCHETYPE_COEFFICIENTS: Record<string, number> = {
  station_front: 1.3,
  shopping_mall: 1.2,
  roadside: 1.0,
  suburban: 0.9,
  residential: 0.7,
};

const PARKING_COEFFICIENTS: Record<string, number> = {
  large: 1.2,
  medium: 1.0,
  small: 0.8,
  none: 0.6,
};

const ROTATION_RATES: Record<string, number> = {
  large: 1.5,
  medium: 1.3,
  small: 1.1,
  none: 0.8,
};

export function calculateMarketPower(input: MarketPowerInput): MarketPowerResult {
  const {
    storeArchetype,
    parkingSize,
    parkingCapacity,
    population1km = 0,
    population2km = 0,
    seniorFemalePopulation = 0,
    averageIncome = 0,
  } = input;

  const attractionCoefficient = storeArchetype 
    ? ARCHETYPE_COEFFICIENTS[storeArchetype] || 1.0 
    : 1.0;

  const parkingCoefficient = parkingSize 
    ? PARKING_COEFFICIENTS[parkingSize] || 1.0 
    : 1.0;

  const populationScore = (population1km * 0.7) + (population2km * 0.3);

  const seniorFemaleScore = seniorFemalePopulation * 2.0;

  let incomeScore = 1.0;
  if (averageIncome > 0) {
    if (averageIncome >= 500) {
      incomeScore = 1.3;
    } else if (averageIncome >= 400) {
      incomeScore = 1.1;
    } else if (averageIncome >= 300) {
      incomeScore = 1.0;
    } else {
      incomeScore = 0.8;
    }
  }

  let peakVisitorsEstimate = 100;
  if (parkingCapacity && parkingCapacity > 0) {
    const rotationRate = parkingSize ? ROTATION_RATES[parkingSize] || 1.2 : 1.2;
    peakVisitorsEstimate = parkingCapacity * rotationRate;
  } else if (parkingSize) {
    const defaultCapacities: Record<string, number> = {
      large: 100,
      medium: 40,
      small: 15,
      none: 0,
    };
    const capacity = defaultCapacities[parkingSize] || 30;
    const rotationRate = ROTATION_RATES[parkingSize] || 1.2;
    peakVisitorsEstimate = capacity * rotationRate;
  }

  const baseScore = (populationScore / 10000) * attractionCoefficient * parkingCoefficient * incomeScore;
  const seniorBonus = (seniorFemaleScore / 1000) * attractionCoefficient;
  const finalScore = Math.round((baseScore + seniorBonus) * 100) / 100;

  const breakdown = [
    {
      label: "店舗立地タイプ",
      value: attractionCoefficient,
      description: getArchetypeLabel(storeArchetype) + ` (係数: ${attractionCoefficient})`,
    },
    {
      label: "駐車場規模",
      value: parkingCoefficient,
      description: getParkingSizeLabel(parkingSize) + ` (係数: ${parkingCoefficient})`,
    },
    {
      label: "商圏人口スコア",
      value: Math.round(populationScore),
      description: `1km圏: ${population1km.toLocaleString()}人, 2km圏: ${population2km.toLocaleString()}人`,
    },
    {
      label: "60歳以上女性人口",
      value: seniorFemalePopulation,
      description: `${seniorFemalePopulation.toLocaleString()}人 (重み付け×2.0)`,
    },
    {
      label: "平均年収係数",
      value: incomeScore,
      description: averageIncome > 0 ? `${averageIncome}万円 (係数: ${incomeScore})` : "未設定",
    },
    {
      label: "推定ピーク来客数",
      value: Math.round(peakVisitorsEstimate),
      description: `${Math.round(peakVisitorsEstimate)}人/時間`,
    },
  ];

  return {
    score: finalScore,
    attractionCoefficient,
    parkingCoefficient,
    populationScore,
    seniorFemaleScore,
    incomeScore,
    breakdown,
  };
}

function getArchetypeLabel(archetype?: StoreArchetype | null): string {
  const labels: Record<string, string> = {
    station_front: "駅前",
    suburban: "郊外",
    shopping_mall: "商業施設併設",
    roadside: "ロードサイド",
    residential: "住宅街",
  };
  return archetype ? labels[archetype] || "未設定" : "未設定";
}

function getParkingSizeLabel(size?: ParkingSize | null): string {
  const labels: Record<string, string> = {
    none: "なし",
    small: "小規模（1-20台）",
    medium: "中規模（21-50台）",
    large: "大規模（51台以上）",
  };
  return size ? labels[size] || "未設定" : "未設定";
}

export function getRankFromScore(score: number): string {
  if (score >= 8) return "S";
  if (score >= 5) return "A";
  if (score >= 3) return "B";
  return "C";
}
