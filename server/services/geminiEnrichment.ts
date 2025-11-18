import { RegionDemographics, RegionMetricSource } from "../../shared/schema";

interface GeminiEnrichmentData {
  averageIncome?: number;
  foreignerRatio?: number;
  citations?: string[];
}

export async function enrichWithGemini(
  region: string,
  existingData: Partial<RegionDemographics>
): Promise<Partial<RegionDemographics>> {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    const missingFields: string[] = [];
    if (!existingData.averageIncome) missingFields.push("平均年収");
    if (!existingData.foreignerRatio) missingFields.push("外国人比率");

    if (missingFields.length === 0) {
      return existingData; // No enrichment needed
    }

    const prompt = `${region}について、以下の統計情報をJSON形式で提供してください。
必ず信頼できる公的統計や公開データに基づいて回答し、データの出典URLも含めてください。

必要な情報:
${!existingData.averageIncome ? "1. 平均年収（万円単位、数値のみ）" : ""}
${!existingData.foreignerRatio ? "2. 外国人比率（総人口に対する外国人の割合、パーセンテージ）" : ""}

以下のJSON形式で厳密に回答してください:
{
  ${!existingData.averageIncome ? '"averageIncome": 数値,' : ""}
  ${!existingData.foreignerRatio ? '"foreignerRatio": 数値,' : ""}
  "citations": ["出典URL1", "出典URL2"]
}

注意: JSON以外のテキストは一切含めず、JSONのみを返してください。
可能な限り、e-Stat、総務省統計局、厚生労働省などの公式統計を参照してください。`;

    const result = await client.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt,
    });

    const text = result.text || "";
    let jsonText = text.trim();
    jsonText = jsonText.replace(/^```json\n?/i, "").replace(/\n?```$/i, "");
    jsonText = jsonText.trim();

    const geminiData: GeminiEnrichmentData = JSON.parse(jsonText);

    const createAISource = (citations?: string[]): RegionMetricSource => ({
      name: "AI推定値（Gemini）",
      url: citations && citations.length > 0 ? citations[0] : undefined,
      retrievedAt: new Date().toISOString(),
      type: "ai_estimated",
    });

    const enrichedData: Partial<RegionDemographics> = { ...existingData };

    if (geminiData.averageIncome && !existingData.averageIncome) {
      enrichedData.averageIncome = {
        value: geminiData.averageIncome,
        source: createAISource(geminiData.citations),
      };
    }

    if (geminiData.foreignerRatio !== undefined && !existingData.foreignerRatio) {
      enrichedData.foreignerRatio = {
        value: geminiData.foreignerRatio,
        source: createAISource(geminiData.citations),
      };
    }

    return enrichedData;
  } catch (error) {
    console.error("Error enriching with Gemini:", error);
    return existingData; // Return original data if enrichment fails
  }
}
