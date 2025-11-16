import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStoreSchema, insertEventSchema, insertCostSchema, insertRegisteredStoreSchema, organizations, userOrganizations } from "@shared/schema";
import { createCalendarEvent } from "./google-calendar";
import { supabaseAdmin } from "../lib/supabase";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "./middleware/auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

  // Region Info
  app.post("/api/region-info", async (req, res) => {
    try {
      const { region } = req.body;
      
      if (!region || typeof region !== 'string') {
        return res.status(400).json({ error: "Region name is required" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const prompt = `日本の${region}について、以下の統計情報をJSON形式で提供してください。最新の公開データに基づいて回答してください。

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
  "foreignerRatio": 数値
}

注意: JSON以外のテキストは一切含めず、JSONのみを返してください。`;

      const result = await client.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });
      const text = result.text || "";
      
      // Extract JSON from response
      let jsonText = text.trim();
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '');
      jsonText = jsonText.trim();
      
      const data = JSON.parse(jsonText);
      
      res.json(data);
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

  // Organization management endpoints
  app.get("/api/organization", requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgResult = await db.select()
        .from(organizations)
        .where(eq(organizations.id, req.organizationId!))
        .limit(1);

      if (!orgResult || orgResult.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(orgResult[0]);
    } catch (error: any) {
      console.error("Get organization error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/organization", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Only admins can update organization
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Only admins can update organization" });
      }

      const updateSchema = z.object({
        name: z.string().min(1),
      });

      const { name } = updateSchema.parse(req.body);

      const orgResult = await db.update(organizations)
        .set({ name })
        .where(eq(organizations.id, req.organizationId!))
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

  app.get("/api/organization/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Only admins can view members
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Only admins can view members" });
      }

      const members = await db.select()
        .from(userOrganizations)
        .where(eq(userOrganizations.organizationId, req.organizationId!));

      // Fetch user details from Supabase Auth
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.userId);
          return {
            id: member.id,
            userId: member.userId,
            email: userData?.user?.email || "Unknown",
            role: member.role,
            createdAt: member.createdAt,
          };
        })
      );

      res.json(membersWithDetails);
    } catch (error: any) {
      console.error("Get members error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/organization/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Only admins can add members
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Only admins can add members" });
      }

      const addMemberSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "member"]),
      });

      const { email, password, role } = addMemberSchema.parse(req.body);

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || "Failed to create user" });
      }

      // Link user to organization
      try {
        const memberResult = await db.insert(userOrganizations).values({
          userId: authData.user.id,
          organizationId: req.organizationId!,
          role,
        }).returning();

        res.status(201).json({
          id: memberResult[0].id,
          userId: authData.user.id,
          email: authData.user.email,
          role: memberResult[0].role,
          createdAt: memberResult[0].createdAt,
        });
      } catch (memberError: any) {
        // Cleanup: delete the created user if membership creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: memberError.message });
      }
    } catch (error: any) {
      console.error("Add member error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/organization/members/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Only admins can update member roles
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Only admins can update member roles" });
      }

      const updateMemberSchema = z.object({
        role: z.enum(["admin", "member"]),
      });

      const { role } = updateMemberSchema.parse(req.body);

      const memberResult = await db.update(userOrganizations)
        .set({ role })
        .where(eq(userOrganizations.id, req.params.id))
        .returning();

      if (!memberResult || memberResult.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Fetch user details
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(memberResult[0].userId);

      res.json({
        id: memberResult[0].id,
        userId: memberResult[0].userId,
        email: userData?.user?.email || "Unknown",
        role: memberResult[0].role,
        createdAt: memberResult[0].createdAt,
      });
    } catch (error: any) {
      console.error("Update member error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/organization/members/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Only admins can delete members
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Only admins can delete members" });
      }

      // Get member info before deleting
      const memberResult = await db.select()
        .from(userOrganizations)
        .where(eq(userOrganizations.id, req.params.id))
        .limit(1);

      if (!memberResult || memberResult.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      const member = memberResult[0];

      // Don't allow deleting the last admin
      const adminCount = await db.select()
        .from(userOrganizations)
        .where(eq(userOrganizations.organizationId, req.organizationId!));
      
      const admins = adminCount.filter(m => m.role === "admin");
      if (admins.length === 1 && member.role === "admin") {
        return res.status(400).json({ error: "Cannot delete the last admin" });
      }

      // Delete from user_organizations
      await db.delete(userOrganizations)
        .where(eq(userOrganizations.id, req.params.id));

      // Delete user from Supabase Auth
      await supabaseAdmin.auth.admin.deleteUser(member.userId);

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete member error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
