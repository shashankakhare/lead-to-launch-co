import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

const OPEN_STATUSES = ["paid", "requirements_pending", "in_progress", "review"];

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: orders }, { data: ratings }, { data: profiles }, { data: reqs }, { data: updates }] =
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("id, package, amount_usd, status, created_at, user_id, assigned_to")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("ratings").select("stars, review, created_at"),
        supabaseAdmin.from("profiles").select("id, email, full_name, created_at"),
        supabaseAdmin.from("project_requirements").select("order_id, submitted_at"),
        supabaseAdmin
          .from("project_updates")
          .select("id, order_id, stage, message, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paid = (orders ?? []).filter((o) => o.status !== "pending_payment" && o.status !== "cancelled");
    const totalRevenue = paid.reduce((s, o) => s + Number(o.amount_usd || 0), 0);
    const ordersThisMonth = (orders ?? []).filter((o) => new Date(o.created_at) >= monthStart).length;
    const active = (orders ?? []).filter((o) => OPEN_STATUSES.includes(o.status)).length;
    const pendingReqs = (orders ?? []).filter(
      (o) => o.status === "paid" || o.status === "requirements_pending",
    ).length;
    const unassignedPaid = (orders ?? []).filter(
      (o) => OPEN_STATUSES.includes(o.status) && !o.assigned_to,
    );
    const avgRating =
      (ratings ?? []).length > 0
        ? (ratings ?? []).reduce((s, r) => s + Number(r.stars || 0), 0) / (ratings ?? []).length
        : 0;

    // Revenue by week for last 12 weeks
    const weeks: { label: string; revenue: number; orders: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const inRange = paid.filter((o) => {
        const d = new Date(o.created_at);
        return d >= start && d < end;
      });
      weeks.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        revenue: inRange.reduce((s, o) => s + Number(o.amount_usd || 0), 0),
        orders: inRange.length,
      });
    }

    // Status distribution
    const statusMap: Record<string, number> = {};
    (orders ?? []).forEach((o) => (statusMap[o.status] = (statusMap[o.status] || 0) + 1));
    const statusDist = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Package mix
    const pkgMap: Record<string, number> = {};
    (orders ?? []).forEach((o) => (pkgMap[o.package] = (pkgMap[o.package] || 0) + 1));
    const packageMix = Object.entries(pkgMap).map(([name, value]) => ({ name, value }));

    // Signups per week (last 8)
    const signups: { label: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const c = (profiles ?? []).filter((p) => {
        const d = new Date(p.created_at);
        return d >= start && d < end;
      }).length;
      signups.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, count: c });
    }

    const clientMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const recentOrders = (orders ?? []).slice(0, 8).map((o) => ({
      ...o,
      client: clientMap.get(o.user_id) ?? null,
    }));

    return {
      kpi: {
        totalRevenue,
        ordersThisMonth,
        active,
        pendingReqs,
        avgRating,
        totalOrders: (orders ?? []).length,
        totalClients: (profiles ?? []).length,
      },
      charts: { weeks, statusDist, packageMix, signups },
      recentOrders,
      recentUpdates: updates ?? [],
      alerts: {
        unassignedPaidCount: unassignedPaid.length,
        pendingReqsCount: pendingReqs,
      },
    };
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: orders }, { data: ratings }, { data: time }, { data: roles }, { data: profiles }] =
      await Promise.all([
        supabaseAdmin.from("orders").select("*"),
        supabaseAdmin.from("ratings").select("*"),
        supabaseAdmin.from("time_entries").select("*"),
        supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "developer" as any),
        supabaseAdmin.from("profiles").select("id, email, full_name"),
      ]);

    const devIds = new Set((roles ?? []).map((r) => r.user_id));
    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Funnel
    const funnel = {
      created: (orders ?? []).length,
      paid: (orders ?? []).filter((o) => o.status !== "pending_payment" && o.status !== "cancelled").length,
      in_progress: (orders ?? []).filter((o) => ["in_progress", "review"].includes(o.status)).length,
      delivered: (orders ?? []).filter((o) => o.status === "delivered").length,
    };

    // Developer performance
    const devPerf = Array.from(devIds).map((id) => {
      const assigned = (orders ?? []).filter((o) => o.assigned_to === id);
      const delivered = assigned.filter((o) => o.status === "delivered");
      const devRatings = (ratings ?? []).filter((r) =>
        assigned.some((o) => o.id === r.order_id),
      );
      const avgStars =
        devRatings.length > 0
          ? devRatings.reduce((s, r) => s + Number(r.stars || 0), 0) / devRatings.length
          : 0;
      const mins = (time ?? [])
        .filter((t) => t.developer_id === id)
        .reduce((s, t) => s + (t.minutes || 0), 0);
      const deliveryDays = delivered
        .map((o) => {
          const created = new Date(o.created_at).getTime();
          const upd = new Date(o.updated_at).getTime();
          return (upd - created) / (1000 * 60 * 60 * 24);
        })
        .filter((n) => n > 0);
      const avgDelivery =
        deliveryDays.length > 0 ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length : 0;
      const p = profMap.get(id);
      return {
        id,
        name: p?.full_name || p?.email || id.slice(0, 8),
        email: p?.email,
        assignedCount: assigned.length,
        deliveredCount: delivered.length,
        avgRating: avgStars,
        hours: Math.round((mins / 60) * 10) / 10,
        avgDeliveryDays: Math.round(avgDelivery * 10) / 10,
      };
    });

    // Revenue by package
    const paidOrders = (orders ?? []).filter(
      (o) => o.status !== "pending_payment" && o.status !== "cancelled",
    );
    const revenueByPackage: Record<string, number> = {};
    paidOrders.forEach((o) => {
      revenueByPackage[o.package] = (revenueByPackage[o.package] || 0) + Number(o.amount_usd || 0);
    });

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map((s) => ({
      stars: s,
      count: (ratings ?? []).filter((r) => Number(r.stars) === s).length,
    }));

    // Time per developer per week (last 8 weeks)
    const now = new Date();
    const weeks: { label: string; start: Date; end: Date }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      weeks.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, start, end });
    }
    const timeSeries = weeks.map((w) => {
      const mins = (time ?? [])
        .filter((t) => {
          const d = new Date(t.started_at);
          return d >= w.start && d < w.end;
        })
        .reduce((s, t) => s + (t.minutes || 0), 0);
      return { label: w.label, hours: Math.round((mins / 60) * 10) / 10 };
    });

    return {
      funnel,
      devPerf,
      revenueByPackage,
      ratingDist,
      timeSeries,
      totalRevenue: paidOrders.reduce((s, o) => s + Number(o.amount_usd || 0), 0),
      recentRatings: (ratings ?? [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
    };
  });
