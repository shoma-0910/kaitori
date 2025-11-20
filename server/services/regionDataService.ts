import type { RegionDemographics, RegionMetricSource } from "@shared/schema";

export async function fetchRegionDemographics(region: string): Promise<Partial<RegionDemographics>> {
  let demographicsData: Partial<RegionDemographics> = {};
  let useGeminiFallback = false;

  // Try to get official data from e-Stat first (if API key is configured)
  if (process.env.ESTAT_API_KEY) {
    try {
      const { getEStatClient } = await import("./eStatClient");
      const eStatClient = getEStatClient();
      demographicsData = await eStatClient.getRegionDemographics(region);
      
      // Check if we actually got meaningful data (more than just the region name)
      const hasData = Object.keys(demographicsData).length > 1;
      if (hasData) {
        console.log(`✓ e-Stat data retrieved for ${region}`);
      } else {
        console.log(`e-Stat returned no data for ${region}, using Gemini fallback`);
        useGeminiFallback = true;
      }
    } catch (eStatError: any) {
      console.warn(`e-Stat data fetch failed for ${region}:`, eStatError.message);
      useGeminiFallback = true;
    }
  } else {
    console.log("e-Stat API key not configured, using Gemini fallback");
    useGeminiFallback = true;
  }

  // If e-Stat completely failed or is not configured, fall back to Gemini for all data
  if (useGeminiFallback && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const prompt = `日本の${region}について、以下の統計情報をJSON形式で提供してください。最新の公開データに基づいて回答し、必ずデータの出典も含めてください。

必要な情報:
1. 平均年齢（数値のみ）
2. 年齢分布（0-17歳、18-34歳、35-49歳、50-64歳、65歳以上の割合）
3. 男女比（男性と女性の割合）
4. 平均年収（万円単位、数値のみ）
5. 外国人比率（総人口に対する外国人の割合、パーセンテージ）

以下のJSON形式で厳密に回答してください:
{
  "region": "${region}",
  "averageAge": 数値,
  "ageDistribution": [
    {"range": "0-17歳", "percentage": 数値},
    {"range": "18-34歳", "percentage": 数値},
    {"range": "35-49歳", "percentage": 数値},
    {"range": "50-64歳", "percentage": 数値},
    {"range": "65歳以上", "percentage": 数値}
  ],
  "genderRatio": {
    "male": 数値,
    "female": 数値
  },
  "averageIncome": 数値,
  "foreignerRatio": 数値,
  "citations": ["出典URL1", "出典URL2"]
}

注意: JSON以外のテキストは一切含めず、JSONのみを返してください。`;

      const result = await client.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });
      const text = result.text || "";
      let jsonText = text.trim();
      jsonText = jsonText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '');
      jsonText = jsonText.trim();
      
      const geminiData = JSON.parse(jsonText);
      
      const createAISource = (citations?: string[]): RegionMetricSource => ({
        name: "AI推定値（Gemini）",
        url: citations && citations.length > 0 ? citations[0] : undefined,
        retrievedAt: new Date().toISOString(),
        type: "ai_estimated",
      });

      demographicsData = {
        region: geminiData.region || region,
        averageAge: geminiData.averageAge ? {
          value: geminiData.averageAge,
          source: createAISource(geminiData.citations),
        } : undefined,
        ageDistribution: geminiData.ageDistribution ? {
          value: geminiData.ageDistribution,
          source: createAISource(geminiData.citations),
        } : undefined,
        genderRatio: geminiData.genderRatio ? {
          value: geminiData.genderRatio,
          source: createAISource(geminiData.citations),
        } : undefined,
        averageIncome: geminiData.averageIncome ? {
          value: geminiData.averageIncome,
          source: createAISource(geminiData.citations),
        } : undefined,
        foreignerRatio: geminiData.foreignerRatio !== undefined ? {
          value: geminiData.foreignerRatio,
          source: createAISource(geminiData.citations),
        } : undefined,
      };
      console.log(`✓ Gemini fallback data retrieved for ${region}`);
    } catch (geminiError: any) {
      console.error(`Gemini fallback also failed for ${region}:`, geminiError.message);
      // Return at least the region name even if both sources fail
      demographicsData = {
        region: region,
      };
    }
  } else if (useGeminiFallback && !process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key not configured, cannot fall back");
    demographicsData = {
      region: region,
    };
  }

  // Enrich with Gemini for missing fields (e.g., average income, foreigner ratio)
  // Only try enrichment if we have some data from e-Stat
  if (!useGeminiFallback && process.env.GEMINI_API_KEY && Object.keys(demographicsData).length > 1) {
    try {
      const { enrichWithGemini } = await import("./geminiEnrichment");
      demographicsData = await enrichWithGemini(region, demographicsData);
      console.log(`✓ Gemini enrichment applied for ${region}`);
    } catch (enrichError) {
      console.warn("Gemini enrichment failed:", enrichError);
    }
  }

  return demographicsData;
}
