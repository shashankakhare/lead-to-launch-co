import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { amIAdmin } from "@/lib/admin.functions";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Users2,
  Code2,
  Package,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Building Website Now" }] }),
  beforeLoad: async () => {
    try {
      const res = await amIAdmin();
      if (!res.isAdmin) throw redirect({ to: "/dashboard" });
    } catch {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/developers", label: "Developers", icon: Code2 },
  { to: "/admin/users", label: "Users", icon: Users2 },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/content", label: "Content", icon: FileText },
] as const;

function AdminLayout() {
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
        <div className="flex-1" />
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-xs px-2">
          ← Client view
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
