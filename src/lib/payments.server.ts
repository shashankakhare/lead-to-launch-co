import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PaymentCompletion = {
  status: string;
  projectOrderId: string;
  isAddon: boolean;
};

export async function getPaymentTarget(orderId: string): Promise<Pick<PaymentCompletion, "projectOrderId" | "isAddon">> {
  const { data: addon } = await supabaseAdmin
    .from("scope_addons")
    .select("order_id")
    .eq("invoice_order_id", orderId)
    .maybeSingle();

  return {
    projectOrderId: addon?.order_id ?? orderId,
    isAddon: Boolean(addon),
  };
}

export async function completePaidOrder(orderId: string, paymentId?: string | null): Promise<PaymentCompletion> {
  const target = await getPaymentTarget(orderId);

  const orderPatch: { status: "paid" | "requirements_pending"; cashfree_payment_id?: string } = {
    status: target.isAddon ? "paid" : "requirements_pending",
  };

  const { error: orderError } = await supabaseAdmin
    .from("orders")
    .update(paymentId ? { ...orderPatch, cashfree_payment_id: paymentId } : orderPatch)
    .eq("id", orderId);
  if (orderError) throw new Error(orderError.message);

  if (target.isAddon) {
    const { error: addonError } = await supabaseAdmin
      .from("scope_addons")
      .update({ status: "paid" })
      .eq("invoice_order_id", orderId);
    if (addonError) throw new Error(addonError.message);

    return { status: "paid", projectOrderId: target.projectOrderId, isAddon: true };
  }

  const { error: reqError } = await supabaseAdmin
    .from("project_requirements")
    .upsert({ order_id: orderId }, { onConflict: "order_id" });
  if (reqError) throw new Error(reqError.message);

  await autoAssignOrderToDeveloper(orderId);

  return { status: "requirements_pending", projectOrderId: orderId, isAddon: false };
}

const ACTIVE_STATUSES = [
  "requirements_pending",
  "in_progress",
  "review",
  "paid",
] as const;

/**
 * Auto-assign an order to the developer with the fewest active projects.
 * No-op if the order already has an assignee or no developers exist.
 */
export async function autoAssignOrderToDeveloper(orderId: string): Promise<string | null> {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, assigned_to")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.assigned_to) return order?.assigned_to ?? null;

  const { data: devs } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "developer");
  const devIds = (devs ?? []).map((d) => d.user_id as string);
  if (devIds.length === 0) return null;

  const { data: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("assigned_to")
    .in("assigned_to", devIds)
    .in("status", ACTIVE_STATUSES);

  const counts = new Map<string, number>(devIds.map((id) => [id, 0]));
  for (const row of activeOrders ?? []) {
    if (row.assigned_to) counts.set(row.assigned_to, (counts.get(row.assigned_to) ?? 0) + 1);
  }

  let pick = devIds[0];
  let min = counts.get(pick) ?? Number.POSITIVE_INFINITY;
  for (const id of devIds) {
    const c = counts.get(id) ?? 0;
    if (c < min) {
      min = c;
      pick = id;
    }
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ assigned_to: pick })
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: pick,
    type: "assignment",
    title: "New project assigned",
    body: `Order ${orderId.slice(0, 8)} has been auto-assigned to you.`,
  });

  return pick;
}
