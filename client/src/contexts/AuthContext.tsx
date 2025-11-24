import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

interface UserInfo {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
  isSuperAdmin: boolean;
}

interface Organization {
  id: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userInfo: UserInfo | null;
  organizations: Organization[];
  selectedOrganizationId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (token: string) => {
    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
      };
      
      const storedOrgId = localStorage.getItem("selectedOrganizationId");
      if (storedOrgId) {
        headers["X-Organization-Id"] = storedOrgId;
      }

      const [userInfoResponse, orgsResponse] = await Promise.all([
        fetch("/api/user/me", { headers }),
        fetch("/api/user/organizations", { headers }),
      ]);

      if (userInfoResponse.ok && orgsResponse.ok) {
        const userInfoData = await userInfoResponse.json();
        const orgsData = await orgsResponse.json();
        
        setUserInfo(userInfoData);
        setOrganizations(orgsData);
        
        const currentOrgId = storedOrgId && orgsData.some((org: Organization) => org.id === storedOrgId)
          ? storedOrgId
          : userInfoData.organizationId;
        
        setSelectedOrganizationId(currentOrgId);
        localStorage.setItem("selectedOrganizationId", currentOrgId);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.access_token);
      }
      
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.access_token);
      } else {
        setUserInfo(null);
        setOrganizations([]);
        setSelectedOrganizationId(null);
        localStorage.removeItem("selectedOrganizationId");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchOrganization = async (organizationId: string) => {
    if (!session) return;
    
    localStorage.setItem("selectedOrganizationId", organizationId);
    setSelectedOrganizationId(organizationId);
    
    queryClient.clear();
    
    await fetchUserData(session.access_token);
    
    window.location.reload();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserInfo(null);
    setOrganizations([]);
    setSelectedOrganizationId(null);
    localStorage.removeItem("selectedOrganizationId");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userInfo, 
      organizations,
      selectedOrganizationId,
      loading, 
      signOut,
      switchOrganization,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
