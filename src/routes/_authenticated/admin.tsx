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

function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm">
        <Link to="/admin" className="font-medium">All orders</Link>
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Client view</Link>
      </div>
      <Outlet />
    </div>
  );
}
