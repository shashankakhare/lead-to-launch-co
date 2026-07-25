import { createFileRoute, Outlet, redirect, useRouter, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { amIAdmin } from "@/lib/admin.functions";
import { amIDeveloper } from "@/lib/developer.functions";
import { listMyNotifications, markAllRead, markNotificationRead } from "@/lib/notifications.functions";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const adminFn = useServerFn(amIAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => adminFn(),
    enabled: Boolean(user),
  });
  const devFn = useServerFn(amIDeveloper);
  const { data: devData } = useQuery({
    queryKey: ["am-i-developer"],
    queryFn: () => devFn(),
    enabled: Boolean(user),
  });

  const notifFn = useServerFn(listMyNotifications);
  const { data: notifs, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notifFn(),
    enabled: Boolean(user),
  });
  const markAll = useServerFn(markAllRead);
  const markOne = useServerFn(markNotificationRead);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifs-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const unread = (notifs ?? []).filter((n) => !n.read_at).length;

  async function signOut() {
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar isAdmin={adminData?.isAdmin} />
        <SidebarInset>
          <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 sm:px-6 h-14">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger />
                <span className="hidden sm:inline text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {unread > 0 && (
                        <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center">
                          {unread}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between border-b p-3">
                      <div className="text-sm font-medium">Notifications</div>
                      {unread > 0 && (
                        <button
                          onClick={async () => {
                            await markAll();
                            refetch();
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {(!notifs || notifs.length === 0) && (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          You're all caught up.
                        </div>
                      )}
                      {notifs?.map((n) => (
                        <button
                          key={n.id}
                          onClick={async () => {
                            if (!n.read_at) {
                              await markOne({ data: { id: n.id } });
                              refetch();
                            }
                            if (n.link) navigate({ to: n.link });
                          }}
                          className={`w-full text-left px-3 py-2 border-b last:border-0 hover:bg-muted/40 ${
                            !n.read_at ? "bg-muted/20" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read_at && (
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{n.title}</div>
                              {n.body && (
                                <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                              )}
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {adminData?.isAdmin && (
                  <Badge variant="secondary" className="mr-1">Admin</Badge>
                )}
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
