import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SCOPE_ADDONS } from "./packages";

const KindEnum = z.enum(["extra_page", "extra_revision", "rush"]);

export const listMyAddons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("scope_addons")
      .select("id, order_id, kind, title, price_cents, currency, status, created_at, invoice_order_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAddonsForOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("scope_addons")
      .select("*")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false });
    return rows ?? [];
  });

export const purchaseAddon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; kind: "extra_page" | "extra_revision" | "rush"; quantity?: number }) =>
    z
      .object({
        orderId: z.string().uuid(),
        kind: KindEnum,
        quantity: z.number().int().min(1).max(10).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const catalog = SCOPE_ADDONS[data.kind];
    const qty = data.quantity ?? 1;
    const total = catalog.priceUsd * qty;
    const { supabase, userId, claims } = context;
    const { usdToChargeAmount, createCashfreeOrder, cashfreeMode, isPaymentTestMode } = await import("./cashfree.server");
    const charge = usdToChargeAmount(total);

    // Verify order ownership
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", userId)
      .maybeSingle();

    // Create an invoice order for this add-on
    const { data: invoiceOrder, error: ordErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        package: "one_page", // reused as invoice type; UI will surface "Scope add-on"
        amount_usd: total,
        amount_charged: charge.amount,
        currency: charge.currency,
        status: "pending_payment",
      })
      .select("id")
      .single();
    if (ordErr || !invoiceOrder) throw new Error(ordErr?.message ?? "Failed to create invoice");

    const { error: addonErr } = await supabase.from("scope_addons").insert({
      order_id: data.orderId,
      user_id: userId,
      kind: data.kind,
      title: qty > 1 ? `${catalog.title} × ${qty}` : catalog.title,
      description: catalog.description,
      price_cents: total * 100,
      currency: "USD",
      status: "pending_payment",
      invoice_order_id: invoiceOrder.id,
    });
    if (addonErr) throw new Error(addonErr.message);


    if (isPaymentTestMode()) {
      const { completePaidOrder } = await import("./payments.server");
      await completePaidOrder(invoiceOrder.id, "test-bypass");
      return {
        invoiceOrderId: invoiceOrder.id,
        paymentSessionId: "mock",
        mode: "mock" as const,
      };
    }

    const host = getRequestHost();
    const proto = host.startsWith("localhost") ? "http" : "https";
    const origin = `${proto}://${host}`;

    const cf = await createCashfreeOrder({
      orderId: invoiceOrder.id,
      amount: charge.amount,
      currency: charge.currency,
      customer: {
        id: userId,
        email: profile?.email ?? (claims.email as string) ?? "customer@example.com",
        phone: profile?.phone ?? "0000000000",
        name: profile?.full_name ?? undefined,
      },
      returnUrl: `${origin}/checkout/return?order_id={order_id}`,
      notifyUrl: `${origin}/api/public/webhooks/cashfree`,
    });

    await supabase
      .from("orders")
      .update({ cashfree_order_id: cf.orderId, cashfree_payment_session_id: cf.paymentSessionId })
      .eq("id", invoiceOrder.id);

    return {
      invoiceOrderId: invoiceOrder.id,
      paymentSessionId: cf.paymentSessionId,
      mode: cashfreeMode(),
    };
  });
