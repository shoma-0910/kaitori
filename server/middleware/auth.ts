import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../lib/supabase";
import { db } from "../db";
import { userOrganizations, reservationAgents } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
  userRole?: string;
  isSuperAdmin?: boolean;
}

const DEV_MODE = process.env.NODE_ENV === "development";
const USE_DEV_AUTH = process.env.USE_DEV_AUTH === "true";

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

    let userId: string | undefined;
    let userEmail: string | undefined;

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        console.log("[Auth] Invalid token:", error?.message);
        return res.status(401).json({ error: "Invalid token" });
      }

      userId = user.id;
      userEmail = user.email;
      console.log("[Auth] User authenticated:", user.email, "User ID:", user.id);
    } catch (authError: any) {
      if (DEV_MODE || USE_DEV_AUTH) {
        console.log("[Auth] Supabase connection failed, using fallback auth in dev mode");
        const userOrgResult = await db.select({
          userId: userOrganizations.userId,
          organizationId: userOrganizations.organizationId,
          role: userOrganizations.role,
          isSuperAdmin: userOrganizations.isSuperAdmin,
        })
          .from(userOrganizations)
          .limit(1);

        if (userOrgResult && userOrgResult.length > 0) {
          const userOrg = userOrgResult[0];
          req.userId = userOrg.userId;
          req.organizationId = userOrg.organizationId;
          req.userRole = userOrg.role;
          req.isSuperAdmin = userOrg.isSuperAdmin === "true";
          console.log("[Auth] Dev fallback - Using first available user:", userOrg.userId);
          return next();
        }
        return res.status(500).json({ error: "No users available for dev auth" });
      }
      throw authError;
    }

    const userOrgResult = await db.select({
      organizationId: userOrganizations.organizationId,
      role: userOrganizations.role,
      isSuperAdmin: userOrganizations.isSuperAdmin,
    })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, userId!))
      .limit(1);

    if (!userOrgResult || userOrgResult.length === 0) {
      // Check if user is a reservation agent (no organization)
      const reservationAgentResult = await db.select()
        .from(reservationAgents)
        .where(eq(reservationAgents.userId, userId!))
        .limit(1);

      if (reservationAgentResult && reservationAgentResult.length > 0) {
        console.log("[Auth] Reservation agent authenticated:", userEmail);
        req.userId = userId;
        req.organizationId = undefined;
        req.userRole = "reservation_agent";
        req.isSuperAdmin = false;
        return next();
      }

      console.log("[Auth] No organization found for user:", userEmail);
      return res.status(403).json({ error: "No organization found" });
    }

    const userOrg = userOrgResult[0];
    
    console.log("[Auth] Organization found:", userOrg.organizationId, "Role:", userOrg.role, "SuperAdmin:", userOrg.isSuperAdmin);

    req.userId = userId;
    req.organizationId = userOrg.organizationId;
    req.userRole = userOrg.role;
    req.isSuperAdmin = userOrg.isSuperAdmin === "true";

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
