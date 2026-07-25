import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — buildingwebsitenow.com" },
      {
        name: "description",
        content:
          "Refund terms for buildingwebsitenow.com WordPress website packages, operated by Icon Computers Nagpur. Conditions, eligibility, and how to request a refund.",
      },
      { property: "og:title", content: "Refund Policy — buildingwebsitenow.com" },
      {
        property: "og:description",
        content:
          "Refund terms for our 1-page, 5-page, and 10-page WordPress website packages — eligibility and how to request a refund.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RefundPage,
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function RefundPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-extrabold tracking-tighter text-xl">
            BUILDING<span className="text-accent">.</span>
          </a>
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back home
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-20 sm:py-28">
        <Reveal>
          <span className="text-accent font-bold text-xs tracking-[0.2em] uppercase">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-3 mb-4">
            Refund Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </Reveal>

        <div className="mt-12 space-y-10 text-muted-foreground">
          <Section title="Overview">
            <p>
              <span className="text-foreground font-medium">buildingwebsitenow.com</span>, operated
              by <span className="text-foreground font-medium">Icon Computers, Nagpur</span>,
              builds custom WordPress business and portfolio websites and delivers them within 4
              days. Because our work is a tailored, time-bound service, refund eligibility depends
              on how far your project has progressed.
            </p>
            <p>
              This policy applies to our three packages —{" "}
              <span className="text-foreground font-medium">The Solo (1-page, $299)</span>,{" "}
              <span className="text-foreground font-medium">The Business (5-page, $799)</span>, and{" "}
              <span className="text-foreground font-medium">The Growth (10-page, $1,499)</span> —
              and to any approved add-ons.
            </p>
          </Section>

          <Section title="Refund eligibility">
            <p>Your eligibility for a refund depends on the project stage:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="text-foreground font-medium">Before the brief is approved</span>{" "}
                (Day 1): You may request a full refund minus non-refundable payment gateway fees.
              </li>
              <li>
                <span className="text-foreground font-medium">After brief approval, before design
                approval</span> (Day 2): You may request a 50% refund of the package price.
              </li>
              <li>
                <span className="text-foreground font-medium">After design approval / build has
                started</span> (Day 3+): Refunds are issued at our discretion based on milestones
                already completed, and will reflect the work performed up to that point.
              </li>
              <li>
                <span className="text-foreground font-medium">After launch and handover</span>: The
                project is non-refundable, as the finished website and full ownership have been
                delivered to you.
              </li>
            </ul>
          </Section>

          <Section title="Non-refundable items">
            <p>The following are not eligible for refund:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Third-party costs we incur on your behalf, such as domain or hosting fees already paid.</li>
              <li>Add-on services that have already been delivered or are in progress.</li>
              <li>Any refund requested more than 30 days after payment.</li>
            </ul>
          </Section>

          <Section title="How to request a refund">
            <p>
              To request a refund, email{" "}
              <a
                href="mailto:info@digitaldreamsinc.in"
                className="text-accent font-medium hover:underline"
              >
                info@digitaldreamsinc.in
              </a>{" "}
              with your order ID and the reason for your request. We will review it within 3
              business days and confirm your eligibility based on the project stage above.
            </p>
          </Section>

          <Section title="Processing time">
            <p>
              Approved refunds are returned to your original payment method within 7–10 business
              days. Payment gateway processing fees are non-refundable and may be deducted from the
              refunded amount.
            </p>
          </Section>

          <Section title="Chargebacks">
            <p>
              Please contact us before initiating a chargeback with your bank or card issuer. Most
              concerns can be resolved directly and far more quickly, and unwarranted chargebacks
              may affect your account standing.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              This Refund Policy is maintained by Icon Computers, Nagpur. For any questions, email{" "}
              <a
                href="mailto:info@digitaldreamsinc.in"
                className="text-accent font-medium hover:underline"
              >
                info@digitaldreamsinc.in
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} buildingwebsitenow.com — All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
