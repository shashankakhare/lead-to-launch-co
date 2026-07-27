import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const searchDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => z.object({ query: z.string().min(1).max(63) }).parse(input))
  .handler(async ({ data }) => {
    const { searchAcrossTlds } = await import("./godaddy.server");
    try {
      const rows = await searchAcrossTlds(data.query);
      return { ok: true as const, results: rows };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Domain lookup failed", results: [] };
    }
  });

export const listHostingPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data } = await client
    .from("hosting_plans_config")
    .select("slug, name, description, price_inr, billing_period, features, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
});

const DomainChoiceSchema = z.object({
  orderId: z.string().uuid(),
  mode: z.enum(["have", "buy_self", "buy_from_us", "need_help"]),
  domainName: z.string().max(255).optional(),
  registrar: z.string().max(120).optional(),
  registrarLogin: z.string().max(255).optional(),
  registrarNotes: z.string().max(2000).optional(),
  hostingPlan: z.string().max(64).nullable().optional(),
  domainPriceInr: z.number().nonnegative().nullable().optional(),
});

/** Save the client's domain & hosting choice into requirements.intake_data.domain, and notify their developer. */
export const saveDomainChoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof DomainChoiceSchema>) => DomainChoiceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify order ownership
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, assigned_to")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");

    const { data: req } = await supabase
      .from("project_requirements")
      .select("intake_data")
      .eq("order_id", data.orderId)
      .maybeSingle();

    const intake = (req?.intake_data as Record<string, any>) ?? {};
    intake.domain = {
      mode: data.mode,
      domainName: data.domainName ?? null,
      registrar: data.registrar ?? null,
      registrarLogin: data.registrarLogin ?? null,
      registrarNotes: data.registrarNotes ?? null,
      hostingPlan: data.hostingPlan ?? null,
      domainPriceInr: data.domainPriceInr ?? null,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("project_requirements")
      .upsert({ order_id: data.orderId, intake_data: intake }, { onConflict: "order_id" });
    if (error) throw new Error(error.message);

    // Notify assigned developer (fire and forget)
    if (order.assigned_to) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications").insert({
        user_id: order.assigned_to,
        type: "scope",
        title: "Domain & hosting preference updated",
        body: `Client set domain option: ${data.mode.replace(/_/g, " ")}${data.domainName ? ` — ${data.domainName}` : ""}${data.hostingPlan ? ` · hosting: ${data.hostingPlan}` : ""}`,
        order_id: data.orderId,
        link: `/developer/orders/${data.orderId}`,
      });
    }

    return { ok: true };
  });

/** Create an invoice (Cashfree order) for domain + optional hosting purchase, tied to this project. */
export const purchaseDomainHosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    orderId: string;
    domainName: string;
    domainPriceInr: number;
    hostingSlug?: string | null;
  }) =>
    z
      .object({
        orderId: z.string().uuid(),
        domainName: z.string().min(3).max(255),
        domainPriceInr: z.number().nonnegative(),
        hostingSlug: z.string().max(64).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, assigned_to")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");

    // Hosting price lookup
    let hostingPrice = 0;
    let hostingName = "";
    if (data.hostingSlug) {
      const { data: plan } = await supabase
        .from("hosting_plans_config")
        .select("name, price_inr")
        .eq("slug", data.hostingSlug)
        .maybeSingle();
      if (!plan) throw new Error("Hosting plan not found");
      hostingPrice = Number(plan.price_inr);
      hostingName = plan.name;
    }

    const total = Math.round(Number(data.domainPriceInr) + hostingPrice);
    if (total <= 0) throw new Error("Nothing to charge");

    const { usdToChargeAmount, createCashfreeOrder, cashfreeMode, isPaymentTestMode } = await import("./cashfree.server");
    const charge = usdToChargeAmount(total);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", userId)
      .maybeSingle();

    const { data: invoiceOrder, error: ordErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        package: "one_page",
        amount_usd: total,
        amount_charged: charge.amount,
        currency: charge.currency,
        status: "pending_payment",
        notes: `Domain & hosting for order ${data.orderId.slice(0, 8)}`,
      })
      .select("id")
      .single();
    if (ordErr || !invoiceOrder) throw new Error(ordErr?.message ?? "Failed to create invoice");

    const title = hostingName
      ? `Domain ${data.domainName} + ${hostingName}`
      : `Domain ${data.domainName}`;

    const { error: addonErr } = await supabase.from("scope_addons").insert({
      order_id: data.orderId,
      user_id: userId,
      kind: "domain_hosting",
      title,
      description: `Registration for ${data.domainName}${hostingName ? ` and ${hostingName}` : ""}`,
      price_cents: total * 100,
      currency: "INR",
      status: "pending_payment",
      invoice_order_id: invoiceOrder.id,
    });
    if (addonErr) throw new Error(addonErr.message);

    // Notify developer immediately (so they know client committed to domain)
    if (order.assigned_to) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications").insert({
        user_id: order.assigned_to,
        type: "scope",
        title: "Client purchasing domain & hosting",
        body: `${title} — awaiting payment.`,
        order_id: data.orderId,
        link: `/developer/orders/${data.orderId}`,
      });
    }

    if (isPaymentTestMode()) {
      const { completePaidOrder } = await import("./payments.server");
      await completePaidOrder(invoiceOrder.id, "test-bypass");
      return { invoiceOrderId: invoiceOrder.id, paymentSessionId: "mock", mode: "mock" as const };
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

    return { invoiceOrderId: invoiceOrder.id, paymentSessionId: cf.paymentSessionId, mode: cashfreeMode() };
  });
