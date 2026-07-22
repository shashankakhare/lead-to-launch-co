import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAllOrders } from "@/lib/admin.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin · All orders" }] }),
  component: AdminOrders,
});

function AdminOrders() {
  const fn = useServerFn(listAllOrders);
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => fn() });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All orders</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="grid gap-3">
        {data?.map((o) => {
          const pkg = PACKAGES[o.package as keyof typeof PACKAGES];
          return (
            <Link key={o.id} to="/admin/orders/$id" params={{ id: o.id }}>
              <Card className="p-4 flex items-center justify-between hover:border-primary/40 transition">
                <div>
                  <div className="font-medium">
                    {pkg?.name ?? o.package} — {o.profile?.email ?? o.profile?.full_name ?? o.user_id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">${Number(o.amount_usd).toFixed(0)}</div>
                  <Badge variant="secondary">{o.status}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
