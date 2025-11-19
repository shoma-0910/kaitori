import { LayoutDashboard, Store, BookmarkCheck, Calendar, Database, Settings, Map } from "lucide-react";
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

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/",
    icon: LayoutDashboard,
    superAdminOnly: false,
  },
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
    title: "カレンダー・スケジュール",
    url: "/calendar",
    icon: Calendar,
    superAdminOnly: false,
  },
  {
    title: "店舗データ",
    url: "/data",
    icon: Database,
    superAdminOnly: false,
  },
  {
    title: "マップ",
    url: "/map",
    icon: Map,
    superAdminOnly: false,
  },
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

  const visibleMenuItems = menuItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-4 py-6">
            買取催事管理システム
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-sidebar-${item.url === "/" ? "dashboard" : item.url.slice(1)}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
