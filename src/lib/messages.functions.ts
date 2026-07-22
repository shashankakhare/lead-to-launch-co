import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: orders } = await supabase
      .from("orders")
      .select("id, package, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!orders || orders.length === 0) return [];
    const ids = orders.map((o) => o.id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, order_id, body, created_at, sender_id, read_at")
      .in("order_id", ids)
      .order("created_at", { ascending: false });
    const byOrder = new Map<string, { last?: string; lastAt?: string; unread: number }>();
    for (const m of msgs ?? []) {
      const cur = byOrder.get(m.order_id) ?? { unread: 0 };
      if (!cur.last) {
        cur.last = m.body;
        cur.lastAt = m.created_at;
      }
      if (!m.read_at && m.sender_id !== userId) cur.unread += 1;
      byOrder.set(m.order_id, cur);
    }
    return orders.map((o) => ({
      orderId: o.id,
      package: o.package,
      status: o.status,
      lastMessage: byOrder.get(o.id)?.last ?? null,
      lastAt: byOrder.get(o.id)?.lastAt ?? null,
      unread: byOrder.get(o.id)?.unread ?? 0,
    }));
  });

export const listThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: msgs, error } = await context.supabase
      .from("messages")
      .select("id, sender_id, sender_role, body, attachments, created_at, read_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; body: string }) =>
    z.object({ orderId: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    const { error } = await supabase.from("messages").insert({
      order_id: data.orderId,
      sender_id: userId,
      sender_role: isAdmin ? "admin" : "client",
      body: data.body,
    });
    if (error) throw new Error(error.message);
    // Notify the other party
    const { data: order } = await supabase
      .from("orders")
      .select("user_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (order) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const recipientId = isAdmin ? order.user_id : null; // client -> notify admins handled separately if needed
      if (recipientId && recipientId !== userId) {
        await supabaseAdmin.from("notifications").insert({
          user_id: recipientId,
          type: "message",
          title: "New message from your developer",
          body: data.body.slice(0, 140),
          order_id: data.orderId,
          link: `/messages/${data.orderId}`,
        });
      }
    }
    return { ok: true };
  });

export const markThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("order_id", data.orderId)
      .neq("sender_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });
