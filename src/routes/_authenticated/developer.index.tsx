import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyAssignedOrders } from "@/lib/developer.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/developer/")({
  head: () => ({ meta: [{ title: "My projects · Developer" }] }),
  component: DeveloperHome,
});

function DeveloperHome() {
  const fn = useServerFn(listMyAssignedOrders);
  const { data, isLoading } = useQuery({ queryKey: ["dev-orders"], queryFn: () => fn() });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const orders = data ?? [];
  const active = orders.filter((o: any) => !["delivered", "cancelled"].includes(o.status));
  const closed = orders.filter((o: any) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Assigned" value={orders.length} />
        <Stat label="Open" value={active.length} />
        <Stat label="Closed" value={closed.length} />
      </div>

      <Section title="Open projects" orders={active} emptyText="No open projects." />
      <Section title="Closed / delivered" orders={closed} emptyText="Nothing closed yet." />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function Section({ title, orders, emptyText }: { title: string; orders: any[]; emptyText: string }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="divide-y divide-white/5">
          {orders.map((o) => {
            const pkg = PACKAGES[o.package as keyof typeof PACKAGES];
            return (
              <Link
                key={o.id}
                to="/developer/orders/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between py-3 hover:bg-white/5 rounded-md px-2 -mx-2"
              >
                <div>
                  <div className="text-sm font-medium">{pkg?.name ?? o.package} · #{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.profile?.full_name ?? o.profile?.email ?? "Client"} · {new Date(o.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="secondary">{o.status}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
