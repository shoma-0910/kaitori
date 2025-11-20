import {
  type Store,
  type InsertStore,
  type Event,
  type InsertEvent,
  type Cost,
  type InsertCost,
  type RegisteredStore,
  type InsertRegisteredStore,
  type ApiUsageLog,
  type InsertApiUsageLog,
  stores,
  events,
  costs,
  registeredStores,
  apiUsageLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Stores
  getAllStores(organizationId: string): Promise<Store[]>;
  getStore(id: string, organizationId: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, organizationId: string, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: string, organizationId: string): Promise<boolean>;

  // Events
  getAllEvents(organizationId: string): Promise<Event[]>;
  getEvent(id: string, organizationId: string): Promise<Event | undefined>;
  getEventsByStore(storeId: string, organizationId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, organizationId: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string, organizationId: string): Promise<boolean>;

  // Costs
  getCostsByEvent(eventId: string, organizationId: string): Promise<Cost[]>;
  createCost(cost: InsertCost): Promise<Cost>;
  deleteCost(id: string, organizationId: string): Promise<boolean>;

  // Registered Stores
  getAllRegisteredStores(organizationId: string): Promise<RegisteredStore[]>;
  getRegisteredStore(id: string, organizationId: string): Promise<RegisteredStore | undefined>;
  getRegisteredStoreByPlaceId(placeId: string, organizationId: string): Promise<RegisteredStore | undefined>;
  createRegisteredStore(store: InsertRegisteredStore): Promise<RegisteredStore>;
  deleteRegisteredStore(id: string, organizationId: string): Promise<boolean>;

  // API Usage Logs
  createApiUsageLog(log: InsertApiUsageLog): Promise<ApiUsageLog>;
  getApiUsageLogs(organizationId: string, startDate?: Date, endDate?: Date): Promise<ApiUsageLog[]>;
}

export class DbStorage implements IStorage {
  // Stores
  async getAllStores(organizationId: string): Promise<Store[]> {
    return await db.select().from(stores)
      .where(eq(stores.organizationId, organizationId))
      .orderBy(desc(stores.potentialScore));
  }

  async getStore(id: string, organizationId: string): Promise<Store | undefined> {
    const result = await db.select().from(stores)
      .where(and(eq(stores.id, id), eq(stores.organizationId, organizationId)));
    return result[0];
  }

  async createStore(store: InsertStore): Promise<Store> {
    const result = await db.insert(stores).values(store).returning();
    return result[0];
  }

  async updateStore(id: string, organizationId: string, store: Partial<InsertStore>): Promise<Store | undefined> {
    const result = await db.update(stores).set(store)
      .where(and(eq(stores.id, id), eq(stores.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async deleteStore(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(stores)
      .where(and(eq(stores.id, id), eq(stores.organizationId, organizationId)));
    return result.rowCount! > 0;
  }

  // Events
  async getAllEvents(organizationId: string): Promise<Event[]> {
    return await db.select().from(events)
      .where(eq(events.organizationId, organizationId))
      .orderBy(desc(events.startDate));
  }

  async getEvent(id: string, organizationId: string): Promise<Event | undefined> {
    const result = await db.select().from(events)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)));
    return result[0];
  }

  async getEventsByStore(storeId: string, organizationId: string): Promise<Event[]> {
    return await db.select().from(events)
      .where(and(eq(events.storeId, storeId), eq(events.organizationId, organizationId)));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, organizationId: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set(event)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async deleteEvent(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(events)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)));
    return result.rowCount! > 0;
  }

  // Costs
  async getCostsByEvent(eventId: string, organizationId: string): Promise<Cost[]> {
    return await db.select().from(costs)
      .where(and(eq(costs.eventId, eventId), eq(costs.organizationId, organizationId)));
  }

  async createCost(cost: InsertCost): Promise<Cost> {
    const result = await db.insert(costs).values(cost).returning();
    return result[0];
  }

  async deleteCost(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(costs)
      .where(and(eq(costs.id, id), eq(costs.organizationId, organizationId)));
    return result.rowCount! > 0;
  }

  // Registered Stores
  async getAllRegisteredStores(organizationId: string): Promise<RegisteredStore[]> {
    return await db.select().from(registeredStores)
      .where(eq(registeredStores.organizationId, organizationId))
      .orderBy(desc(registeredStores.registeredAt));
  }

  async getRegisteredStore(id: string, organizationId: string): Promise<RegisteredStore | undefined> {
    const result = await db.select().from(registeredStores)
      .where(and(eq(registeredStores.id, id), eq(registeredStores.organizationId, organizationId)));
    return result[0];
  }

  async getRegisteredStoreByPlaceId(placeId: string, organizationId: string): Promise<RegisteredStore | undefined> {
    const result = await db.select().from(registeredStores)
      .where(and(eq(registeredStores.placeId, placeId), eq(registeredStores.organizationId, organizationId)));
    return result[0];
  }

  async createRegisteredStore(store: InsertRegisteredStore): Promise<RegisteredStore> {
    const result = await db.insert(registeredStores).values(store).returning();
    return result[0];
  }

  async deleteRegisteredStore(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(registeredStores)
      .where(and(eq(registeredStores.id, id), eq(registeredStores.organizationId, organizationId)));
    return result.rowCount! > 0;
  }

  // API Usage Logs
  async createApiUsageLog(log: InsertApiUsageLog): Promise<ApiUsageLog> {
    const result = await db.insert(apiUsageLogs).values(log).returning();
    return result[0];
  }

  async getApiUsageLogs(organizationId: string, startDate?: Date, endDate?: Date): Promise<ApiUsageLog[]> {
    if (startDate && endDate) {
      return await db.select().from(apiUsageLogs)
        .where(
          and(
            eq(apiUsageLogs.organizationId, organizationId),
            gte(apiUsageLogs.timestamp, startDate),
            lte(apiUsageLogs.timestamp, endDate)
          )
        )
        .orderBy(desc(apiUsageLogs.timestamp));
    }
    
    return await db.select().from(apiUsageLogs)
      .where(eq(apiUsageLogs.organizationId, organizationId))
      .orderBy(desc(apiUsageLogs.timestamp));
  }
}

export const storage = new DbStorage();
