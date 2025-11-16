-- Multi-tenant schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User organizations junction table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, organization_id)
);

-- Stores table (with organization_id)
CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  population INTEGER NOT NULL,
  average_age INTEGER NOT NULL,
  average_income REAL NOT NULL,
  average_rent REAL NOT NULL,
  potential_score INTEGER NOT NULL
);

-- Events table (with organization_id)
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id VARCHAR NOT NULL,
  manager TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL,
  estimated_cost INTEGER NOT NULL,
  actual_profit INTEGER,
  google_calendar_event_id TEXT,
  notes TEXT
);

-- Costs table (with organization_id)
CREATE TABLE IF NOT EXISTS costs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id VARCHAR NOT NULL REFERENCES events(id),
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL
);

-- Registered stores table (with organization_id)
CREATE TABLE IF NOT EXISTS registered_stores (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_number TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  website TEXT,
  opening_hours TEXT[],
  registered_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_organization_id ON stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_costs_organization_id ON costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_registered_stores_organization_id ON registered_stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_stores ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization ID from app_metadata
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
  SELECT organization_id 
  FROM user_organizations 
  WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is admin in their organization
CREATE OR REPLACE FUNCTION is_organization_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (SELECT get_user_organizations())
);

CREATE POLICY "Admins can update their organizations"
ON organizations FOR UPDATE
TO authenticated
USING (is_organization_admin(id))
WITH CHECK (is_organization_admin(id));

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their organization memberships"
ON user_organizations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage organization memberships"
ON user_organizations FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for stores
CREATE POLICY "Users can view their organization's stores"
ON stores FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create stores in their organization"
ON stores FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update their organization's stores"
ON stores FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()))
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can delete their organization's stores"
ON stores FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for events
CREATE POLICY "Users can view their organization's events"
ON events FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create events in their organization"
ON events FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update their organization's events"
ON events FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()))
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can delete their organization's events"
ON events FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for costs
CREATE POLICY "Users can view their organization's costs"
ON costs FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create costs in their organization"
ON costs FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update their organization's costs"
ON costs FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()))
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can delete their organization's costs"
ON costs FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for registered_stores
CREATE POLICY "Users can view their organization's registered stores"
ON registered_stores FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create registered stores in their organization"
ON registered_stores FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update their organization's registered stores"
ON registered_stores FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()))
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can delete their organization's registered stores"
ON registered_stores FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
