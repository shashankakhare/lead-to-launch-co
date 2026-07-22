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
          const { completePaidOrder } = await import("@/lib/payments.server");
          await completePaidOrder(orderId, cfPaymentId ? String(cfPaymentId) : null);
        }
        return new Response("ok");
      },
    },
  },
});
