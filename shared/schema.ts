import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  population: integer("population").notNull(),
  averageAge: integer("average_age").notNull(),
  averageIncome: real("average_income").notNull(),
  averageRent: real("average_rent").notNull(),
  potentialScore: integer("potential_score").notNull(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id),
  manager: text("manager").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(),
  estimatedCost: integer("estimated_cost").notNull(),
  actualProfit: integer("actual_profit"),
  googleCalendarEventId: text("google_calendar_event_id"),
  notes: text("notes"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const costs = pgTable("costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  category: text("category").notNull(),
  item: text("item").notNull(),
  amount: integer("amount").notNull(),
});

export const insertCostSchema = createInsertSchema(costs).omit({ id: true });
export type InsertCost = z.infer<typeof insertCostSchema>;
export type Cost = typeof costs.$inferSelect;

export const registeredStores = pgTable("registered_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  placeId: text("place_id").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  website: text("website"),
  openingHours: text("opening_hours").array(),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

export const insertRegisteredStoreSchema = createInsertSchema(registeredStores).omit({ 
  id: true, 
  registeredAt: true 
});
export type InsertRegisteredStore = z.infer<typeof insertRegisteredStoreSchema>;
export type RegisteredStore = typeof registeredStores.$inferSelect;
