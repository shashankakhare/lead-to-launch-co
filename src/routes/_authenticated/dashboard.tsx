import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageSquare, Receipt, Sparkles, Star, Upload } from "lucide-react";
import { listMyOrders } from "@/lib/orders.functions";
import { listMyNotifications } from "@/lib/notifications.functions";
import { PACKAGES, formatInr } from "@/lib/packages";
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

const STAGE_PROGRESS: Record<string, number> = {
  pending_payment: 5,
  paid: 20,
  requirements_pending: 30,
  in_progress: 60,
  review: 85,
  delivered: 100,
  cancelled: 0,
};

function iconFor(type: string) {
  switch (type) {
    case "message": return MessageSquare;
    case "status": return Sparkles;
    case "delivery": return Star;
    case "invoice": return Receipt;
    case "scope": return Upload;
    default: return Sparkles;
  }
}

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Dashboard() {
  const ordersFn = useServerFn(listMyOrders);
  const notifsFn = useServerFn(listMyNotifications);
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: () => ordersFn() });
  const { data: notifs } = useQuery({ queryKey: ["notifications"], queryFn: () => notifsFn() });

  const activeOrders = (orders ?? []).filter((o) => o.status !== "cancelled");

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">Everything happening on your projects, in one place.</p>
        </div>
      </div>

      {/* Active projects strip */}
      {activeOrders.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeOrders.slice(0, 3).map((o) => {
            const pkg = PACKAGES[o.package as keyof typeof PACKAGES];
            const prog = STAGE_PROGRESS[o.status] ?? 0;
            return (
              <Link key={o.id} to="/orders/$id" params={{ id: o.id }}>
                <Card className="p-4 h-full hover:border-primary/40 transition bg-gradient-to-br from-card to-card/40">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{pkg?.name ?? "Project"}</div>
                    <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[o.status]}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">#{o.id.slice(0, 8)}</div>
                  <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{prog}% complete</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </section>
      )}

      {/* Timeline feed */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activity</h2>
        <Card className="divide-y divide-white/5">
          {(!notifs || notifs.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No activity yet. Once your project starts you'll see updates here.
            </div>
          )}
          {notifs?.slice(0, 20).map((n) => {
            const Icon = iconFor(n.type);
            return (
              <Link
                key={n.id}
                to={n.link ?? "/dashboard"}
                className="flex items-start gap-3 p-4 hover:bg-muted/20 transition"
              >
                <div className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground truncate">{n.body}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">{relativeTime(n.created_at)}</div>
              </Link>
            );
          })}
        </Card>
      </section>

      {/* Start a new site */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Start a new site</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(PACKAGES).map((p) => (
            <Card key={p.slug} className="p-5 flex flex-col gap-3 bg-gradient-to-b from-card to-card/40">
              <div>
                <div className="text-xs text-muted-foreground">{p.tagline}</div>
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="text-2xl font-semibold mt-1">{formatInr(p.priceUsd)}</div>
                <div className="text-xs text-muted-foreground">{p.pages}</div>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/checkout/$package" params={{ package: p.slug }}>Buy {p.name}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
