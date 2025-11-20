import { storage } from "../storage";

export async function logApiUsage(
  organizationId: string,
  apiType: "google_places" | "google_gemini",
  endpoint: string,
  metadata?: any
): Promise<void> {
  try {
    await storage.createApiUsageLog({
      organizationId,
      apiType,
      endpoint,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  } catch (error) {
    console.error("Failed to log API usage:", error);
  }
}

export function calculateEstimatedCost(
  placesCount: number,
  geminiCount: number
): number {
  const PLACES_COST_PER_1000 = 40;
  const GEMINI_COST_PER_REQUEST = 0.5;
  
  const placesCost = (placesCount / 1000) * PLACES_COST_PER_1000;
  const geminiCost = geminiCount * GEMINI_COST_PER_REQUEST;
  
  return placesCost + geminiCost;
}
