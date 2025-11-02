import {
  type Store,
  type InsertStore,
  type Event,
  type InsertEvent,
  type Cost,
  type InsertCost,
  stores,
  events,
  costs,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Stores
  getAllStores(): Promise<Store[]>;
  getStore(id: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: string): Promise<boolean>;

  // Events
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByStore(storeId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Costs
  getCostsByEvent(eventId: string): Promise<Cost[]>;
  createCost(cost: InsertCost): Promise<Cost>;
  deleteCost(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  // Stores
  async getAllStores(): Promise<Store[]> {
    return await db.select().from(stores).orderBy(desc(stores.potentialScore));
  }

  async getStore(id: string): Promise<Store | undefined> {
    const result = await db.select().from(stores).where(eq(stores.id, id));
    return result[0];
  }

  async createStore(store: InsertStore): Promise<Store> {
    const result = await db.insert(stores).values(store).returning();
    return result[0];
  }

  async updateStore(id: string, store: Partial<InsertStore>): Promise<Store | undefined> {
    const result = await db.update(stores).set(store).where(eq(stores.id, id)).returning();
    return result[0];
  }

  async deleteStore(id: string): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.id, id));
    return result.rowCount! > 0;
  }

  // Events
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.startDate));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getEventsByStore(storeId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.storeId, storeId));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount! > 0;
  }

  // Costs
  async getCostsByEvent(eventId: string): Promise<Cost[]> {
    return await db.select().from(costs).where(eq(costs.eventId, eventId));
  }

  async createCost(cost: InsertCost): Promise<Cost> {
    const result = await db.insert(costs).values(cost).returning();
    return result[0];
  }

  async deleteCost(id: string): Promise<boolean> {
    const result = await db.delete(costs).where(eq(costs.id, id));
    return result.rowCount! > 0;
  }
}

export const storage = new DbStorage();
