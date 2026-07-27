import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PACKAGES, type PackageSlug } from "./packages";

const PackageEnum = z.enum(["one_page", "five_page", "ten_page"]);
const RevisionStatusEnum = z.enum(["pending", "addressed", "approved"]);

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { packageSlug: PackageSlug }) =>
    z.object({ packageSlug: PackageEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const pkg = PACKAGES[data.packageSlug];
    const { supabase, userId, claims } = context;
    const { usdToChargeAmount, createCashfreeOrder, cashfreeMode, isPaymentTestMode } = await import("./cashfree.server");
    const charge = usdToChargeAmount(pkg.priceUsd);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", userId)
      .maybeSingle();

    const { data: order, error: insertErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        package: data.packageSlug,
        amount_usd: pkg.priceUsd,
        amount_charged: charge.amount,
        currency: charge.currency,
        status: "pending_payment",
      })
      .select("id")
      .single();
    if (insertErr || !order) throw new Error(insertErr?.message ?? "Failed to create order");

    // Test payment path: skip Cashfree entirely so checkout cannot get stuck during testing.
    if (isPaymentTestMode()) {
      const { completePaidOrder } = await import("./payments.server");
      await completePaidOrder(order.id, "test-bypass");
      return {
        orderId: order.id,
        paymentSessionId: "mock",
        mode: "mock" as const,
        chargeAmount: charge.amount,
        chargeCurrency: charge.currency,
      };
    }

    const host = getRequestHost();
    const proto = host.startsWith("localhost") ? "http" : "https";
    const origin = `${proto}://${host}`;

    const cf = await createCashfreeOrder({
      orderId: order.id,
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
      .eq("id", order.id);

    return {
      orderId: order.id,
      paymentSessionId: cf.paymentSessionId,
      mode: cashfreeMode(),
      chargeAmount: charge.amount,
      chargeCurrency: charge.currency,
    };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, package, amount_usd, currency, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: order }, { data: req }, { data: updates }, { data: rating }, { data: revisions }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", data.orderId).maybeSingle(),
      supabase.from("project_requirements").select("*").eq("order_id", data.orderId).maybeSingle(),
      supabase
        .from("project_updates")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: true }),
      supabase.from("ratings").select("*").eq("order_id", data.orderId).maybeSingle(),
      supabase
        .from("revisions")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: true }),
    ]);
    if (!order) throw new Error("Order not found");
    return { order, requirements: req, updates: updates ?? [], rating, revisions: revisions ?? [] };
  });

export const syncOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status, cashfree_order_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.status !== "pending_payment" && order.status !== "paid") {
      const { getPaymentTarget } = await import("./payments.server");
      const target = await getPaymentTarget(order.id);
      return { status: order.status, projectOrderId: target.projectOrderId };
    }

    const { fetchCashfreeOrder, isCashfreePaidStatus, isPaymentTestMode } = await import("./cashfree.server");
    const isPaid = order.status === "paid"
      || isPaymentTestMode()
      || !order.cashfree_order_id
      || (order.cashfree_order_id
        ? isCashfreePaidStatus((await fetchCashfreeOrder(order.cashfree_order_id)).order_status)
        : false);
    if (isPaid) {
      const { completePaidOrder } = await import("./payments.server");
      return completePaidOrder(order.id, isPaymentTestMode() ? "test-bypass" : null);
    }
    return { status: order.status, projectOrderId: order.id };
  });

export const syncCheckoutReturnStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, cashfree_order_id")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return { status: "not_found", projectOrderId: data.orderId };
    if (order.status !== "pending_payment" && order.status !== "paid") {
      const { getPaymentTarget } = await import("./payments.server");
      const target = await getPaymentTarget(order.id);
      return { status: order.status, projectOrderId: target.projectOrderId };
    }

    const { fetchCashfreeOrder, isCashfreePaidStatus, isPaymentTestMode } = await import("./cashfree.server");
    const isPaid = order.status === "paid"
      || isPaymentTestMode()
      || !order.cashfree_order_id
      || (order.cashfree_order_id
        ? isCashfreePaidStatus((await fetchCashfreeOrder(order.cashfree_order_id)).order_status)
        : false);

    if (!isPaid) return { status: order.status, projectOrderId: order.id };

    const { completePaidOrder } = await import("./payments.server");
    return completePaidOrder(order.id, isPaymentTestMode() ? "test-bypass" : null);
  });

const RequirementsSchema = z.object({
  orderId: z.string().uuid(),
  businessName: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  brandColors: z.string().max(500).optional(),
  referenceSites: z.string().max(2000).optional(),
  contentNotes: z.string().max(10000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  referenceImages: z.array(z.string().url()).max(50).optional(),
  intakeData: z.record(z.string(), z.any()).optional(),
  submit: z.boolean().optional(),
});

export const saveRequirements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof RequirementsSchema>) => RequirementsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch = {
      order_id: data.orderId,
      business_name: data.businessName ?? null,
      industry: data.industry ?? null,
      brand_colors: data.brandColors ?? null,
      reference_sites: data.referenceSites ?? null,
      content_notes: data.contentNotes ?? null,
      logo_url: data.logoUrl || null,
      reference_images: data.referenceImages ?? [],
      intake_data: data.intakeData ?? {},
      submitted: data.submit ?? false,
    };
    const { error } = await supabase
      .from("project_requirements")
      .upsert(patch, { onConflict: "order_id" });
    if (error) throw new Error(error.message);
    if (data.submit) {
      await supabase.from("orders").update({ status: "in_progress" }).eq("id", data.orderId);
    }
    return { ok: true };
  });

export const rateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; stars: number; review?: string }) =>
    z
      .object({
        orderId: z.string().uuid(),
        stars: z.number().int().min(1).max(5),
        review: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ratings")
      .upsert(
        {
          order_id: data.orderId,
          user_id: context.userId,
          stars: data.stars,
          review: data.review ?? null,
        },
        { onConflict: "order_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const requestRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; message: string }) =>
    z.object({ orderId: z.string().uuid(), message: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status, assigned_to")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.status !== "review") throw new Error("Project is not currently in review");

    const { error } = await supabase.from("revisions").insert({
      order_id: data.orderId,
      requested_by: userId,
      message: data.message,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    await supabase.from("project_updates").insert({
      order_id: data.orderId,
      stage: "Revision requested",
      message: data.message,
    });

    const { notifyProjectEvent } = await import("@/lib/notify.server");
    await notifyProjectEvent({
      orderId: data.orderId,
      eventKey: `revision-requested-${data.orderId}-${Date.now()}`,
      title: "Client requested revisions",
      message: data.message,
      audiences: ["developer", "admin"],
      notificationType: "update",
    });
    return { ok: true };
  });

export const approveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status, assigned_to")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.status !== "review") throw new Error("Project is not currently in review");

    const { error } = await supabase.from("revisions").insert({
      order_id: data.orderId,
      requested_by: userId,
      message: "Client approved the deliverable.",
      status: "approved",
    });
    if (error) throw new Error(error.message);

    await supabase.from("orders").update({ status: "delivered" }).eq("id", data.orderId);
    await supabase.from("project_updates").insert({
      order_id: data.orderId,
      stage: "Approved & delivered",
      message: "You approved the website. The project is now complete.",
    });

    const { notifyProjectEvent } = await import("@/lib/notify.server");
    await notifyProjectEvent({
      orderId: data.orderId,
      eventKey: `approved-${data.orderId}`,
      title: "Client approved the project",
      message: "The client approved the deliverable. The project is now marked as delivered.",
      status: "delivered",
      audiences: ["developer", "admin"],
      notificationType: "status",
    });
    return { ok: true };
  });
