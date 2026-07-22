// Loads the Cashfree v3 hosted checkout SDK on demand.
type CashfreeCheckoutOptions = { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_modal" };
type CashfreeInstance = { checkout: (opts: CashfreeCheckoutOptions) => Promise<unknown> };
type CashfreeFactory = (opts: { mode: "sandbox" | "production" }) => CashfreeInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

let loadingPromise: Promise<void> | null = null;

export async function loadCashfree(mode: "sandbox" | "production"): Promise<CashfreeInstance> {
  if (typeof window === "undefined") throw new Error("Cashfree SDK requires a browser");
  if (!window.Cashfree) {
    loadingPromise ??= new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
      document.head.appendChild(s);
    });
    await loadingPromise;
  }
  if (!window.Cashfree) throw new Error("Cashfree SDK unavailable");
  return window.Cashfree({ mode });
}

export async function openCashfreeCheckout(opts: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
  redirectTarget?: "_self" | "_blank" | "_modal";
}) {
  const cf = await loadCashfree(opts.mode);
  return cf.checkout({
    paymentSessionId: opts.paymentSessionId,
    redirectTarget: opts.redirectTarget ?? "_modal",
  });
}

