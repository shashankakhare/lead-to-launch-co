import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/cashfree")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-webhook-signature") ?? "";
        const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

        const { verifyCashfreeWebhook } = await import("@/lib/cashfree.server");
        const ok = await verifyCashfreeWebhook(rawBody, signature, timestamp);
        if (!ok) return new Response("Invalid signature", { status: 401 });

        const payload = JSON.parse(rawBody) as {
          type?: string;
          data?: {
            order?: { order_id?: string };
            payment?: { payment_status?: string; cf_payment_id?: string | number };
          };
        };
        const orderId = payload.data?.order?.order_id;
        const paymentStatus = payload.data?.payment?.payment_status;
        const cfPaymentId = payload.data?.payment?.cf_payment_id;

        if (orderId && paymentStatus === "SUCCESS") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin
            .from("orders")
            .update({
              status: "requirements_pending",
              cashfree_payment_id: cfPaymentId ? String(cfPaymentId) : null,
            })
            .eq("id", orderId)
            .eq("status", "pending_payment");
          await supabaseAdmin
            .from("project_requirements")
            .upsert({ order_id: orderId }, { onConflict: "order_id" });
        }
        return new Response("ok");
      },
    },
  },
});
