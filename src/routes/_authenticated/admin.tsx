import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { amIAdmin } from "@/lib/admin.functions";

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
  { to: "/admin", label: "Orders", exact: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/packages", label: "Packages" },
  { to: "/admin/content", label: "Content" },
] as const;

function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm border-b border-white/5 pb-3 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact }}
            activeProps={{ className: "font-semibold text-foreground border-b-2 border-primary pb-3 -mb-3" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
          >
            {t.label}
          </Link>
        ))}
        <div className="flex-1" />
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-xs">
          ← Client view
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
