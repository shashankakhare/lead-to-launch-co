export type PackageSlug = "one_page" | "five_page" | "ten_page";

/**
 * Prices are in INR (Indian Rupees). The field is named `priceUsd` for
 * historical reasons — the DB column `amount_usd` also stores the INR amount.
 * Cashfree charges the same value directly in INR.
 */
export const PACKAGES: Record<
  PackageSlug,
  { slug: PackageSlug; name: string; pages: string; priceUsd: number; tagline: string; features: string[] }
> = {
  one_page: {
    slug: "one_page",
    name: "Starter",
    pages: "1 page",
    priceUsd: 24999,
    tagline: "Perfect landing page",
    features: [
      "Single-page WordPress site",
      "Home, About Us / About Dr, Contact Us",
      "WhatsApp appointment button",
      "Location / address block with Google Maps",
      "List of services offered",
      "Mobile responsive · Basic SEO",
      "Live in 4 days",
    ],
  },

  five_page: {
    slug: "five_page",
    name: "Business",
    pages: "5 pages",
    priceUsd: 64999,
    tagline: "Most popular",
    features: [
      "5-page WordPress site",
      "Custom design",
      "Mobile responsive",
      "Contact & inquiry forms",
      "On-page SEO",
      "Google Analytics",
      "Full source handover",
    ],
  },
  ten_page: {
    slug: "ten_page",
    name: "Portfolio+",
    pages: "10 pages",
    priceUsd: 124999,
    tagline: "For agencies & studios",
    features: [
      "10-page WordPress site",
      "Premium custom design",
      "Portfolio / services modules",
      "Blog setup",
      "Advanced SEO",
      "Speed optimization",
      "30-day support",
    ],
  },
};

export function getPackage(slug: string): (typeof PACKAGES)[PackageSlug] | null {
  return (PACKAGES as Record<string, (typeof PACKAGES)[PackageSlug]>)[slug] ?? null;
}

export type ScopeAddonKind = "extra_page" | "extra_revision" | "rush" | "custom";

export const SCOPE_ADDONS: Record<
  Exclude<ScopeAddonKind, "custom">,
  { kind: ScopeAddonKind; title: string; description: string; priceUsd: number }
> = {
  extra_page: {
    kind: "extra_page",
    title: "Extra page",
    description: "Add one more designed & developed page to your site.",
    priceUsd: 2000,
  },

  extra_revision: {
    kind: "extra_revision",
    title: "Extra revision round",
    description: "One additional round of design/content revisions.",
    priceUsd: 3999,
  },
  rush: {
    kind: "rush",
    title: "Rush 2-day delivery",
    description: "Fast-track your build to 2 days instead of 4.",
    priceUsd: 15999,
  },
};

/** Format an INR amount using Indian numbering (e.g. ₹24,999). */
export function formatInr(amount: number | string): string {
  const n = typeof amount === "number" ? amount : Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  }
}
