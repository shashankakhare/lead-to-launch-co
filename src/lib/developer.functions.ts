import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RevisionStatusEnum = z.enum(["pending", "addressed", "approved"]);

async function assertDeveloper(supabase: any, userId: string) {
  const { data: isDev } = await supabase.rpc("has_role", { _user_id: userId, _role: "developer" });
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isDev && !isAdmin) throw new Error("Forbidden: developer only");
  return { isAdmin: Boolean(isAdmin) };
}

export const amIDeveloper = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "developer",
    });
    return { isDeveloper: Boolean(data) };
  });

export const listMyAssignedOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDeveloper(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, package, amount_usd, currency, status, created_at, user_id, assigned_to")
      .eq("assigned_to", context.userId)
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

export const devGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { isAdmin } = await assertDeveloper(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", data.orderId).maybeSingle();
    if (!order) throw new Error("Order not found");
    if (!isAdmin && order.assigned_to !== context.userId) throw new Error("Forbidden: not assigned to you");
    const [{ data: req }, { data: updates }, { data: profile }, { data: revisions }] = await Promise.all([
      supabaseAdmin.from("project_requirements").select("*").eq("order_id", data.orderId).maybeSingle(),
      supabaseAdmin.from("project_updates").select("*").eq("order_id", data.orderId).order("created_at", { ascending: true }),
      supabaseAdmin.from("profiles").select("id, email, full_name, phone, company").eq("id", order.user_id).maybeSingle(),
      supabaseAdmin.from("revisions").select("*").eq("order_id", data.orderId).order("created_at", { ascending: true }),
    ]);
    return { order, requirements: req, updates: updates ?? [], profile, revisions: revisions ?? [] };
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

async function ensureAssigned(orderId: string, userId: string, isAdmin: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin.from("orders").select("assigned_to, user_id").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found");
  if (!isAdmin && order.assigned_to !== userId) throw new Error("Forbidden: not assigned to you");
  return order;
}

export const devUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { orderId: string; status: z.infer<typeof StatusEnum> }) =>
    z.object({ orderId: z.string().uuid(), status: StatusEnum }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { isAdmin } = await assertDeveloper(context.supabase, context.userId);
    const order = await ensureAssigned(data.orderId, context.userId, isAdmin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    // Notify client + timeline
    await supabaseAdmin.from("project_updates").insert({
      order_id: data.orderId,
      stage: `Status: ${data.status}`,
      message: `Your developer marked this project as "${data.status}".`,
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      type: "status",
      title: "Project status updated",
      body: `Your project is now "${data.status}".`,
      link: `/orders/${data.orderId}`,
    });
    return { ok: true };
  });

export const devPostUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { orderId: string; stage: string; message: string }) =>
    z.object({
      orderId: z.string().uuid(),
      stage: z.string().min(1).max(100),
      message: z.string().min(1).max(4000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { isAdmin } = await assertDeveloper(context.supabase, context.userId);
    const order = await ensureAssigned(data.orderId, context.userId, isAdmin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_updates").insert({
      order_id: data.orderId,
      stage: data.stage,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      type: "update",
      title: `Update: ${data.stage}`,
      body: data.message.slice(0, 140),
      link: `/orders/${data.orderId}`,
    });
    return { ok: true };
  });

export const devLogTime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { orderId: string; minutes: number; note?: string; startedAt?: string }) =>
    z.object({
      orderId: z.string().uuid(),
      minutes: z.number().int().min(1).max(24 * 60),
      note: z.string().max(500).optional(),
      startedAt: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { isAdmin } = await assertDeveloper(context.supabase, context.userId);
    await ensureAssigned(data.orderId, context.userId, isAdmin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("time_entries").insert({
      developer_id: context.userId,
      order_id: data.orderId,
      started_at: data.startedAt ?? new Date().toISOString(),
      minutes: data.minutes,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resolveRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { revisionId: string; orderId: string; message: string }) =>
    z.object({
      revisionId: z.string().uuid(),
      orderId: z.string().uuid(),
      message: z.string().min(1).max(4000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { isAdmin } = await assertDeveloper(context.supabase, context.userId);
    const order = await ensureAssigned(data.orderId, context.userId, isAdmin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rev } = await supabaseAdmin
      .from("revisions")
      .select("id, status")
      .eq("id", data.revisionId)
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (!rev) throw new Error("Revision not found");
    if (rev.status !== "pending") throw new Error("Revision is already resolved");

    const { error } = await supabaseAdmin
      .from("revisions")
      .update({ status: "addressed" })
      .eq("id", data.revisionId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("project_updates").insert({
      order_id: data.orderId,
      stage: "Revision addressed",
      message: data.message,
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      type: "update",
      title: "Developer addressed your revision request",
      body: data.message.slice(0, 140),
      link: `/orders/${data.orderId}`,
    });
    return { ok: true };
  });
