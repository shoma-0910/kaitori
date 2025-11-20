import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export const userOrganizations = pgTable("user_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  isSuperAdmin: text("is_super_admin").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({ id: true, createdAt: true });
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;
export type UserOrganization = typeof userOrganizations.$inferSelect;

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  population: integer("population").notNull(),
  averageAge: integer("average_age").notNull(),
  averageIncome: real("average_income").notNull(),
  averageRent: real("average_rent").notNull(),
  potentialScore: integer("potential_score").notNull(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true }).extend({
  population: z.coerce.number(),
  averageAge: z.coerce.number(),
  averageIncome: z.coerce.number(),
  averageRent: z.coerce.number(),
  potentialScore: z.coerce.number(),
});
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").notNull(),
  manager: text("manager").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(),
  estimatedCost: integer("estimated_cost").notNull(),
  actualProfit: integer("actual_profit"),
  googleCalendarEventId: text("google_calendar_event_id"),
  notes: text("notes"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true }).extend({
  estimatedCost: z.coerce.number(),
  actualProfit: z.coerce.number().optional().nullable(),
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const costs = pgTable("costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").notNull().references(() => events.id),
  category: text("category").notNull(),
  item: text("item").notNull(),
  amount: integer("amount").notNull(),
});

export const insertCostSchema = createInsertSchema(costs).omit({ id: true }).extend({
  amount: z.coerce.number(),
});
export type InsertCost = z.infer<typeof insertCostSchema>;
export type Cost = typeof costs.$inferSelect;

export const registeredStores = pgTable("registered_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  website: text("website"),
  openingHours: text("opening_hours").array(),
  rank: text("rank"),
  demographicData: text("demographic_data"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

export const insertRegisteredStoreSchema = createInsertSchema(registeredStores).omit({ 
  id: true, 
  registeredAt: true 
}).extend({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});
export type InsertRegisteredStore = z.infer<typeof insertRegisteredStoreSchema>;
export type RegisteredStore = typeof registeredStores.$inferSelect;

// Region Demographics with citation sources
export const regionMetricSourceSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  retrievedAt: z.string(),
  type: z.enum(["official", "ai_estimated"]),
});

export type RegionMetricSource = z.infer<typeof regionMetricSourceSchema>;

export const regionDemographicsSchema = z.object({
  region: z.string(),
  averageAge: z.object({
    value: z.number(),
    source: regionMetricSourceSchema,
  }).optional(),
  ageDistribution: z.object({
    value: z.array(z.object({
      range: z.string(),
      percentage: z.number(),
    })),
    source: regionMetricSourceSchema,
  }).optional(),
  genderRatio: z.object({
    value: z.object({
      male: z.number(),
      female: z.number(),
    }),
    source: regionMetricSourceSchema,
  }).optional(),
  averageIncome: z.object({
    value: z.number(),
    source: regionMetricSourceSchema,
  }).optional(),
  foreignerRatio: z.object({
    value: z.number(),
    source: regionMetricSourceSchema,
  }).optional(),
  population: z.object({
    value: z.number(),
    source: regionMetricSourceSchema,
  }).optional(),
});

export type RegionDemographics = z.infer<typeof regionDemographicsSchema>;

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  apiType: text("api_type").notNull(),
  endpoint: text("endpoint").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: text("metadata"),
});

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({ id: true, timestamp: true });
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
