import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/orders.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects · Building Website Now" }] }),
  component: Projects,
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

function Projects() {
  const fn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">All your website builds and add-on invoices.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/dashboard"><Plus className="h-4 w-4 mr-1" /> New site</Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && (!data || data.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No projects yet. Pick a package to get started.
        </Card>
      )}

      <div className="grid gap-3">
        {data?.map((o) => {
          const pkg = PACKAGES[o.package as keyof typeof PACKAGES];
          return (
            <Link key={o.id} to="/orders/$id" params={{ id: o.id }}>
              <Card className="p-4 flex items-center justify-between hover:border-primary/40 transition">
                <div className="min-w-0">
                  <div className="font-medium truncate">{pkg?.name ?? "Project"} — {pkg?.pages}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-medium">{formatInr(Number(o.amount_usd))}</div>
                  <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
