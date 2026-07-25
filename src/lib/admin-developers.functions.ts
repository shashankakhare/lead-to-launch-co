import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

const OPEN = ["paid", "requirements_pending", "in_progress", "review"] as const;

export const listDevelopers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "developer" as any);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (ids.length === 0) return [];

    const [{ data: profiles }, { data: orders }, { data: time }, { data: ratings }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").in("id", ids),
      supabaseAdmin.from("orders").select("id, status, assigned_to").in("assigned_to", ids),
      supabaseAdmin.from("time_entries").select("developer_id, minutes, started_at").in("developer_id", ids),
      supabaseAdmin.from("ratings").select("stars, order_id"),
    ]);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return (profiles ?? []).map((p) => {
      const devOrders = (orders ?? []).filter((o) => o.assigned_to === p.id);
      const openCount = devOrders.filter((o) => (OPEN as readonly string[]).includes(o.status)).length;
      const hoursWeek =
        (time ?? [])
          .filter((t) => t.developer_id === p.id && new Date(t.started_at) >= weekStart)
          .reduce((s, t) => s + (t.minutes || 0), 0) / 60;
      const devRatings = (ratings ?? []).filter((r) => devOrders.some((o) => o.id === r.order_id));
      const avg =
        devRatings.length > 0
          ? devRatings.reduce((s, r) => s + Number(r.stars || 0), 0) / devRatings.length
          : 0;
      return {
        ...p,
        openCount,
        totalOrders: devOrders.length,
        hoursWeek: Math.round(hoursWeek * 10) / 10,
        avgRating: Math.round(avg * 10) / 10,
      };
    });
  });

export const getDeveloper = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: orders }, { data: time }, { data: ratings }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("orders").select("*").eq("assigned_to", data.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("time_entries").select("*").eq("developer_id", data.id).order("started_at", { ascending: false }),
      supabaseAdmin.from("ratings").select("*"),
    ]);
    if (!profile) throw new Error("Developer not found");
    const orderIds = (orders ?? []).map((o) => o.id);
    const devRatings = (ratings ?? []).filter((r) => orderIds.includes(r.order_id));
    return { profile, orders: orders ?? [], timeEntries: time ?? [], ratings: devRatings };
  });

export const createDeveloper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { email: string; password: string; fullName?: string; phone?: string; hourlyRate?: number }) =>
    z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().max(120).optional(),
        phone: z.string().max(40).optional(),
        hourlyRate: z.number().min(0).max(10000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    let userId = existing?.id as string | undefined;
    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName },
      });
      if (createErr) throw new Error(createErr.message);
      userId = created.user!.id;
    } else {
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
      });
      if (updErr) throw new Error(updErr.message);
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName ?? null,
        phone: data.phone ?? null,
        hourly_rate: data.hourlyRate ?? null,
        is_active: true,
      })
      .eq("id", userId);

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "developer" as any })
      .then(() => {}, () => {});

    return { ok: true, userId };
  });

export const updateDeveloper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      id: string;
      fullName?: string;
      phone?: string;
      hourlyRate?: number | null;
      weeklyCapacityHours?: number;
      isActive?: boolean;
      skills?: string[];
    }) =>
      z
        .object({
          id: z.string().uuid(),
          fullName: z.string().max(120).optional(),
          phone: z.string().max(40).optional(),
          hourlyRate: z.number().min(0).max(10000).nullable().optional(),
          weeklyCapacityHours: z.number().int().min(0).max(168).optional(),
          isActive: z.boolean().optional(),
          skills: z.array(z.string().max(40)).max(30).optional(),
        })
        .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, any> = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.hourlyRate !== undefined) patch.hourly_rate = data.hourlyRate;
    if (data.weeklyCapacityHours !== undefined) patch.weekly_capacity_hours = data.weeklyCapacityHours;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.skills !== undefined) patch.skills = data.skills;
    const { error } = await supabaseAdmin.from("profiles").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeDeveloper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; hardDelete?: boolean }) =>
    z.object({ id: z.string().uuid(), hardDelete: z.boolean().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.hardDelete) {
      const { data: hasOrders } = await supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", data.id);
      if ((hasOrders as any)?.length) throw new Error("Cannot hard-delete: developer has assigned orders");
      await supabaseAdmin.auth.admin.deleteUser(data.id);
      return { ok: true, hardDeleted: true };
    }

    // Soft-disable: revoke role + mark inactive
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id).eq("role", "developer" as any);
    await supabaseAdmin.from("profiles").update({ is_active: false }).eq("id", data.id);
    return { ok: true };
  });

export const autoAssignOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { orderId: string; force?: boolean }) =>
    z.object({ orderId: z.string().uuid(), force: z.boolean().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current } = await supabaseAdmin
      .from("orders")
      .select("assigned_to")
      .eq("id", data.orderId)
      .maybeSingle();
    const previousAssignee = current?.assigned_to ?? null;

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "developer" as any);
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) throw new Error("No developers available");

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, is_active")
      .in("id", ids);
    const active = (profiles ?? []).filter((p) => p.is_active !== false).map((p) => p.id);
    if (active.length === 0) throw new Error("No active developers");

    const { data: openOrders } = await supabaseAdmin
      .from("orders")
      .select("assigned_to")
      .in("assigned_to", active)
      .in("status", OPEN as any);
    const counts = new Map(active.map((id) => [id, 0]));
    (openOrders ?? []).forEach((o) => {
      if (o.assigned_to) counts.set(o.assigned_to, (counts.get(o.assigned_to) || 0) + 1);
    });
    // Pick lowest-workload dev, excluding current assignee when force-reassigning.
    const candidates = [...counts.entries()].filter(
      ([id]) => !(previousAssignee && data.force && id === previousAssignee),
    );
    const pool = candidates.length > 0 ? candidates : [...counts.entries()];
    const [pick] = pool.sort((a, b) => a[1] - b[1]);
    const pickId = pick[0];

    if (pickId === previousAssignee) {
      return { ok: true, assignedTo: pickId, unchanged: true };
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ assigned_to: pickId })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("assignment_audit_log").insert({
      order_id: data.orderId,
      assigned_to: pickId,
      previous_assignee: previousAssignee,
      trigger_source: previousAssignee ? "manual_reassign" : "admin_backfill",
      reason: previousAssignee
        ? "Admin force auto-assigned via lowest-workload rule."
        : "Admin auto-assigned via lowest-workload rule.",
      candidate_count: active.length,
      active_project_count: counts.get(pickId) ?? 0,
      workload_snapshot: Object.fromEntries(counts) as any,
      initiated_by: context.userId,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: pickId,
      type: "assignment",
      title: "New project assigned",
      body: `Order ${data.orderId.slice(0, 8)} has been assigned to you.`,
      link: `/developer/orders/${data.orderId}`,
    });

    if (previousAssignee && previousAssignee !== pickId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: previousAssignee,
        type: "assignment",
        title: "Project reassigned",
        body: `Order ${data.orderId.slice(0, 8)} has been moved to another developer.`,
      });
    }

    return { ok: true, assignedTo: pickId };
  });

export const adminUpsertTimeEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      id?: string;
      developerId: string;
      orderId?: string | null;
      startedAt: string;
      endedAt?: string | null;
      minutes: number;
      note?: string;
    }) =>
      z
        .object({
          id: z.string().uuid().optional(),
          developerId: z.string().uuid(),
          orderId: z.string().uuid().nullable().optional(),
          startedAt: z.string(),
          endedAt: z.string().nullable().optional(),
          minutes: z.number().int().min(0).max(24 * 60 * 7),
          note: z.string().max(500).optional(),
        })
        .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      developer_id: data.developerId,
      order_id: data.orderId ?? null,
      started_at: data.startedAt,
      ended_at: data.endedAt ?? null,
      minutes: data.minutes,
      note: data.note ?? null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("time_entries").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("time_entries").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteTimeEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("time_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
