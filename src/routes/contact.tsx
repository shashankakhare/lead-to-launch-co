import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — eazybuildwebsite.com" },
      {
        name: "description",
        content:
          "Get in touch with eazybuildwebsite.com — a WordPress website studio by Icon Computers, Nagpur.",
      },
      { property: "og:title", content: "Contact — eazybuildwebsite.com" },
      {
        property: "og:description",
        content: "Reach out to eazybuildwebsite.com for a 4-day WordPress website.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24 sm:py-32">
        <Reveal>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tighter">Contact</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Have a question about a package, timeline, or something custom? We usually reply within
            one business day.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-6 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Email</p>
            <a
              href="mailto:info@icon-computers.in"
              className="text-lg font-semibold hover:underline break-all"
            >
              info@icon-computers.in
            </a>
          </div>
          <div className="rounded-2xl border border-border p-6 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Parent company</p>
            <p className="text-lg font-semibold">Icon Computers</p>
            <p className="text-sm text-muted-foreground">Nagpur, India</p>
            <a
              href="https://www.icon-computers.in"
              className="text-sm text-accent font-medium hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.icon-computers.in
            </a>
          </div>
        </div>

        <div className="mt-10">
          <Link
            to="/"
            hash="pricing"
            className="inline-block px-8 py-4 bg-foreground text-background rounded-full font-semibold hover:opacity-90 transition"
          >
            See packages
          </Link>
        </div>
      </div>
    </main>
  );
}
