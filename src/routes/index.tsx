import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import portfolioStudio from "@/assets/portfolio-studio.jpg";
import portfolioClinic from "@/assets/portfolio-clinic.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "buildingwebsitenow.com — Your WordPress site, live in 4 days" },
      {
        name: "description",
        content:
          "Premium WordPress business & portfolio websites for US and UK small businesses. Flat pricing from $299. Delivered in 4 days. Full ownership.",
      },
      { property: "og:title", content: "buildingwebsitenow.com — Live in 4 days" },
      {
        property: "og:description",
        content:
          "Flat-price WordPress business & portfolio sites, delivered in 4 days. Full ownership handed over.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const on = () => setY(window.scrollY);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return y;
}

function Nav() {
  const y = useScrollY();
  const scrolled = y > 8;
  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-colors ${
        scrolled ? "border-border bg-background/80 backdrop-blur-xl" : "border-transparent bg-background/0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#top" className="font-extrabold tracking-tighter text-xl">
            BUILDING<span className="text-accent">.</span>
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#process" className="hover:text-foreground transition-colors">Process</a>
            <a href="#work" className="hover:text-foreground transition-colors">Showcase</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Client login
          </Link>
          <a
            href="#pricing"
            className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all"
          >
            Get started
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const y = useScrollY();
  return (
    <header id="top" className="relative pt-24 pb-24 sm:pt-32 overflow-hidden">
      {/* Ambient gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-40 blur-3xl animate-drift"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.85 0.14 258 / 0.55), oklch(0.9 0.08 320 / 0.25), transparent 70%)",
          transform: `translate(-50%, ${y * 0.15}px)`,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase mb-8 animate-reveal">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Now serving US &amp; UK
        </div>
        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-balance mb-8 animate-reveal"
          style={{ animationDelay: "80ms" }}
        >
          Your website.
          <br />
          <span className="bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
            Live in 4 days.
          </span>
        </h1>
        <p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-reveal"
          style={{ animationDelay: "180ms" }}
        >
          High-performance WordPress business &amp; portfolio sites. Hand-built by experts, delivered with full ownership.
        </p>
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-reveal"
          style={{ animationDelay: "260ms" }}
        >
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 bg-accent text-accent-foreground rounded-full text-lg font-semibold hover:opacity-90 transition-all shadow-xl shadow-accent/25 hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-0.5"
          >
            Start your project
          </a>
          <a
            href="#work"
            className="w-full sm:w-auto px-8 py-4 bg-surface ring-1 ring-border rounded-full text-lg font-semibold hover:bg-surface-2 transition-all hover:-translate-y-0.5"
          >
            See our work
          </a>
        </div>
      </div>

      {/* Trust bar */}
      <div className="mt-24 border-y border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-40">
          {["REALTYCO", "NOVA HEALTH", "THE BAKERY", "STUDIO NINE", "LUXE WEAR"].map((n) => (
            <span key={n} className="text-lg font-bold tracking-tighter">{n}</span>
          ))}
        </div>
      </div>
    </header>
  );
}

function Process() {
  const steps = [
    { day: "DAY 01", title: "The Brief", body: "We dive deep into your brand, goals, and content. No guesswork." },
    { day: "DAY 02", title: "Design", body: "Custom high-fidelity concepts tailored to your industry aesthetic." },
    { day: "DAY 03", title: "Build", body: "Pixel-perfect WordPress development. Clean, fast, responsive." },
    { day: "DAY 04", title: "Launch", body: "Final QA, DNS setup, and we hand over the keys. You own everything." },
  ];
  return (
    <section id="process" className="py-24 sm:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">The 4-day sprint.</h2>
          <p className="text-lg text-muted-foreground">From brief to launch, faster than a long weekend.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {steps.map((s, i) => (
            <Reveal key={s.day} delay={i * 90} className="space-y-4">
              <span className="text-accent font-bold text-xs tracking-[0.2em]">{s.day}</span>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work() {
  const items = [
    { img: portfolioStudio, name: "Studio Nine", tag: "Interior design portfolio · 5 pages" },
    { img: portfolioClinic, name: "Nova Health", tag: "Dental clinic · 10 pages" },
  ];
  return (
    <section id="work" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Recent work.</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((it, i) => (
            <Reveal key={it.name} delay={i * 120}>
              <div className="group cursor-pointer overflow-hidden rounded-3xl bg-surface-2 ring-1 ring-border">
                <div className="w-full aspect-[4/3] overflow-hidden">
                  <img
                    src={it.img}
                    alt={`${it.name} website`}
                    width={1200}
                    height={900}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{it.name}</h4>
                    <p className="text-sm text-muted-foreground">{it.tag}</p>
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      slug: "one_page" as const,
      name: "The Solo",
      price: "$299",
      blurb: "Perfect for landing pages.",
      cta: "Choose Solo",
      features: ["Professional 1-page design", "Mobile responsive", "Basic SEO setup", "Contact form integration"],
      featured: false,
    },
    {
      slug: "five_page" as const,
      name: "The Business",
      price: "$799",
      blurb: "Comprehensive 5-page site.",
      cta: "Choose Business",
      features: [
        "Everything in Solo",
        "Custom 5-page architecture",
        "CMS training & handover",
        "Priority 4-day delivery",
      ],
      featured: true,
    },
    {
      slug: "ten_page" as const,
      name: "The Growth",
      price: "$1,499",
      blurb: "10-page powerhouse.",
      cta: "Choose Growth",
      features: [
        "Everything in Business",
        "Up to 10 custom pages",
        "Advanced SEO & analytics",
        "1 month post-launch support",
      ],
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-surface-2">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Simple, flat pricing.</h2>
          <p className="text-lg text-muted-foreground">Choose the plan that fits your business stage.</p>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 100} className={t.featured ? "lg:-my-2" : ""}>
              <div
                className={`h-full p-8 rounded-3xl flex flex-col transition-all ${
                  t.featured
                    ? "bg-background ring-2 ring-accent shadow-2xl shadow-accent/10 lg:scale-[1.03] relative z-10"
                    : "bg-background ring-1 ring-border shadow-sm hover:shadow-lg"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">{t.name}</h3>
                  <div className="text-5xl font-extrabold mb-2 tracking-tight">{t.price}</div>
                  <p className="text-sm text-muted-foreground">{t.blurb}</p>
                </div>
                <ul className="space-y-4 mb-10 flex-grow text-sm">
                  {t.features.map((f, idx) => (
                    <li key={f} className={`flex items-start gap-3 ${idx === 0 && t.featured ? "text-accent font-medium" : ""}`}>
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 10.5l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/checkout/$package"
                  params={{ package: t.slug }}
                  className={`w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    t.featured
                      ? "bg-accent text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/20"
                      : "bg-surface-2 text-foreground hover:bg-border"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Who owns the website?", a: "You do. 100%. Once we launch, we hand over all credentials. No monthly maintenance traps." },
    { q: "Is hosting included?", a: "We help you set up your own hosting (we recommend WP Engine or SiteGround) so you keep full control." },
    { q: "Do you build e-commerce sites?", a: "No. We focus exclusively on business and portfolio sites. WordPress makes it easy to add e-commerce later if you outgrow the current build." },
    { q: "What if I miss the 4-day timeline?", a: "The 4-day clock starts once we have your brief, assets, and content approved. We'll make expectations clear before day one." },
  ];
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-6">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-12 text-center">Questions? Answers.</h2>
        </Reveal>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group border-b border-border py-6 [&_svg]:open:rotate-45">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h4 className="font-bold text-lg">{f.q}</h4>
                  <svg className="w-5 h-5 transition-transform duration-300 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartCTA() {
  return (
    <section id="start" className="bg-foreground text-background py-24 sm:py-32 text-center relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-30 blur-3xl animate-drift"
        style={{ background: "radial-gradient(closest-side, oklch(0.58 0.22 258 / 0.6), transparent 70%)" }}
      />
      <div className="relative max-w-7xl mx-auto px-6">
        <Reveal>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-8">Ready to go live?</h2>
          <p className="text-lg sm:text-xl text-background/60 mb-12 max-w-xl mx-auto">
            Join the businesses skipping the agency headache and shipping in a long weekend.
          </p>
          <a
            href="#pricing"
            className="inline-block px-10 py-5 bg-background text-foreground rounded-full text-lg font-bold hover:bg-background/90 transition-all hover:-translate-y-0.5 shadow-2xl"
          >
            Claim your 4-day slot
          </a>
        </Reveal>
        <div className="mt-24 pt-10 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-background/40">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p>&copy; {new Date().getFullYear()} buildingwebsitenow.com — All rights reserved.</p>
            <p>
              A product of{" "}
              <span className="text-background/70 font-medium">Icon Computers, Nagpur</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link to="/privacy" className="hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/refund-policy" className="hover:text-background transition-colors">
              Refund Policy
            </Link>
            <Link to="/terms" className="hover:text-background transition-colors">
              Terms &amp; Conditions
            </Link>
            <a href="#faq" className="hover:text-background transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      <Nav />
      <Hero />
      <Process />
      <Work />
      <Pricing />
      <FAQ />
      <StartCTA />
    </main>
  );
}
