import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../lib/supabase";

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
  userRole?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from("user_organizations")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (orgError || !userOrg) {
      return res.status(403).json({ error: "No organization found" });
    }

    req.userId = user.id;
    req.organizationId = userOrg.organization_id;
    req.userRole = userOrg.role;

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
