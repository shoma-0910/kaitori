import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import StoreSelection from "@/pages/StoreSelection";
import RegisteredStores from "@/pages/RegisteredStores";
import CalendarSchedule from "@/pages/CalendarSchedule";
import StoreDataPage from "@/pages/StoreData";
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
      <Route path="/data">
        <ProtectedRoute component={StoreDataPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (!user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={false}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <HamburgerButton />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8 md:p-8 p-4">
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
