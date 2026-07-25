import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, MessagesSquare, FolderDown, Receipt, Star, Settings, ShieldCheck, Plus, Code2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const nav = [
  { title: "Home", to: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", to: "/projects", icon: FolderKanban },
  { title: "Messages", to: "/messages", icon: MessagesSquare },
  { title: "Files", to: "/files", icon: FolderDown },
  { title: "Billing", to: "/billing", icon: Receipt },
  { title: "Reviews", to: "/reviews", icon: Star },
  { title: "Settings", to: "/settings", icon: Settings },
] as const;

export function AppSidebar({ isAdmin, isDeveloper }: { isAdmin?: boolean; isDeveloper?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 grid place-items-center text-primary-foreground font-bold text-sm">
            B
          </div>
          <span className="font-semibold tracking-tight text-sm">BuildingWebsiteNow</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active =
                  item.to === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/admin")}>
                    <Link to="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isDeveloper && (
          <SidebarGroup>
            <SidebarGroupLabel>Developer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/developer")}>
                    <Link to="/developer" className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      <span>Developer workspace</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button asChild size="sm" className="w-full">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New site
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
