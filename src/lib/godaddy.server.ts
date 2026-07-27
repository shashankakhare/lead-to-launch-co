// Server-only GoDaddy Domains API helper.
// Docs: https://developer.godaddy.com/doc/endpoint/domains

const DEFAULT_TLDS = [".com", ".in", ".co", ".net", ".org", ".co.in"];

function baseUrl() {
  const env = (process.env.GODADDY_ENV ?? "OTE").toUpperCase();
  return env === "PROD" ? "https://api.godaddy.com" : "https://api.ote-godaddy.com";
}

function authHeader() {
  const key = process.env.GODADDY_API_KEY;
  const secret = process.env.GODADDY_API_SECRET;
  if (!key || !secret) throw new Error("GoDaddy API credentials not configured");
  return `sso-key ${key}:${secret}`;
}

export type DomainAvailability = {
  domain: string;
  available: boolean;
  priceInr: number | null; // best-effort in INR (GoDaddy returns micros of listed currency)
  currency: string;
  period: number; // years
};

/**
 * Check availability + price for one domain.
 * GoDaddy `price` is expressed in micros of the returned currency (1 USD = 1,000,000).
 */
export async function checkDomain(domain: string): Promise<DomainAvailability> {
  // FULL check returns price + currency; FAST only returns availability, which
  // leaves the UI unable to charge for the domain (Buy button stays disabled).
  const url = `${baseUrl()}/v1/domains/available?domain=${encodeURIComponent(domain)}&checkType=FULL&forTransfer=false`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GoDaddy [${res.status}] ${text}`);
  }
  const body = (await res.json()) as {
    available: boolean;
    domain: string;
    price?: number;
    currency?: string;
    period?: number;
  };

  const currency = body.currency ?? "USD";
  const raw = typeof body.price === "number" ? body.price / 1_000_000 : null;
  const priceInr = raw == null ? null : Math.round(raw * (currency === "INR" ? 1 : Number(process.env.USD_TO_INR_RATE ?? 86)));

  return {
    domain: body.domain ?? domain,
    available: Boolean(body.available),
    priceInr,
    currency: "INR",
    period: body.period ?? 1,
  };
}

/**
 * Given a base name (e.g. "myclinic"), check availability across common TLDs.
 * Ignores individual errors so one bad TLD does not break the whole search.
 */
export async function searchAcrossTlds(baseName: string, tlds: string[] = DEFAULT_TLDS): Promise<DomainAvailability[]> {
  const clean = baseName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean) return [];
  const domains = tlds.map((t) => `${clean}${t.startsWith(".") ? t : `.${t}`}`);
  const results = await Promise.allSettled(domains.map((d) => checkDomain(d)));
  return results
    .map((r, i) => (r.status === "fulfilled" ? r.value : { domain: domains[i], available: false, priceInr: null, currency: "INR", period: 1 }))
    .sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
}
