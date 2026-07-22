import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { listMyOrders } from "@/lib/orders.functions";
import { listMyAddons } from "@/lib/scope.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing · Building Website Now" }] }),
  component: Billing,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  paid: "default",
  pending_payment: "outline",
  cancelled: "secondary",
};

function Billing() {
  const ordersFn = useServerFn(listMyOrders);
  const addonsFn = useServerFn(listMyAddons);
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: () => ordersFn() });
  const { data: addons } = useQuery({ queryKey: ["my-addons"], queryFn: () => addonsFn() });

  const addonInvoiceIds = new Set((addons ?? []).map((a) => a.invoice_order_id).filter(Boolean));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">Invoices, payment history, and extra scope.</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Invoices</h2>
        <Card className="divide-y divide-white/5">
          {(!orders || orders.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</div>
          )}
          {orders?.map((o) => {
            const isAddon = addonInvoiceIds.has(o.id);
            const addon = addons?.find((a) => a.invoice_order_id === o.id);
            const label = isAddon
              ? addon?.title ?? "Scope add-on"
              : PACKAGES[o.package as keyof typeof PACKAGES]?.name ?? "Package";
            return (
              <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    INV-{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-medium">${Number(o.amount_usd).toFixed(0)}</div>
                  <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>{o.status.replace("_", " ")}</Badge>
                  {o.status === "pending_payment" ? (
                    <Button size="sm" variant="secondary" asChild>
                      <Link to="/checkout/return" search={{ order_id: o.id } as never}>Pay</Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" title="Download coming soon" disabled>
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Extra scope</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Need more? Buy extra pages, revisions, or rush delivery from any project page.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {orders?.filter((o) => o.status !== "cancelled" && o.status !== "pending_payment").slice(0, 3).map((o) => (
            <Card key={o.id} className="p-4 bg-gradient-to-b from-card to-card/40">
              <div className="text-sm font-medium truncate">
                {PACKAGES[o.package as keyof typeof PACKAGES]?.name ?? "Project"}
              </div>
              <div className="text-xs text-muted-foreground truncate">#{o.id.slice(0, 8)}</div>
              <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
                <Link to="/billing/scope/$id" params={{ id: o.id }}>
                  <Plus className="h-3 w-3 mr-1" /> Add scope
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
