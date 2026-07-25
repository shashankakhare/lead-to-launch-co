import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — buildingwebsitenow.com" },
      {
        name: "description",
        content:
          "Terms and conditions for using buildingwebsitenow.com, a WordPress website development service by Icon Computers, Nagpur.",
      },
      { property: "og:title", content: "Terms & Conditions — buildingwebsitenow.com" },
      {
        property: "og:description",
        content:
          "The terms governing your use of buildingwebsitenow.com and the WordPress website development services we deliver.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
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

function TermsPage() {
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
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </Reveal>

        <div className="mt-12 space-y-10 text-muted-foreground">
          <Section title="Agreement">
            <p>
              These Terms &amp; Conditions ("Terms") govern your use of{" "}
              <span className="text-foreground font-medium">buildingwebsitenow.com</span> and the
              WordPress website development services provided by{" "}
              <span className="text-foreground font-medium">Icon Computers, Nagpur, India</span>{" "}
              ("we", "us", "our"). By creating an account, purchasing a package, or using the
              service, you agree to these Terms.
            </p>
          </Section>

          <Section title="Services">
            <p>
              We build business and portfolio WordPress websites in 1-page, 5-page, and 10-page
              packages. We do not build e-commerce stores. Each package includes design, build,
              content placement based on the assets you provide, basic on-page SEO, and handover
              of full admin credentials. Specific scope, deliverables, and revision counts are
              listed on the package you purchase.
            </p>
          </Section>

          <Section title="Timelines">
            <p>
              We target delivery within 4 working days of receiving your complete project intake
              (answers, brand assets, images, and copy). Delays in providing requirements,
              feedback, or approvals will extend the delivery timeline by an equal amount.
            </p>
          </Section>

          <Section title="Payments">
            <p>
              Payment is due upfront through Cashfree in the currency displayed at checkout. Work
              begins after successful payment and receipt of your project requirements. All fees
              are stated exclusive of applicable taxes, which will be added where required.
            </p>
          </Section>

          <Section title="Client responsibilities">
            <p>You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Providing accurate project requirements, brand assets, logo, images, and copy.</li>
              <li>
                Having the legal right to use every asset you upload — including images,
                trademarks, fonts, and text.
              </li>
              <li>Reviewing revisions and providing consolidated feedback within the timelines noted in your package.</li>
              <li>Arranging your own hosting and domain unless we have agreed otherwise in writing.</li>
              <li>Safeguarding admin credentials after handover.</li>
            </ul>
          </Section>

          <Section title="Revisions and approval">
            <p>
              Each package includes a defined number of revision rounds. Additional revisions or
              scope changes can be requested as paid add-ons. Once you mark a project as approved,
              or fail to respond to a revision request within 14 days of delivery, the project is
              considered accepted and closed.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              On full payment, ownership of the final website design, content we produce, and
              custom code is transferred to you. Third-party plugins, themes, fonts, and stock
              assets remain governed by their own licenses. We retain the right to reference the
              project in our portfolio and marketing unless you request otherwise in writing.
            </p>
          </Section>

          <Section title="Warranties and support">
            <p>
              We warrant that the delivered website will match the agreed scope on the day of
              handover. Post-launch support is limited to what your package includes. We do not
              warrant uninterrupted availability, third-party plugin behavior, or search engine
              rankings.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, our total liability for any claim relating
              to the service is limited to the amount you paid for the specific package in
              question. We are not liable for indirect, incidental, or consequential losses,
              including lost profits, lost data, or business interruption.
            </p>
          </Section>

          <Section title="Refunds">
            <p>
              Refund eligibility, timing, and amounts are governed by our{" "}
              <Link to="/refund-policy" className="text-accent font-medium hover:underline">
                Refund Policy
              </Link>
              , which forms part of these Terms.
            </p>
          </Section>

          <Section title="Prohibited use">
            <p>
              You agree not to use the service for content that is unlawful, infringing, hateful,
              adult, gambling-related, or that violates any third-party rights. We may suspend or
              cancel a project without refund if you breach this section.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              Either party may terminate an engagement in writing for material breach that is not
              cured within 7 days of notice. On termination, you will be invoiced for work
              completed to date, and we will hand over deliverables in their then-current state.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These Terms are governed by the laws of India. Any dispute will be subject to the
              exclusive jurisdiction of the courts of Nagpur, Maharashtra.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these Terms from time to time. Material changes will be posted on
              this page with an updated revision date and will apply to orders placed after that
              date.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              These Terms are maintained by Icon Computers, Nagpur. For questions, email{" "}
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
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">
              Refund Policy
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
