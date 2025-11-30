import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStoreSchema, insertEventSchema, insertCostSchema, insertRegisteredStoreSchema, insertStoreSaleSchema, organizations, userOrganizations } from "@shared/schema";
import { createCalendarEvent } from "./google-calendar";
import { supabaseAdmin } from "../lib/supabase";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "./middleware/auth";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stores
  app.get("/api/stores", requireAuth, async (req: AuthRequest, res) => {
    try {
      const stores = await storage.getAllStores(req.organizationId!);
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stores/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const store = await storage.getStore(req.params.id, req.organizationId!);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(store);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stores", requireAuth, async (req: AuthRequest, res) => {
    try {
      console.log("[POST /api/stores] Request body:", JSON.stringify(req.body));
      console.log("[POST /api/stores] organizationId from auth:", req.organizationId);
      
      const data = insertStoreSchema.parse({
        ...req.body,
        organizationId: req.organizationId,
      });
      
      console.log("[POST /api/stores] Parsed data:", JSON.stringify(data));
      
      const store = await storage.createStore(data);
      res.status(201).json(store);
    } catch (error: any) {
      console.error("[POST /api/stores] Error:", error.message, error.stack);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/stores/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const store = await storage.updateStore(req.params.id, req.organizationId!, req.body);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/stores/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteStore(req.params.id, req.organizationId!);
      if (!success) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Events
  app.get("/api/events", requireAuth, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getAllEvents(req.organizationId!);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/events/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const event = await storage.getEvent(req.params.id, req.organizationId!);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { addToGoogleCalendar, ...eventData } = req.body;
      
      const dataToValidate = {
        ...eventData,
        organizationId: req.organizationId,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
      };
      
      const data = insertEventSchema.parse(dataToValidate);
      
      let googleCalendarEventId = null;
      
      if (addToGoogleCalendar) {
        try {
          let storeName = "店舗";
          let location = undefined;
          
          const regularStore = await storage.getStore(data.storeId, req.organizationId!);
          if (regularStore) {
            storeName = regularStore.name;
            location = regularStore.address;
          } else {
            const registeredStore = await storage.getRegisteredStore(data.storeId, req.organizationId!);
            if (registeredStore) {
              storeName = registeredStore.name;
              location = registeredStore.address;
            }
          }
          
          const summary = `${storeName} - 買取催事`;
          const description = `担当者: ${data.manager}\n予定コスト: ¥${data.estimatedCost.toLocaleString()}\n${data.notes ? `\n備考: ${data.notes}` : ''}`;
          
          googleCalendarEventId = await createCalendarEvent(
            summary,
            description,
            new Date(data.startDate),
            new Date(data.endDate),
            location
          );
          
          if (googleCalendarEventId) {
            data.googleCalendarEventId = googleCalendarEventId;
          }
        } catch (calendarError: any) {
          console.error('Failed to add to Google Calendar:', calendarError.message);
        }
      }
      
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/events/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const updateData = { ...req.body };
      
      // Convert date strings to Date objects if present
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      const event = await storage.updateEvent(req.params.id, req.organizationId!, updateData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // 催事別売上が入力された場合、店舗別売上に反映
      if (updateData.actualRevenue !== undefined || updateData.itemsPurchased !== undefined) {
        try {
          const revenue = updateData.actualRevenue ?? event.actualRevenue ?? 0;
          const itemsSold = updateData.itemsPurchased ?? event.itemsPurchased ?? 0;
          
          console.log(`[PATCH /api/events] Syncing to store sales - eventId: ${event.id}, revenue: ${revenue}, items: ${itemsSold}, storeId: ${event.storeId}`);
          
          // RegisteredStoreを確認
          const registeredStore = await storage.getRegisteredStore(event.storeId, req.organizationId!);
          
          if (registeredStore) {
            console.log(`[PATCH /api/events] Found RegisteredStore: ${registeredStore.id}`);
            
            // 同じ日のレコードを確認して、存在しなければ作成、存在すれば更新
            const existingSales = await storage.getSalesByStore(registeredStore.id, req.organizationId!);
            const saleDate = event.startDate;
            const sameDaySale = existingSales.find(s => 
              new Date(s.saleDate).toDateString() === new Date(saleDate).toDateString()
            );
            
            if (sameDaySale) {
              // 既存レコードを更新
              console.log(`[PATCH /api/events] Updating existing sale: ${sameDaySale.id}`);
              await storage.updateSale(sameDaySale.id, req.organizationId!, {
                revenue: revenue,
                itemsSold: itemsSold,
                notes: `イベント: ${event.id}`,
              });
            } else {
              // 新規レコードを作成
              console.log(`[PATCH /api/events] Creating new sale record`);
              await storage.createSale({
                organizationId: req.organizationId!,
                registeredStoreId: registeredStore.id,
                saleDate: saleDate,
                revenue: revenue,
                itemsSold: itemsSold,
                notes: `イベント: ${event.id}`,
              });
            }
          } else {
            console.log(`[PATCH /api/events] RegisteredStore not found for storeId: ${event.storeId}`);
          }
        } catch (syncError: any) {
          console.error('[PATCH /api/events] Failed to sync to store sales:', syncError.message, syncError.stack);
        }
      }

      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/events/:id/add-to-calendar", requireAuth, async (req: AuthRequest, res) => {
    try {
      const event = await storage.getEvent(req.params.id, req.organizationId!);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      let storeName = "店舗";
      let location = undefined;
      
      const regularStore = await storage.getStore(event.storeId, req.organizationId!);
      if (regularStore) {
        storeName = regularStore.name;
        location = regularStore.address;
      } else {
        const registeredStore = await storage.getRegisteredStore(event.storeId, req.organizationId!);
        if (registeredStore) {
          storeName = registeredStore.name;
          location = registeredStore.address;
        }
      }
      
      const summary = `${storeName} - 買取催事`;
      const description = `担当者: ${event.manager}\n予定コスト: ¥${event.estimatedCost.toLocaleString()}\n${event.notes ? `\n備考: ${event.notes}` : ''}`;
      
      const googleCalendarEventId = await createCalendarEvent(
        summary,
        description,
        new Date(event.startDate),
        new Date(event.endDate),
        location
      );

      if (!googleCalendarEventId) {
        return res.status(500).json({ error: "Failed to add to Google Calendar" });
      }

      res.json({ success: true, googleCalendarEventId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id, req.organizationId!);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Costs
  app.get("/api/events/:eventId/costs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const costs = await storage.getCostsByEvent(req.params.eventId, req.organizationId!);
      res.json(costs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/costs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = insertCostSchema.parse({
        ...req.body,
        organizationId: req.organizationId,
      });
      const cost = await storage.createCost(data);
      res.status(201).json(cost);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/costs/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteCost(req.params.id, req.organizationId!);
      if (!success) {
        return res.status(404).json({ error: "Cost not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Registered Stores
  app.get("/api/registered-stores", requireAuth, async (req: AuthRequest, res) => {
    try {
      const stores = await storage.getAllRegisteredStores(req.organizationId!);
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/registered-stores/place/:placeId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const store = await storage.getRegisteredStoreByPlaceId(req.params.placeId, req.organizationId!);
      if (!store) {
        return res.status(404).json({ error: "Registered store not found" });
      }
      res.json(store);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/registered-stores", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = insertRegisteredStoreSchema.parse({
        ...req.body,
        organizationId: req.organizationId,
      });
      
      // Check if store already registered
      const existing = await storage.getRegisteredStoreByPlaceId(data.placeId, req.organizationId!);
      if (existing) {
        return res.status(409).json({ error: "Store already registered" });
      }
      
      const store = await storage.createRegisteredStore(data);
      res.status(201).json(store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/registered-stores/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteRegisteredStore(req.params.id, req.organizationId!);
      if (!success) {
        return res.status(404).json({ error: "Registered store not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/registered-stores/:id/analyze-parking", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const store = await storage.getRegisteredStore(id, req.organizationId!);
      if (!store) {
        return res.status(404).json({ error: "Registered store not found" });
      }

      if (store.parkingStatus && store.parkingAnalyzedAt) {
        const daysSinceAnalysis = (Date.now() - new Date(store.parkingAnalyzedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceAnalysis < 30) {
          return res.json({
            parkingStatus: store.parkingStatus,
            parkingConfidence: store.parkingConfidence,
            parkingReason: "キャッシュされた結果",
            analyzedAt: store.parkingAnalyzedAt,
            cached: true
          });
        }
      }

      const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!googleMapsApiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: geminiApiKey });

      // 複数角度からのStreet View画像を取得（北、東、南、西）
      const headings = [0, 90, 180, 270];
      const imagePromises = headings.map(async (heading) => {
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${store.latitude},${store.longitude}&heading=${heading}&fov=90&pitch=0&key=${googleMapsApiKey}`;
        try {
          const imageResponse = await fetch(streetViewUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          return Buffer.from(imageBuffer).toString('base64');
        } catch (error) {
          console.warn(`Failed to fetch Street View image for heading ${heading}`);
          return null;
        }
      });

      const images = await Promise.all(imagePromises);
      const validImages = images.filter((img): img is string => img !== null);

      if (validImages.length === 0) {
        throw new Error("Failed to fetch Street View images");
      }

      // 複数角度の画像を一度に分析（精度向上）
      const prompt = `この店舗の周辺画像（複数の角度から撮影）を総合的に分析して、駐車場の有無を判定してください。

判定基準（重要度順）：
1. 駐車スペース：建物の前、横、裏に駐車スペースの有無
2. 駐車場標識：駐車場の看板、マーク、白線、境界線の有無
3. 営業形態から推定される駐車場：商業施設の前で駐車が必要か
4. 路上駐車の可能性：店舗前の街道に駐車スペースがあるか

複数の画像から総合的に判断し、以下のJSON形式で回答してください。信頼度は0-100の整数値で、複数角度の分析結果から最も確実な判定を示してください：

{
  "status": "available" | "unavailable" | "unknown",
  "confidence": 0-100の整数（複数角度分析による確信度）,
  "reason": "判定根拠を詳しく日本語で",
  "details": {
    "hasMarkedSpaces": true|false,
    "hasUnmarkedSpaces": true|false,
    "hasStreetParking": true|false
  }
}`;

      const parts: any = [{ text: prompt }];
      validImages.forEach((base64Image, index) => {
        parts.push({
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
          }
        });
      });

      const result = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: parts
          }
        ]
      });

      const responseText = result.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse Gemini response");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      await storage.updateRegisteredStore(id, req.organizationId!, {
        parkingStatus: analysis.status,
        parkingConfidence: analysis.confidence,
        parkingAnalyzedAt: new Date()
      });

      await storage.logApiUsage({
        organizationId: req.organizationId!,
        apiType: "google_street_view",
        endpoint: "/maps/api/streetview",
        metadata: JSON.stringify({ storeId: id, storeName: store.name, angleCount: validImages.length })
      });

      await storage.logApiUsage({
        organizationId: req.organizationId!,
        apiType: "gemini_vision",
        endpoint: "generateContent",
        metadata: JSON.stringify({ model: "gemini-1.5-flash", storeId: id, imageCount: validImages.length })
      });

      res.json({
        parkingStatus: analysis.status,
        parkingConfidence: analysis.confidence,
        parkingReason: analysis.reason,
        parkingDetails: analysis.details,
        analyzedAt: new Date(),
        cached: false
      });

    } catch (error: any) {
      console.error("[POST /api/registered-stores/:id/analyze-parking] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Store Sales
  app.get("/api/sales-analytics", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Get direct sales records
      const directSales = await storage.getAllStoreSales(req.organizationId!);
      
      // Get events with sales data
      const events = await storage.getAllEvents(req.organizationId!);
      const registeredStores = await storage.getAllRegisteredStores(req.organizationId!);
      
      // Convert events to sales records
      const eventSales = events
        .filter(event => event.actualRevenue || event.itemsPurchased)
        .map(event => {
          const store = registeredStores.find(s => s.id === event.storeId);
          return {
            id: `event-${event.id}`,
            organizationId: event.organizationId,
            registeredStoreId: event.storeId,
            saleDate: event.startDate,
            revenue: event.actualRevenue || 0,
            itemsSold: event.itemsPurchased || 0,
            notes: event.notes,
            storeName: store?.name || '未登録店舗',
            storeAddress: store?.address || ''
          };
        });
      
      // Combine and return
      const combinedSales = [...directSales, ...eventSales];
      res.json(combinedSales);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/registered-stores/:id/sales", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sales = await storage.getSalesByStore(req.params.id, req.organizationId!);
      res.json(sales);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/registered-stores/:id/sales", requireAuth, async (req: AuthRequest, res) => {
    try {
      const store = await storage.getRegisteredStore(req.params.id, req.organizationId!);
      if (!store) {
        return res.status(404).json({ error: "Registered store not found" });
      }

      // Parse and validate the sale data
      const saleData = {
        organizationId: req.organizationId,
        registeredStoreId: req.params.id,
        saleDate: new Date(req.body.saleDate),
        revenue: parseInt(req.body.revenue, 10),
        itemsSold: parseInt(req.body.itemsSold, 10),
        notes: req.body.notes || null,
      };

      const data = insertStoreSaleSchema.parse(saleData);
      const sale = await storage.createSale(data);
      res.status(201).json(sale);
    } catch (error: any) {
      console.error("Sales creation error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/store-sales/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteSale(req.params.id, req.organizationId!);
      if (!success) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Nearby Search
  app.post("/api/nearby-search", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: "Address is required" });
      }

      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      // First, geocode the address to get coordinates
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=ja&region=jp`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
        return res.status(404).json({ error: "Address not found" });
      }

      const location = geocodeData.results[0].geometry.location;
      const lat = location.lat;
      const lng = location.lng;

      // Search for nearby places (restaurants, cafes, stores, etc.)
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&language=ja&key=${apiKey}`;
      const nearbyResponse = await fetch(nearbyUrl);
      const nearbyData = await nearbyResponse.json();

      if (nearbyData.status !== 'OK') {
        return res.status(500).json({ error: "Failed to fetch nearby places" });
      }

      // Format the results
      const places = nearbyData.results.slice(0, 20).map((place: any) => ({
        name: place.name,
        vicinity: place.vicinity,
        types: place.types,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        openNow: place.opening_hours?.open_now,
      }));

      res.json({ places });
    } catch (error: any) {
      console.error("Nearby search error:", error);
      res.status(500).json({ error: error.message || "Failed to search nearby places" });
    }
  });

  // Search nearby supermarkets with ranking
  app.post("/api/search-supermarkets", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Log the organization context for this request
      console.log(`[Supermarket Search] Request from organization: ${req.organizationId}`);
      
      const { latitude, longitude, radius } = req.body;
      
      if (!latitude || !longitude || !radius) {
        return res.status(400).json({ error: "Latitude, longitude, and radius are required" });
      }

      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      // Log API usage
      const { logApiUsage } = await import("./utils/apiLogger");
      await logApiUsage(
        req.organizationId!,
        "google_places",
        "nearbysearch",
        { latitude, longitude, radius }
      );

      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=supermarket&language=ja&key=${apiKey}`;
      const nearbyResponse = await fetch(nearbyUrl);
      const nearbyData = await nearbyResponse.json();

      if (nearbyData.status !== 'OK' && nearbyData.status !== 'ZERO_RESULTS') {
        return res.status(500).json({ error: "Failed to fetch nearby supermarkets" });
      }

      const results = nearbyData.results || [];
      
      // Process each supermarket to get demographics and rank
      const { calculateStoreRank } = await import("./utils/rankCalculator");
      const { fetchRegionDemographics } = await import("./services/regionDataService");
      
      let geminiCallCount = 0;
      const supermarketsWithRanking = await Promise.all(
        results.slice(0, 20).map(async (place: any) => {
          let rank = null;
          let demographicData = null;
          let elderlyFemaleRatio = null;

          // Extract city/ward from address components
          try {
            let region = null;
            if (place.vicinity) {
              const addressParts = place.vicinity.split(/[、,]/);
              if (addressParts.length > 0) {
                region = addressParts[0].trim();
              }
            }

            if (region) {
              // Fetch demographic data for the region using direct function call
              const demographics = await fetchRegionDemographics(region);
              
              if (demographics && demographics.region && Object.keys(demographics).length > 1) {
                demographicData = demographics;
                geminiCallCount++;
                
                // Calculate rank based on demographics
                const rankingResult = calculateStoreRank(demographics as import("@shared/schema").RegionDemographics);
                rank = rankingResult.rank;
                elderlyFemaleRatio = rankingResult.criteria.elderlyFemaleRatio;
              }
            }
          } catch (error) {
            console.warn(`Failed to get demographics for ${place.name}:`, error);
          }

          // Google レーティングを考慮したランク計算の改善
          // rating: 店舗評価、userRatingsTotal: レビュー数を活用
          let enhancedRank = rank;
          if (place.rating && place.rating > 0) {
            // レーティングが高い場合はランクを上げる（3.8以上でA、4.5以上でS）
            const ratingBonus = place.rating >= 4.5 ? 2 : place.rating >= 3.8 ? 1 : 0;
            if (ratingBonus > 0 && rank) {
              const rankMap: { [key: string]: number } = { "D": 0, "C": 1, "B": 2, "A": 3, "S": 4 };
              const rankValues = ["D", "C", "B", "A", "S"];
              const currentRankValue = rankMap[rank] || 2;
              enhancedRank = rankValues[Math.min(currentRankValue + ratingBonus, 4)] || rank;
            }
            // レビュー数が多い場合はランクを微調整
            if (place.user_ratings_total && place.user_ratings_total >= 100) {
              // 信頼性が高い（多くのレビューがある）→ ランク維持
            }
          }

          return {
            placeId: place.place_id,
            name: place.name,
            address: place.vicinity || '',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            phoneNumber: place.formatted_phone_number || null,
            website: place.website || null,
            openingHours: place.opening_hours?.weekday_text || [],
            rank: enhancedRank,
            demographicData: demographicData ? JSON.stringify(demographicData) : null,
            elderlyFemaleRatio,
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || null,
          };
        })
      );

      // Log Gemini API usage
      if (geminiCallCount > 0) {
        await logApiUsage(
          req.organizationId!,
          "google_gemini",
          "generateContent",
          { callCount: geminiCallCount }
        );
      }

      res.json({ supermarkets: supermarketsWithRanking });
    } catch (error: any) {
      console.error("Supermarket search error:", error);
      res.status(500).json({ error: error.message || "Failed to search supermarkets" });
    }
  });

  // Region Info - Hybrid approach using e-Stat official data + Gemini enrichment
  app.post("/api/region-info", async (req, res) => {
    try {
      const { region } = req.body;
      
      if (!region || typeof region !== 'string') {
        return res.status(400).json({ error: "Region name is required" });
      }

      let demographicsData: Partial<import("../shared/schema").RegionDemographics> = {};
      let useGeminiFallback = false;

      // Try to get official data from e-Stat first (if API key is configured)
      if (process.env.ESTAT_API_KEY) {
        try {
          const { getEStatClient } = await import("./services/eStatClient");
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
          
          const createAISource = (citations?: string[]): import("../shared/schema").RegionMetricSource => ({
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
          const { enrichWithGemini } = await import("./services/geminiEnrichment");
          demographicsData = await enrichWithGemini(region, demographicsData);
          console.log(`✓ Gemini enrichment applied for ${region}`);
        } catch (enrichError) {
          console.warn("Gemini enrichment failed:", enrichError);
        }
      }
      
      res.json(demographicsData);
    } catch (error: any) {
      console.error("Region info error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch region information" });
    }
  });

  // Auth signup endpoint using service role to bypass RLS
  const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    organizationName: z.string().min(1),
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, organizationName } = signupSchema.parse(req.body);

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || "Failed to create user" });
      }

      // Create organization in local database using Drizzle
      const orgResult = await db.insert(organizations).values({ name: organizationName }).returning();
      
      if (!orgResult || orgResult.length === 0) {
        // Cleanup: delete the created user if org creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: "Failed to create organization" });
      }
      
      const org = orgResult[0];

      // Link user to organization with admin role
      try {
        await db.insert(userOrganizations).values({
          userId: authData.user.id,
          organizationId: org.id,
          role: "admin",
        });
      } catch (memberError: any) {
        // Cleanup: delete org and user if membership creation fails
        await db.delete(organizations).where(eq(organizations.id, org.id));
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: memberError.message });
      }

      // Set organizationId in user's app_metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authData.user.id,
        {
          app_metadata: {
            organizationId: org.id,
          },
        }
      );

      if (updateError) {
        console.error("Failed to update user metadata:", updateError);
        // Don't fail the signup, but log the error
      }

      res.status(201).json({
        user: authData.user,
        organization: org,
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });

  // Get current user info
  app.get("/api/user/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(req.userId!);
      
      // Get organization details
      const org = await db.select()
        .from(organizations)
        .where(eq(organizations.id, req.organizationId!))
        .limit(1);
      
      res.json({
        userId: req.userId,
        email: userData?.user?.email || null,
        organizationId: req.organizationId,
        organizationName: org[0]?.name || null,
        role: req.userRole,
        isSuperAdmin: req.isSuperAdmin,
      });
    } catch (error: any) {
      console.error("Get user info error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Super Admin Only: Organization Management
  app.get("/api/admin/organizations", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const allOrgs = await db.select().from(organizations);
      
      // Get user count for each organization
      const orgsWithUserCount = await Promise.all(
        allOrgs.map(async (org) => {
          const users = await db.select()
            .from(userOrganizations)
            .where(eq(userOrganizations.organizationId, org.id));
          
          // Get user email from first user
          let userEmail = null;
          if (users.length > 0) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(users[0].userId);
            userEmail = userData?.user?.email || null;
          }
          
          return {
            ...org,
            userEmail,
            userId: users.length > 0 ? users[0].userId : null,
          };
        })
      );

      res.json(orgsWithUserCount);
    } catch (error: any) {
      console.error("Get all organizations error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/organizations", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const createOrgSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      });

      const { name, email, password } = createOrgSchema.parse(req.body);

      // Create user with Supabase Auth
      console.log(`[Create Org] Creating user with email: ${email}, password length: ${password.length}`);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          created_by_admin: true,
        },
      });

      if (authError || !authData.user) {
        console.error(`[Create Org] Failed to create user:`, authError);
        return res.status(400).json({ error: authError?.message || "Failed to create user" });
      }

      console.log(`[Create Org] User created successfully: ${authData.user.id}, email confirmed: ${authData.user.email_confirmed_at ? 'yes' : 'no'}`);

      // Create organization
      const orgResult = await db.insert(organizations).values({ name }).returning();
      const org = orgResult[0];

      // Link user to organization as admin
      try {
        await db.insert(userOrganizations).values({
          userId: authData.user.id,
          organizationId: org.id,
          role: "admin",
          isSuperAdmin: "false",
        });

        res.status(201).json({
          ...org,
          userEmail: email,
          userId: authData.user.id,
        });
      } catch (memberError: any) {
        // Cleanup: delete organization and user if linking fails
        await db.delete(organizations).where(eq(organizations.id, org.id));
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: memberError.message });
      }
    } catch (error: any) {
      console.error("Create organization error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/organizations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const updateSchema = z.object({
        name: z.string().min(1),
      });

      const { name } = updateSchema.parse(req.body);

      const orgResult = await db.update(organizations)
        .set({ name })
        .where(eq(organizations.id, req.params.id))
        .returning();

      if (!orgResult || orgResult.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(orgResult[0]);
    } catch (error: any) {
      console.error("Update organization error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/organizations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      // Prevent deleting super admin's own organization
      if (req.organizationId === req.params.id) {
        return res.status(400).json({ error: "Cannot delete your own organization" });
      }

      // Get all users in this organization
      const users = await db.select()
        .from(userOrganizations)
        .where(eq(userOrganizations.organizationId, req.params.id));

      // Delete all users from Supabase Auth
      for (const user of users) {
        await supabaseAdmin.auth.admin.deleteUser(user.userId);
      }

      // Delete organization (cascade will delete user_organizations and all related data)
      await db.delete(organizations).where(eq(organizations.id, req.params.id));

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete organization error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Super Admin: Organization Member Management
  app.get("/api/admin/organizations/:id/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const members = await db.select()
        .from(userOrganizations)
        .where(eq(userOrganizations.organizationId, req.params.id));

      const membersWithEmail = await Promise.all(
        members.map(async (member) => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.userId);
          return {
            userId: member.userId,
            email: userData?.user?.email || null,
            role: member.role,
            isSuperAdmin: member.isSuperAdmin === "true",
            createdAt: member.createdAt,
          };
        })
      );

      res.json(membersWithEmail);
    } catch (error: any) {
      console.error("Get organization members error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/organizations/:id/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const createMemberSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "member"]).default("member"),
      });

      const { email, password, role } = createMemberSchema.parse(req.body);

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          created_by_admin: true,
        },
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || "Failed to create user" });
      }

      // Link user to organization
      await db.insert(userOrganizations).values({
        userId: authData.user.id,
        organizationId: req.params.id,
        role,
        isSuperAdmin: "false",
      });

      res.status(201).json({
        userId: authData.user.id,
        email,
        role,
        isSuperAdmin: false,
      });
    } catch (error: any) {
      console.error("Create organization member error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/organizations/:id/members/:userId", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const updateMemberSchema = z.object({
        role: z.enum(["admin", "member"]),
      });

      const { role } = updateMemberSchema.parse(req.body);

      const result = await db.update(userOrganizations)
        .set({ role })
        .where(
          eq(userOrganizations.userId, req.params.userId)
        )
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(req.params.userId);

      res.json({
        userId: req.params.userId,
        email: userData?.user?.email || null,
        role,
        isSuperAdmin: result[0].isSuperAdmin === "true",
      });
    } catch (error: any) {
      console.error("Update organization member error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/organizations/:id/members/:userId", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      // Prevent deleting super admin
      const member = await db.select()
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, req.params.userId))
        .limit(1);

      if (member.length > 0 && member[0].isSuperAdmin === "true") {
        return res.status(400).json({ error: "Cannot delete super admin" });
      }

      // Delete from Supabase Auth
      await supabaseAdmin.auth.admin.deleteUser(req.params.userId);

      // Delete from user_organizations (should cascade from Supabase, but ensure cleanup)
      await db.delete(userOrganizations)
        .where(eq(userOrganizations.userId, req.params.userId));

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete organization member error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get API usage statistics for an organization
  app.get("/api/admin/organizations/:id/api-usage", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      // Verify the requested organization ID matches a valid organization
      const requestedOrgId = req.params.id;
      const orgExists = await db.select()
        .from(organizations)
        .where(eq(organizations.id, requestedOrgId))
        .limit(1);

      if (!orgExists || orgExists.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const organizationId = requestedOrgId;

      // Get usage logs from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { apiUsageLogs } = await import("@shared/schema");
      const { gte } = await import("drizzle-orm");
      
      const logs = await db.select()
        .from(apiUsageLogs)
        .where(
          and(
            eq(apiUsageLogs.organizationId, organizationId),
            gte(apiUsageLogs.timestamp, thirtyDaysAgo)
          )
        )
        .orderBy(apiUsageLogs.timestamp);

      // Calculate statistics and estimated costs
      let placesCallCount = 0;
      let geminiCallCount = 0;

      logs.forEach(log => {
        if (log.apiType === 'google_places') {
          placesCallCount++;
        } else if (log.apiType === 'google_gemini') {
          const metadata = log.metadata as any;
          geminiCallCount += metadata?.callCount || 1;
        }
      });

      // Cost estimation (in JPY)
      // Google Places API: ~¥40 per 1000 requests
      // Gemini API: ~¥0.5 per request (estimated)
      const placesEstimatedCost = (placesCallCount / 1000) * 40;
      const geminiEstimatedCost = geminiCallCount * 0.5;
      const totalEstimatedCost = placesEstimatedCost + geminiEstimatedCost;

      res.json({
        organizationId,
        period: {
          start: thirtyDaysAgo.toISOString(),
          end: new Date().toISOString(),
        },
        usage: {
          googlePlaces: {
            callCount: placesCallCount,
            estimatedCost: Math.round(placesEstimatedCost),
          },
          googleGemini: {
            callCount: geminiCallCount,
            estimatedCost: Math.round(geminiEstimatedCost),
          },
          total: {
            estimatedCost: Math.round(totalEstimatedCost),
          },
        },
      });
    } catch (error: any) {
      console.error("Get API usage error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Region Analysis - Analyze demographics for a selected prefecture/municipality
  app.post("/api/ai-region-analysis", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { prefecture, municipality } = req.body;
      
      if (!prefecture) {
        return res.status(400).json({ error: "都道府県を選択してください" });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: geminiApiKey });

      const region = municipality ? `${prefecture}${municipality}` : prefecture;
      
      const prompt = `あなたは日本の地域統計の専門家です。以下の地域について、最新のデータに基づいた人口統計分析を行ってください。

地域: ${region}

以下の情報をJSON形式で返してください：
{
  "region": "地域名",
  "population": 人口（数値のみ）,
  "averageAge": 平均年齢（数値のみ、小数点1桁）,
  "averageIncome": 平均年収（万円単位、数値のみ）,
  "over60Ratio": 60歳以上の人口比率（パーセント、数値のみ、小数点1桁）,
  "maleRatio": 男性比率（パーセント、数値のみ、小数点1桁）,
  "analysis": "この地域の特徴や買取催事に適した理由などの分析（200文字程度）",
  "buybackPotential": "高" | "中" | "低",
  "buybackPotentialReason": "買取催事ポテンシャルの理由（100文字程度）",
  "dataSource": "データの出典（例：総務省統計局、国勢調査等）",
  "dataYear": "データの基準年（例：2020年）"
}

注意事項：
- 実際の統計データに基づいて回答してください
- 数値は現実的な範囲で正確に
- 買取催事のポテンシャルは高齢者比率や人口密度を考慮してください
- JSONのみを返してください（説明文は不要）`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Failed to parse Gemini response");
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Log API usage
      const { apiUsageLogs } = await import("@shared/schema");
      await db.insert(apiUsageLogs).values({
        organizationId: req.organizationId!,
        apiType: "google_gemini",
        endpoint: "/api/ai-region-analysis",
        timestamp: new Date(),
        metadata: JSON.stringify({ model: "gemini-2.0-flash-001", region }),
      });

      res.json({
        success: true,
        data: analysisData,
      });
    } catch (error: any) {
      console.error("AI Region Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get municipalities for a prefecture
  app.get("/api/municipalities/:prefecture", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { prefecture } = req.params;
      
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: geminiApiKey });

      const prompt = `${prefecture}の主要な市区町村を20個までリストアップしてください。
JSON配列形式で市区町村名のみを返してください。例：["横浜市", "川崎市", "相模原市"]
県庁所在地を最初に、次に人口の多い順で並べてください。
JSONのみを返してください。`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error("Failed to parse municipalities");
      }

      const municipalities = JSON.parse(jsonMatch[0]);

      res.json({ municipalities });
    } catch (error: any) {
      console.error("Get municipalities error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
