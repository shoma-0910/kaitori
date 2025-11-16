import { LayoutDashboard, Store, BookmarkCheck, Calendar, Database, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  currentUserRole?: string;
}

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    title: "店舗選定・予約",
    url: "/stores",
    icon: Store,
    adminOnly: false,
  },
  {
    title: "登録店舗",
    url: "/registered-stores",
    icon: BookmarkCheck,
    adminOnly: false,
  },
  {
    title: "カレンダー・スケジュール",
    url: "/calendar",
    icon: Calendar,
    adminOnly: false,
  },
  {
    title: "店舗データ",
    url: "/data",
    icon: Database,
    adminOnly: false,
  },
  {
    title: "会社管理",
    url: "/settings",
    icon: Settings,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  const isAdmin = organization?.currentUserRole === "admin";

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
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
