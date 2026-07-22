export type PackageSlug = "one_page" | "five_page" | "ten_page";

export const PACKAGES: Record<
  PackageSlug,
  { slug: PackageSlug; name: string; pages: string; priceUsd: number; tagline: string; features: string[] }
> = {
  one_page: {
    slug: "one_page",
    name: "Starter",
    pages: "1 page",
    priceUsd: 299,
    tagline: "Perfect landing page",
    features: [
      "1-page WordPress site",
      "Custom design",
      "Mobile responsive",
      "Contact form",
      "Basic SEO",
      "Live in 4 days",
    ],
  },
  five_page: {
    slug: "five_page",
    name: "Business",
    pages: "5 pages",
    priceUsd: 799,
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
    priceUsd: 1499,
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
