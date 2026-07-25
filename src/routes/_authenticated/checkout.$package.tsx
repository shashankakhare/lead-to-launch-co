import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createCheckout } from "@/lib/orders.functions";
import { getPackage, type PackageSlug } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadCashfree } from "@/lib/cashfree-client";

export const Route = createFileRoute("/_authenticated/checkout/$package")({
  head: () => ({ meta: [{ title: "Checkout · Building Website Now" }] }),
  component: Checkout,
});

function formatCharge(c: { amount: number; currency: string }) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: c.currency }).format(c.amount);
  } catch {
    return `${c.amount.toFixed(2)} ${c.currency}`;
  }
}

function Checkout() {
  const { package: slug } = Route.useParams();
  const pkg = getPackage(slug);
  const fn = useServerFn(createCheckout);
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<{ amount: number; currency: string } | null>(null);

  useEffect(() => {
    if (!pkg) return;
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const res = await fn({ data: { packageSlug: slug as PackageSlug } });
        if (cancelled) return;
        if (res.chargeAmount && res.chargeCurrency) {
          setCharge({ amount: res.chargeAmount, currency: res.chargeCurrency });
        }
        if (res.mode === "mock") {
          // Test/mock payment path: order is already marked paid server-side.
          navigate({ to: "/orders/$id", params: { id: res.orderId } });
          return;
        }
        const cashfree = await loadCashfree(res.mode);
        if (cancelled) return;
        await cashfree.checkout({
          paymentSessionId: res.paymentSessionId,
          redirectTarget: "_self",
        });
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Checkout failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pkg, slug, fn]);

  if (!pkg) {
    return (
      <Card className="p-6 max-w-md mx-auto text-center space-y-3">
        <h1 className="text-xl font-semibold">Unknown package</h1>
        <Button onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6 space-y-4 text-center">
        <div>
          <div className="text-sm text-muted-foreground">{pkg.tagline}</div>
          <h1 className="text-2xl font-semibold">{pkg.name}</h1>
          <div className="text-3xl font-semibold mt-2">${pkg.priceUsd} USD</div>
          <div className="text-xs text-muted-foreground">{pkg.pages} · Live in 4 days</div>
          {charge && charge.currency !== "USD" && (
            <div className="text-sm text-muted-foreground mt-1">
              ≈ {formatCharge(charge)} charged at checkout
            </div>
          )}
        </div>
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">Opening secure Cashfree checkout…</p>
        )}
        {status === "error" && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Back</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
