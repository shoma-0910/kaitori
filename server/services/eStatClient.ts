import { RegionDemographics, RegionMetricSource } from "../../shared/schema";
import { resolveMunicipalityCode } from "./municipalityCodes";

const ESTAT_API_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json";

interface EStatConfig {
  appId: string;
}

class EStatClient {
  private config: EStatConfig;
  private cache: Map<string, { data: any; expiresAt: number }>;

  constructor(appId: string) {
    this.config = { appId };
    this.cache = new Map();
  }

  private getCacheKey(statsDataId: string, params: Record<string, string>): string {
    return `${statsDataId}:${JSON.stringify(params)}`;
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any, ttlMs: number = 3600000): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private async fetchStatsData(
    statsDataId: string,
    params: Record<string, string>
  ): Promise<any> {
    const cacheKey = this.getCacheKey(statsDataId, params);
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const url = new URL(`${ESTAT_API_BASE}/getStatsData`);
    url.searchParams.append("appId", this.config.appId);
    url.searchParams.append("lang", "J");
    url.searchParams.append("statsDataId", statsDataId);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`e-Stat API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.GET_STATS_DATA?.RESULT?.STATUS !== 0) {
      throw new Error(
        `e-Stat API returned error: ${data.GET_STATS_DATA?.RESULT?.ERROR_MSG || "Unknown error"}`
      );
    }

    this.setCache(cacheKey, data);
    return data;
  }

  private createSource(name: string): RegionMetricSource {
    return {
      name,
      retrievedAt: new Date().toISOString(),
      type: "official",
    };
  }

  async getRegionDemographics(region: string): Promise<Partial<RegionDemographics>> {
    const municipalityInfo = resolveMunicipalityCode(region);
    
    if (!municipalityInfo) {
      throw new Error(`Municipality code not found for region: ${region}`);
    }

    const result: Partial<RegionDemographics> = {
      region: municipalityInfo.fullName,
    };

    try {
      // 2020年国勢調査データ - 人口・年齢構成
      // Dataset ID: 0003410379 (2020年国勢調査 人口等基本集計)
      // Note: e-Stat API parameters may vary by dataset
      const populationData = await this.fetchStatsData("0003410379", {
        cdArea: municipalityInfo.code,
      }).catch(err => {
        console.warn(`Failed to fetch e-Stat data for ${region}: ${err.message}`);
        return null;
      });

      if (!populationData) {
        console.log(`No e-Stat data available for ${region}, will use Gemini instead`);
        throw new Error(`No e-Stat data available for ${region}`);
      }

      const dataValues = populationData.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
      
      // Parse population and age distribution from census data
      let totalPopulation = 0;
      const ageGroups: Record<string, number> = {
        "0-17": 0,
        "18-34": 0,
        "35-49": 0,
        "50-64": 0,
        "65+": 0,
      };
      let maleCount = 0;
      let femaleCount = 0;

      for (const item of dataValues) {
        const value = parseFloat(item.$);
        const cat01 = item["@cat01"]; // Age category
        const cat02 = item["@cat02"]; // Gender category

        // Total population
        if (cat01 === "A0001") {
          totalPopulation = value;
        }

        // Gender counts
        if (cat02 === "A1101") { // Male
          maleCount += value;
        } else if (cat02 === "A1102") { // Female
          femaleCount += value;
        }

        // Age groups (simplified mapping)
        if (cat01?.startsWith("A0408")) { // 0-14 years
          ageGroups["0-17"] += value;
        } else if (cat01?.startsWith("A0409")) { // 15-64 years
          ageGroups["18-34"] += value * 0.3; // Rough estimate
          ageGroups["35-49"] += value * 0.35;
          ageGroups["50-64"] += value * 0.35;
        } else if (cat01?.startsWith("A0410")) { // 65+ years
          ageGroups["65+"] += value;
        }
      }

      if (totalPopulation > 0) {
        result.population = {
          value: totalPopulation,
          source: this.createSource("出典：e-Stat 国勢調査（2020年）"),
        };

        // Calculate average age (rough estimate based on age groups)
        const estimatedAverageAge = 
          (ageGroups["0-17"] * 9 + 
           ageGroups["18-34"] * 26 + 
           ageGroups["35-49"] * 42 + 
           ageGroups["50-64"] * 57 + 
           ageGroups["65+"] * 75) / totalPopulation;

        result.averageAge = {
          value: Math.round(estimatedAverageAge * 10) / 10,
          source: this.createSource("出典：e-Stat 国勢調査（2020年）"),
        };

        // Age distribution percentages
        result.ageDistribution = {
          value: [
            { range: "0-17歳", percentage: Math.round((ageGroups["0-17"] / totalPopulation) * 1000) / 10 },
            { range: "18-34歳", percentage: Math.round((ageGroups["18-34"] / totalPopulation) * 1000) / 10 },
            { range: "35-49歳", percentage: Math.round((ageGroups["35-49"] / totalPopulation) * 1000) / 10 },
            { range: "50-64歳", percentage: Math.round((ageGroups["50-64"] / totalPopulation) * 1000) / 10 },
            { range: "65歳以上", percentage: Math.round((ageGroups["65+"] / totalPopulation) * 1000) / 10 },
          ],
          source: this.createSource("出典：e-Stat 国勢調査（2020年）"),
        };

        // Gender ratio
        if (maleCount > 0 && femaleCount > 0) {
          const total = maleCount + femaleCount;
          result.genderRatio = {
            value: {
              male: Math.round((maleCount / total) * 1000) / 10,
              female: Math.round((femaleCount / total) * 1000) / 10,
            },
            source: this.createSource("出典：e-Stat 国勢調査（2020年）"),
          };
        }
      }
    } catch (error) {
      console.error("Error fetching population data from e-Stat:", error);
      // Continue with partial data
    }

    return result;
  }
}

let clientInstance: EStatClient | null = null;

export function getEStatClient(appId?: string): EStatClient {
  const apiKey = appId || process.env.ESTAT_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("e-Stat API key is not configured");
  }

  if (!clientInstance) {
    clientInstance = new EStatClient(apiKey);
  }

  return clientInstance;
}
