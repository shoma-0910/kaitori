import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Supabase PostgreSQL 接続
// SUPABASE_DB_URL が設定されている場合は Supabase を使用
// それ以外は DATABASE_URL を使用（Replit の Neon DB など）
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string is required. Set SUPABASE_DB_URL or DATABASE_URL environment variable.");
}

// Supabase Transaction モードでは prepare: false が必要
const client = postgres(connectionString, {
  prepare: false,
  ssl: connectionString.includes('supabase') ? 'require' : undefined
});

export const db = drizzle(client, { schema });
