import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import StoreSelection from "@/pages/StoreSelection";
import RegisteredStores from "@/pages/RegisteredStores";
import CalendarSchedule from "@/pages/CalendarSchedule";
import SalesAnalytics from "@/pages/SalesAnalytics";
import OrganizationSettings from "@/pages/OrganizationSettings";
import Map from "@/pages/Map";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/not-found";

function HamburgerButton() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="relative"
      data-testid="button-sidebar-toggle"
      aria-label="サイドバーを開閉"
      aria-expanded={open}
    >
      <div className="hamburger-icon">
        <span className={`hamburger-line ${open ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${open ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${open ? 'open' : ''}`}></span>
      </div>
    </Button>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/stores">
        <ProtectedRoute component={StoreSelection} />
      </Route>
      <Route path="/registered-stores">
        <ProtectedRoute component={RegisteredStores} />
      </Route>
      <Route path="/calendar">
        <ProtectedRoute component={CalendarSchedule} />
      </Route>
      <Route path="/sales">
        <ProtectedRoute component={SalesAnalytics} />
      </Route>
      <Route path="/map">
        <ProtectedRoute component={Map} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={OrganizationSettings} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function OrganizationSwitcher() {
  const { userInfo, organizations, switchOrganization } = useAuth();

  if (!userInfo || organizations.length <= 1) {
    return userInfo?.organizationName ? (
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium text-foreground" data-testid="text-organization-name">
          {userInfo.organizationName}
        </span>
      </div>
    ) : null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="hidden sm:flex gap-2 hover-elevate active-elevate-2"
          data-testid="button-organization-switcher"
        >
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium">{userInfo.organizationName}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>組織を切り替え</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org.id)}
            className="cursor-pointer"
            data-testid={`menuitem-org-${org.id}`}
          >
            <div className="flex items-center gap-2 w-full">
              <div className={`w-2 h-2 rounded-full ${org.id === userInfo.organizationId ? 'bg-green-500' : 'bg-muted'}`}></div>
              <span className="flex-1">{org.name}</span>
              {org.id === userInfo.organizationId && (
                <Check className="w-4 h-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppContent() {
  const { user, userInfo, loading } = useAuth();
  const [location] = useLocation();
  const isMapPage = location === "/map";
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  // Show router immediately for unauthenticated users (prevents layout shift on /auth)
  if (!user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={false}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <HamburgerButton />
            <div className="flex items-center gap-4 flex-1 justify-end">
              <OrganizationSwitcher />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className={`flex-1 overflow-auto ${isMapPage ? '' : 'p-4 md:p-8'}`}>
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
