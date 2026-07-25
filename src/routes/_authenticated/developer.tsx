import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { amIDeveloper } from "@/lib/developer.functions";
import { amIAdmin } from "@/lib/admin.functions";
import { LayoutDashboard, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({ meta: [{ title: "Developer · Building Website Now" }] }),
  beforeLoad: async () => {
    try {
      const [dev, admin] = await Promise.all([amIDeveloper(), amIAdmin()]);
      if (!dev.isDeveloper && !admin.isAdmin) throw redirect({ to: "/dashboard" });
    } catch {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: DeveloperLayout,
});

const tabs = [
  { to: "/developer", label: "My projects", icon: LayoutDashboard, exact: true },
  { to: "/developer/projects", label: "All assigned", icon: FolderKanban },
] as const;

function DeveloperLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 text-sm border-b border-white/5 pb-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to as any}
            activeOptions={{ exact: !!(t as any).exact }}
            activeProps={{ className: "bg-primary/10 text-foreground border-primary/40" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent" }}
            className="flex items-center gap-2 px-3 py-2 rounded-md border transition whitespace-nowrap"
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
