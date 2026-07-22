import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/orders.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Building Website Now" }] }),
  component: Dashboard,
});

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  requirements_pending: "Submit requirements",
  in_progress: "In progress",
  review: "In review",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function Dashboard() {
  const fn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your projects</h1>
        <p className="text-muted-foreground">Track your website build, upload assets, and rate the work.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Start a new project</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.values(PACKAGES).map((p) => (
            <Card key={p.slug} className="p-5 flex flex-col gap-3">
              <div>
                <div className="text-sm text-muted-foreground">{p.tagline}</div>
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="text-2xl font-semibold">${p.priceUsd}</div>
                <div className="text-xs text-muted-foreground">{p.pages}</div>
              </div>
              <Button asChild size="sm">
                <Link to="/checkout/$package" params={{ package: p.slug }}>Buy {p.name}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Your orders</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No orders yet. Pick a package above to get started.</p>
        )}
        <div className="grid gap-3">
          {data?.map((o: { id: string; package: keyof typeof PACKAGES; amount_usd: number; currency: string; status: string; created_at: string }) => {
            const pkg = PACKAGES[o.package];
            return (
              <Link key={o.id} to="/orders/$id" params={{ id: o.id }}>
                <Card className="p-4 flex items-center justify-between hover:border-primary/40 transition">
                  <div>
                    <div className="font-medium">{pkg.name} — {pkg.pages}</div>
                    <div className="text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">${Number(o.amount_usd).toFixed(0)}</div>
                    <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
