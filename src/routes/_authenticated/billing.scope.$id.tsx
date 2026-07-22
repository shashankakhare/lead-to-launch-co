import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getMyOrder } from "@/lib/orders.functions";
import { purchaseAddon, listAddonsForOrder } from "@/lib/scope.functions";
import { PACKAGES, SCOPE_ADDONS, type ScopeAddonKind } from "@/lib/packages";
import { openCashfreeCheckout } from "@/lib/cashfree-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing/scope/$id")({
  component: Scope,
});

function Scope() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getMyOrder);
  const listFn = useServerFn(listAddonsForOrder);
  const buyFn = useServerFn(purchaseAddon);
  const { data } = useQuery({ queryKey: ["order", id], queryFn: () => getFn({ data: { orderId: id } }) });
  const { data: addons } = useQuery({
    queryKey: ["addons", id],
    queryFn: () => listFn({ data: { orderId: id } }),
  });
  const [busyKind, setBusyKind] = useState<string | null>(null);

  const buy = useMutation({
    mutationFn: async (kind: Exclude<ScopeAddonKind, "custom">) => {
      const res = await buyFn({ data: { orderId: id, kind } });
      return res;
    },
    onSuccess: async (res) => {
      try {
        await openCashfreeCheckout({ paymentSessionId: res.paymentSessionId, mode: res.mode });
      } catch (e) {
        toast.error("Checkout failed to open");
        console.error(e);
      } finally {
        setBusyKind(null);
      }
    },
    onError: (e) => {
      toast.error((e as Error).message);
      setBusyKind(null);
    },
  });

  const pkgName = data ? PACKAGES[(data.order as { package: string }).package as keyof typeof PACKAGES]?.name : "";

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/billing" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to billing
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add extra scope</h1>
        <p className="text-sm text-muted-foreground">
          For {pkgName} · #{id.slice(0, 8)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.values(SCOPE_ADDONS).map((a) => (
          <Card key={a.kind} className="p-5 flex flex-col gap-3 bg-gradient-to-b from-card to-card/40">
            <div>
              <div className="text-lg font-semibold">{a.title}</div>
              <div className="text-2xl font-semibold mt-1">${a.priceUsd}</div>
              <p className="text-xs text-muted-foreground mt-2">{a.description}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setBusyKind(a.kind);
                buy.mutate(a.kind as Exclude<ScopeAddonKind, "custom">);
              }}
              disabled={busyKind !== null}
            >
              {busyKind === a.kind ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Buy & pay
            </Button>
          </Card>
        ))}
      </div>

      {addons && addons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Previous add-ons for this project</h2>
          <Card className="divide-y divide-white/5">
            {addons.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">${(a.price_cents / 100).toFixed(0)}</div>
                  <Badge variant="secondary">{a.status.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
