import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { syncCheckoutReturnStatus } from "@/lib/orders.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ order_id: z.string().optional() });

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Payment status · Building Website Now" }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { order_id } = Route.useSearch();
  const sync = useServerFn(syncCheckoutReturnStatus);
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "paid" | "pending" | "error">("checking");

  useEffect(() => {
    if (!order_id) {
      setState("error");
      return;
    }
    let attempts = 0;
    let cancelled = false;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await sync({ data: { orderId: order_id } });
        if (cancelled) return;
        if (res.status && res.status !== "pending_payment" && res.status !== "not_found") {
          setState("paid");
          setTimeout(() => navigate({ to: "/orders/$id", params: { id: res.projectOrderId ?? order_id } }), 800);
          return;
        }
      } catch {
        /* keep polling */
      }
      if (attempts < 6 && !cancelled) setTimeout(poll, 2000);
      else if (!cancelled) setState("pending");
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [order_id, sync, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        {state === "checking" && (
          <>
            <h1 className="text-xl font-semibold">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
          </>
        )}
        {state === "paid" && (
          <>
            <h1 className="text-xl font-semibold">Payment received 🎉</h1>
            <p className="text-sm text-muted-foreground">Taking you to your project…</p>
          </>
        )}
        {state === "pending" && (
          <>
            <h1 className="text-xl font-semibold">Still processing</h1>
            <p className="text-sm text-muted-foreground">
              We haven't received confirmation yet. It will appear in your dashboard once it clears.
            </p>
            <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="text-xl font-semibold">Missing order</h1>
            <Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
