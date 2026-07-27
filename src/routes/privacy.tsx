import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — eazybuildwebsite.com" },
      {
        name: "description",
        content:
          "How eazybuildwebsite.com, a service of Icon Computers Nagpur, collects, uses, and protects your data when you order a WordPress website.",
      },
      { property: "og:title", content: "Privacy Policy — eazybuildwebsite.com" },
      {
        property: "og:description",
        content:
          "How eazybuildwebsite.com collects, uses, and protects your data when you order a WordPress website.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
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

function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </Reveal>

        <div className="mt-12 space-y-10 text-muted-foreground">
          <Section title="Who we are">
            <p>
              <span className="text-foreground font-medium">eazybuildwebsite.com</span> is a
              WordPress website development service operated by{" "}
              <span className="text-foreground font-medium">
                Icon Computers, Nagpur, India
              </span>{" "}
              ("we", "us", or "our"). We build business and portfolio websites for clients in the
              US and UK and deliver them within 4 days. This policy explains what information we
              collect, how we use it, and the choices you have.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>To deliver your project, we collect and process the following:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="text-foreground font-medium">Account details</span> — your name,
                email address, and a securely hashed password created during sign-up or Google /
                Apple sign-in.
              </li>
              <li>
                <span className="text-foreground font-medium">Project requirements</span> — the
                intake questionnaire answers you submit (pages, style, color, references) and any
                files you upload (logo, brand assets, images, copy).
              </li>
              <li>
                <span className="text-foreground font-medium">Communications</span> — messages
                exchanged with your assigned developer, project status updates, and reviews you
                submit.
              </li>
              <li>
                <span className="text-foreground font-medium">Billing details</span> — order and
                package information processed by our payment partner, Cashfree. We never store your
                full card number or CVV.
              </li>
              <li>
                <span className="text-foreground font-medium">Technical data</span> — basic device
                and usage information collected through cookies and analytics to keep the site
                secure and improve performance.
              </li>
            </ul>
          </Section>

          <Section title="How we use your information">
            <p>We use your data to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Build, deliver, and hand over your WordPress website.</li>
              <li>Process your payment through Cashfree and generate invoices.</li>
              <li>Assign your project to a developer and coordinate revisions.</li>
              <li>Send you project updates, notifications, and support responses.</li>
              <li>Prevent fraud, abuse, and unauthorized access to accounts.</li>
            </ul>
            <p>We never sell your personal data to third parties.</p>
          </Section>

          <Section title="How we share your information">
            <p>
              We share information only on a need-to-know basis to deliver your project:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Your assigned developer receives access to your intake answers and uploaded
                assets so they can build your site.
              </li>
              <li>
                Cashfree processes your payment in line with its own privacy and security
                standards.
              </li>
              <li>
                When we hand over the finished site, we share credentials with you and, where you
                request, with your chosen hosting provider.
              </li>
            </ul>
            <p>
              We may disclose information when required by law or to protect our rights, our
              clients, or the public.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep your project data while your website is being built and during any
              post-launch support period included in your package. After that, you may request
              deletion of your files and account data at any time. We retain billing records as
              needed to meet legal and tax obligations in India.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We apply reasonable technical and organizational measures — including
              role-based access control and encrypted storage of credentials — to protect your
              data. However, no method of transmission or storage is completely secure, and we
              cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="Cookies and analytics">
            <p>
              We use essential cookies to keep you logged in and the site functioning, and
              optional analytics to understand usage. You can disable non-essential cookies in
              your browser settings without affecting core functionality.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can access, correct, export, or request deletion of your personal data, and
              withdraw consent for optional processing, at any time. To exercise these rights,
              contact us using the details below and we will respond within 30 days.
            </p>
          </Section>

          <Section title="International transfers">
            <p>
              If you are located in the US or UK, your information may be processed and stored in
              India where our team and systems operate. By using our service, you consent to this
              transfer in accordance with this policy.
            </p>
          </Section>

          <Section title="Children">
            <p>
              Our service is intended for businesses and individuals aged 16 and over. We do not
              knowingly collect personal data from anyone under 16.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes will be posted on
              this page with an updated revision date.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              This Privacy Policy is maintained by Icon Computers, Nagpur. For questions or
              requests regarding your data, email{" "}
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
          <p>&copy; {new Date().getFullYear()} eazybuildwebsite.com — All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms &amp; Conditions
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
