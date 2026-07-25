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

const PackageEnum = z.enum(["one_page", "five_page", "ten_page"]);

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      orderId: string;
      amount_usd?: number;
      package?: z.infer<typeof PackageEnum>;
      status?: z.infer<typeof StatusEnum>;
      notes?: string;
      assigned_to?: string | null;
    }) =>
      z
        .object({
          orderId: z.string().uuid(),
          amount_usd: z.number().min(0).max(1000000).optional(),
          package: PackageEnum.optional(),
          status: StatusEnum.optional(),
          notes: z.string().max(4000).optional(),
          assigned_to: z.string().uuid().nullable().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { orderId, ...patch } = data;
    if (Object.keys(patch).length === 0) return { ok: true };

    let previousAssignee: string | null = null;
    const isAssignmentChange = Object.prototype.hasOwnProperty.call(patch, "assigned_to");
    if (isAssignmentChange) {
      const { data: current } = await supabaseAdmin
        .from("orders")
        .select("assigned_to")
        .eq("id", orderId)
        .maybeSingle();
      previousAssignee = current?.assigned_to ?? null;
    }

    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", orderId);
    if (error) throw new Error(error.message);

    if (isAssignmentChange && previousAssignee !== (patch.assigned_to ?? null)) {
      const newAssignee = patch.assigned_to ?? null;
      await supabaseAdmin.from("assignment_audit_log").insert({
        order_id: orderId,
        assigned_to: newAssignee,
        previous_assignee: previousAssignee,
        trigger_source: "manual_reassign",
        reason: previousAssignee
          ? newAssignee
            ? "Admin reassigned project to a different developer."
            : "Admin unassigned the project."
          : "Admin manually assigned the project to a developer.",
        initiated_by: context.userId,
      });
      if (newAssignee) {
        await supabaseAdmin.from("notifications").insert({
          user_id: newAssignee,
          type: "assignment",
          title: "New project assigned",
          body: `An admin assigned order ${orderId.slice(0, 8)} to you.`,
          link: `/developer/orders/${orderId}`,
        });
      }
      if (previousAssignee && previousAssignee !== newAssignee) {
        await supabaseAdmin.from("notifications").insert({
          user_id: previousAssignee,
          type: "assignment",
          title: "Project reassigned",
          body: `Order ${orderId.slice(0, 8)} has been moved to another developer.`,
        });
      }
    }

    return { ok: true };
  });

export const adminBackfillAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { autoAssignOrderToDeveloper } = await import("@/lib/payments.server");

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id")
      .is("assigned_to", null)
      .in("status", ["paid", "requirements_pending", "in_progress", "review"] as any);
    if (error) throw new Error(error.message);

    let assigned = 0;
    let skipped = 0;
    for (const o of orders ?? []) {
      const pick = await autoAssignOrderToDeveloper(o.id, {
        trigger: "admin_backfill",
        initiatedBy: context.userId,
        reason: "Admin bulk backfill of unassigned paid projects.",
      });
      if (pick) assigned++;
      else skipped++;
    }
    return { ok: true, assigned, skipped, total: (orders ?? []).length };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "developer"] as any);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (ids.length === 0) return [];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids);
    return profiles ?? [];
  });

export const listAssignmentAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId?: string; developerId?: string; limit?: number } = {}) =>
    z
      .object({
        orderId: z.string().uuid().optional(),
        developerId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("assignment_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.orderId) q = q.eq("order_id", data.orderId);
    if (data.developerId) q = q.eq("assigned_to", data.developerId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(
      new Set(
        (rows ?? [])
          .flatMap((r) => [r.assigned_to, r.previous_assignee, r.initiated_by])
          .filter((v): v is string => Boolean(v)),
      ),
    );
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      ...r,
      assigned_to_profile: r.assigned_to ? map.get(r.assigned_to) ?? null : null,
      previous_assignee_profile: r.previous_assignee ? map.get(r.previous_assignee) ?? null : null,
      initiated_by_profile: r.initiated_by ? map.get(r.initiated_by) ?? null : null,
    }));
  });
