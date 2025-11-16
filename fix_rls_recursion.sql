-- Fix infinite recursion in user_organizations RLS policy
-- Run this in your Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage organization memberships" ON user_organizations;

-- The remaining SELECT policy is sufficient for now
-- Future: Add specific INSERT/UPDATE/DELETE policies when implementing team management features
