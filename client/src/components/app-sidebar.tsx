import { LayoutDashboard, Store, BookmarkCheck, Calendar, Settings, Map, TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface MenuGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    superAdminOnly: boolean;
  }>;
}

const menuGroups: MenuGroup[] = [
  {
    label: "メイン",
    icon: LayoutDashboard,
    items: [
      {
        title: "ダッシュボード",
        url: "/",
        icon: LayoutDashboard,
        superAdminOnly: false,
      },
    ],
  },
  {
    label: "店舗管理",
    icon: Store,
    items: [
      {
        title: "店舗選定・予約",
        url: "/stores",
        icon: Store,
        superAdminOnly: false,
      },
      {
        title: "登録店舗",
        url: "/registered-stores",
        icon: BookmarkCheck,
        superAdminOnly: false,
      },
      {
        title: "マップ",
        url: "/map",
        icon: Map,
        superAdminOnly: false,
      },
    ],
  },
  {
    label: "スケジュール & 分析",
    icon: Calendar,
    items: [
      {
        title: "カレンダー・スケジュール",
        url: "/calendar",
        icon: Calendar,
        superAdminOnly: false,
      },
      {
        title: "売上分析",
        url: "/sales",
        icon: TrendingUp,
        superAdminOnly: false,
      },
    ],
  },
];

const adminMenuItems = [
  {
    title: "会社管理",
    url: "/settings",
    icon: Settings,
    superAdminOnly: true,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { userInfo } = useAuth();

  const isSuperAdmin = userInfo?.isSuperAdmin || false;

  return (
    <Sidebar>
      <SidebarContent className="sidebar-elegant">
        {/* ロゴ */}
        <div className="px-4 py-6 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-pulse"></div>
            <h2 className="text-sm font-bold gradient-text">買取催事</h2>
          </div>
          <p className="text-xs text-muted-foreground">マネジメントシステム</p>
        </div>

        {/* メニューグループ */}
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-3">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className={`sidebar-menu-item transition-all duration-200 ${
                        location === item.url
                          ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary"
                          : "hover:bg-muted/50"
                      }`}
                      data-testid={`link-sidebar-${item.url === "/" ? "dashboard" : item.url.slice(1)}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg">
                        <div className={`relative ${location === item.url ? "text-primary" : "text-muted-foreground"}`}>
                          <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                          {location === item.url && (
                            <div className="absolute inset-0 w-5 h-5 bg-primary/20 rounded-full blur-sm -z-10"></div>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${location === item.url ? "font-semibold" : ""}`}>
                          {item.title}
                        </span>
                        {location === item.url && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* 管理者メニュー */}
        {isSuperAdmin && (
          <SidebarGroup className="py-3 border-t border-border/30 mt-6 pt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
              管理者
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className={`sidebar-menu-item transition-all duration-200 ${
                        location === item.url
                          ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary"
                          : "hover:bg-muted/50"
                      }`}
                      data-testid={`link-sidebar-${item.url.slice(1)}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg">
                        <div className={`relative ${location === item.url ? "text-primary" : "text-muted-foreground"}`}>
                          <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                          {location === item.url && (
                            <div className="absolute inset-0 w-5 h-5 bg-primary/20 rounded-full blur-sm -z-10"></div>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${location === item.url ? "font-semibold" : ""}`}>
                          {item.title}
                        </span>
                        {location === item.url && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
