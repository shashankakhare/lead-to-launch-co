// Server-only Cashfree API helper. Never import from client code.
const API_VERSION = "2023-08-01";

function creds() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) throw new Error("Cashfree credentials are not configured");
  const isSandbox = appId.startsWith("TEST");
  const baseUrl = isSandbox ? "https://sandbox.cashfree.com/pg" : "https://api.cashfree.com/pg";
  return { appId, secret, baseUrl, isSandbox };
}

// Mock mode: enabled explicitly via env, or auto-detected when the secret is
// still a placeholder (contains 'xxx'). Lets the full checkout flow be tested
// end-to-end without a working Cashfree account.
export function isMockPayments(): boolean {
  if (process.env.PAYMENTS_MOCK === "true") return true;
  const secret = process.env.CASHFREE_SECRET_KEY ?? "";
  return secret.length === 0 || /x{4,}/i.test(secret);
}

export function cashfreeMode(): "sandbox" | "production" | "mock" {
  if (isMockPayments()) return "mock";
  return creds().isSandbox ? "sandbox" : "production";
}

export function isPaymentTestMode(): boolean {
  // Current launch/testing phase: let every checkout complete inside the app
  // without waiting on Cashfree credentials, hosted checkout, or webhooks.
  if (process.env.PAYMENTS_LIVE !== "true") return true;
  if (isMockPayments()) return true;
  try {
    return creds().isSandbox;
  } catch {
    return true;
  }
}

export function isCashfreePaidStatus(status?: string | null): boolean {
  const normalized = status?.toUpperCase();
  return normalized === "PAID" || normalized === "SUCCESS";
}


export type CreateOrderInput = {
  orderId: string;
  amount: number;
  currency: string;
  customer: { id: string; email: string; phone: string; name?: string };
  returnUrl: string;
  notifyUrl: string;
};

export async function createCashfreeOrder(input: CreateOrderInput) {
  const { appId, secret, baseUrl } = creds();
  const res = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secret,
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: input.currency,
      customer_details: {
        customer_id: input.customer.id,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone || "0000000000",
        customer_name: input.customer.name || undefined,
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
    }),
  });
  const json = (await res.json()) as {
    payment_session_id?: string;
    order_id?: string;
    message?: string;
    code?: string;
  };
  if (!res.ok || !json.payment_session_id) {
    throw new Error(`Cashfree order failed: ${json.message ?? res.statusText}`);
  }
  return { paymentSessionId: json.payment_session_id, orderId: json.order_id ?? input.orderId };
}

export async function fetchCashfreeOrder(orderId: string) {
  const { appId, secret, baseUrl } = creds();
  const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secret,
    },
  });
  const json = (await res.json()) as {
    order_status?: string;
    payment_status?: string;
    order_id?: string;
    cf_order_id?: string | number;
    message?: string;
  };
  if (!res.ok) throw new Error(`Cashfree fetch failed: ${json.message ?? res.statusText}`);
  return json;
}

export async function verifyCashfreeWebhook(
  rawBody: string,
  signature: string,
  timestamp: string,
): Promise<boolean> {
  const { secret } = creds();
  const data = timestamp + rawBody;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}
