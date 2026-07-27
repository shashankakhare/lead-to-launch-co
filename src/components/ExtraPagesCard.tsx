import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import { purchaseAddon } from "@/lib/scope.functions";
import { getCashfreeMode } from "@/lib/cashfree-client";
import { SCOPE_ADDONS, formatInr } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, FilePlus } from "lucide-react";

export function ExtraPagesCard({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const purchase = useServerFn(purchaseAddon);
  const [qty, setQty] = useState(1);
  const price = SCOPE_ADDONS.extra_page.priceUsd;
  const total = price * qty;

  const buy = useMutation({
    mutationFn: () => purchase({ data: { orderId, kind: "extra_page", quantity: qty } }),
    onSuccess: async (res) => {
      if (res.mode === "mock") {
        toast(`Test payment completed for ${qty} extra page${qty > 1 ? "s" : ""}.`);
        qc.invalidateQueries({ queryKey: ["order", orderId] });
        return;
      }
      try {
        const cashfree = await loadCashfree({ mode: getCashfreeMode() });
        await cashfree.checkout({ paymentSessionId: res.paymentSessionId, redirectTarget: "_self" });
      } catch (e: any) {
        toast(e.message ?? "Failed to open checkout");
      }
    },
    onError: (e: any) => toast(e.message ?? "Failed to start checkout"),
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FilePlus className="h-4 w-4 text-primary" />
          <h2 className="font-medium">Add more pages</h2>
        </div>
        <span className="text-sm text-muted-foreground">{formatInr(price)}/page</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Need more than what your package covers? Add extra designed & developed pages any time. Your developer is notified on payment.
      </p>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-2">
          <Label>How many extra pages?</Label>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input type="number" min={1} max={10} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="w-16 text-center" />
            <Button type="button" size="icon" variant="outline" onClick={() => setQty((q) => Math.min(10, q + 1))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm">
            Total: <span className="font-semibold">{formatInr(total)}</span>
          </div>
          <Button onClick={() => buy.mutate()} disabled={buy.isPending}>
            {buy.isPending ? "Starting…" : "Buy & pay"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
