import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, package, amount_usd, currency, status, created_at, user_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((orders ?? []).map((o) => o.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (orders ?? []).map((o) => ({ ...o, profile: map.get(o.user_id) ?? null }));
  });

export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: order }, { data: req }, { data: updates }, { data: rating }] = await Promise.all([
      supabaseAdmin.from("orders").select("*").eq("id", data.orderId).maybeSingle(),
      supabaseAdmin.from("project_requirements").select("*").eq("order_id", data.orderId).maybeSingle(),
      supabaseAdmin
        .from("project_updates")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("ratings").select("*").eq("order_id", data.orderId).maybeSingle(),
    ]);
    if (!order) throw new Error("Order not found");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, phone, company")
      .eq("id", order.user_id)
      .maybeSingle();
    return { order, requirements: req, updates: updates ?? [], rating, profile };
  });

const StatusEnum = z.enum([
  "pending_payment",
  "paid",
  "requirements_pending",
  "in_progress",
  "review",
  "delivered",
  "cancelled",
]);

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; status: z.infer<typeof StatusEnum> }) =>
    z.object({ orderId: z.string().uuid(), status: StatusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminPostUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; stage: string; message: string }) =>
    z
      .object({
        orderId: z.string().uuid(),
        stage: z.string().min(1).max(100),
        message: z.string().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("project_updates")
      .insert({ order_id: data.orderId, stage: data.stage, message: data.message });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
