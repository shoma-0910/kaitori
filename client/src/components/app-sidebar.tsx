import { LayoutDashboard, Store, BookmarkCheck, Calendar, DollarSign, Database, Bot } from "lucide-react";
import { Link, useLocation } from "wouter";
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
  },
  {
    title: "店舗選定・予約",
    url: "/stores",
    icon: Store,
  },
  {
    title: "登録店舗",
    url: "/registered-stores",
    icon: BookmarkCheck,
  },
  {
    title: "カレンダー・スケジュール",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "コスト管理",
    url: "/costs",
    icon: DollarSign,
  },
  {
    title: "店舗データ",
    url: "/data",
    icon: Database,
  },
  {
    title: "AIクローリング",
    url: "/ai-crawling",
    icon: Bot,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-4 py-6">
            買取催事管理システム
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
