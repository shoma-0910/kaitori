import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../lib/supabase";
import { db } from "../db";
import { userOrganizations } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
  userRole?: string;
  isSuperAdmin?: boolean;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[Auth] No authorization header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log("[Auth] Invalid token:", error?.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log("[Auth] User authenticated:", user.email, "User ID:", user.id);

    // Check if user wants to use a specific organization
    const requestedOrgId = req.headers['x-organization-id'] as string;
    
    // Get all organizations the user belongs to
    const userOrgResults = await db.select({
      organizationId: userOrganizations.organizationId,
      role: userOrganizations.role,
      isSuperAdmin: userOrganizations.isSuperAdmin,
    })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, user.id));

    if (!userOrgResults || userOrgResults.length === 0) {
      console.log("[Auth] No organization found for user:", user.email);
      return res.status(403).json({ error: "No organization found" });
    }

    // Find the requested organization or use the first one
    let userOrg = userOrgResults[0];
    
    if (requestedOrgId) {
      const requestedOrg = userOrgResults.find(
        org => org.organizationId === requestedOrgId
      );
      
      if (requestedOrg) {
        userOrg = requestedOrg;
        console.log("[Auth] Using requested organization:", requestedOrgId);
      } else {
        console.log("[Auth] Requested organization not found, using default:", userOrg.organizationId);
      }
    }
    
    console.log("[Auth] Organization found:", userOrg.organizationId, "Role:", userOrg.role, "SuperAdmin:", userOrg.isSuperAdmin);

    req.userId = user.id;
    req.organizationId = userOrg.organizationId;
    req.userRole = userOrg.role;
    req.isSuperAdmin = userOrg.isSuperAdmin === "true";

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
