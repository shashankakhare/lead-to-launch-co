import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — buildingwebsitenow.com" },
      {
        name: "description",
        content:
          "buildingwebsitenow.com is a WordPress website studio by Icon Computers, Nagpur — shipping business and portfolio sites in 4 days.",
      },
      { property: "og:title", content: "About — buildingwebsitenow.com" },
      {
        property: "og:description",
        content:
          "A focused WordPress studio by Icon Computers, Nagpur. Business and portfolio sites in 4 days.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24 sm:py-32">
        <Reveal>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tighter">About us</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            buildingwebsitenow.com is a focused WordPress studio operated by{" "}
            <span className="text-foreground font-medium">Icon Computers, Nagpur</span>. We build
            fast, hand-crafted business and portfolio websites in 4 days and hand over full
            ownership — no lock-in, no monthly rent for your own site.
          </p>
        </Reveal>

        <div className="mt-16 space-y-10 text-[15px] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">What we do</h2>
            <p className="text-muted-foreground">
              We build 1-page, 5-page, and 10-page WordPress websites for founders, freelancers, and
              small teams who want a real online presence without an agency retainer. We do not
              build ecommerce stores — that keeps us fast and focused on what we do best.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">Parent company</h2>
            <p className="text-muted-foreground">
              Icon Computers has served clients out of Nagpur for years across IT services, web, and
              custom software. buildingwebsitenow.com is our productised website offering.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">Ready to start?</h2>
            <p className="text-muted-foreground">
              Pick a package on the{" "}
              <Link to="/" hash="pricing" className="underline hover:text-foreground">
                pricing section
              </Link>{" "}
              or{" "}
              <Link to="/contact" className="underline hover:text-foreground">
                talk to us
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
