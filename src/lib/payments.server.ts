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

  return { status: "requirements_pending", projectOrderId: orderId, isAddon: false };
}
