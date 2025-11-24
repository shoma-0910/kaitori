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

    const userOrgResult = await db.select({
      organizationId: userOrganizations.organizationId,
      role: userOrganizations.role,
      isSuperAdmin: userOrganizations.isSuperAdmin,
    })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, user.id))
      .limit(1);

    if (!userOrgResult || userOrgResult.length === 0) {
      console.log("[Auth] No organization found for user:", user.email);
      return res.status(403).json({ error: "No organization found" });
    }

    const userOrg = userOrgResult[0];
    
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
