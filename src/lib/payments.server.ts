import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { PACKAGES, type PackageSlug } from "@/lib/packages";

export async function notifyPaymentStatus(
  orderId: string,
  status: "paid" | "failed",
): Promise<void> {
  try {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, package, amount_usd, amount_charged, currency")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .maybeSingle();

    const email = profile?.email;
    if (!email) return;

    const pkg = PACKAGES[order.package as PackageSlug];
    const packageLabel = pkg ? `${pkg.name} — ${pkg.pages}` : String(order.package);
    const amount = order.currency === "USD"
      ? `$${order.amount_usd} USD`
      : `${order.currency} ${order.amount_charged} (≈ $${order.amount_usd} USD)`;

    const result = await sendTemplateEmail("payment-status", email, {
      idempotencyKey: `payment-status-${status}-${orderId}`,
      templateData: {
        name: profile?.full_name ?? undefined,
        orderId: orderId.slice(0, 8),
        packageLabel,
        amount,
        status,
        nextStepUrl: "https://eazybuildwebsite.com/dashboard",
      },
    });
    if (!result.sent) {
      console.warn(`[payment-status] not sent (${result.reason}) for order ${orderId}`);
    }
  } catch (err) {
    console.error(`[payment-status] failed to send for order ${orderId}`, err);
  }
}


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

    await notifyPaymentStatus(orderId, "paid");
    return { status: "paid", projectOrderId: target.projectOrderId, isAddon: true };
  }

  const { error: reqError } = await supabaseAdmin
    .from("project_requirements")
    .upsert({ order_id: orderId }, { onConflict: "order_id" });
  if (reqError) throw new Error(reqError.message);

  await autoAssignOrderToDeveloper(orderId);
  await notifyPaymentStatus(orderId, "paid");

  return { status: "requirements_pending", projectOrderId: orderId, isAddon: false };
}

const ACTIVE_STATUSES = [
  "requirements_pending",
  "in_progress",
  "review",
  "paid",
] as const;

export type AssignmentTrigger =
  | "payment_completed"
  | "manual_reassign"
  | "admin_backfill"
  | "requirements_submitted";

type AutoAssignOptions = {
  trigger?: AssignmentTrigger;
  initiatedBy?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Auto-assign an order to the developer with the fewest active projects.
 * Records an audit log entry describing what triggered the assignment,
 * the workload snapshot at decision time, and who initiated it.
 * No-op if the order already has an assignee or no developers exist.
 */
export async function autoAssignOrderToDeveloper(
  orderId: string,
  options: AutoAssignOptions = {},
): Promise<string | null> {
  const trigger = options.trigger ?? "payment_completed";
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, assigned_to")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const previousAssignee = order.assigned_to ?? null;

  if (previousAssignee) {
    await supabaseAdmin.from("assignment_audit_log").insert({
      order_id: orderId,
      assigned_to: previousAssignee,
      previous_assignee: previousAssignee,
      trigger_source: trigger,
      reason: options.reason ?? "Order already had an assignee; auto-assignment skipped.",
      initiated_by: options.initiatedBy ?? null,
      metadata: { skipped: true, ...(options.metadata ?? {}) } as any,
    });
    return previousAssignee;
  }

  const { data: devs } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "developer");
  const devIds = (devs ?? []).map((d) => d.user_id as string);

  if (devIds.length === 0) {
    await supabaseAdmin.from("assignment_audit_log").insert({
      order_id: orderId,
      assigned_to: null,
      previous_assignee: null,
      trigger_source: trigger,
      reason: "No developers available to receive assignment.",
      candidate_count: 0,
      initiated_by: options.initiatedBy ?? null,
      metadata: (options.metadata ?? null) as any,
    });
    return null;
  }

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

  const workloadSnapshot = Object.fromEntries(counts);
  const pickedCount = counts.get(pick) ?? 0;

  await supabaseAdmin.from("assignment_audit_log").insert({
    order_id: orderId,
    assigned_to: pick,
    previous_assignee: null,
    trigger_source: trigger,
    reason:
      options.reason ??
      `Auto-assigned via lowest-workload rule (${pickedCount} active project${pickedCount === 1 ? "" : "s"} out of ${devIds.length} developer${devIds.length === 1 ? "" : "s"}).`,
    candidate_count: devIds.length,
    active_project_count: pickedCount,
    workload_snapshot: workloadSnapshot,
    initiated_by: options.initiatedBy ?? null,
    metadata: (options.metadata ?? null) as any,
  });

  await supabaseAdmin.from("notifications").insert({
    user_id: pick,
    type: "assignment",
    title: "New project assigned",
    body: `Order ${orderId.slice(0, 8)} has been auto-assigned to you.`,
  });

  return pick;
}
