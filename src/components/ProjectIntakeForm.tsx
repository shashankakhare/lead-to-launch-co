import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { saveRequirements } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import type { PackageSlug } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Upload } from "lucide-react";

type RequirementsRow = {
  business_name: string | null;
  industry: string | null;
  brand_colors: string | null;
  reference_sites: string | null;
  content_notes: string | null;
  logo_url: string | null;
  reference_images: unknown;
  intake_data?: Record<string, any> | null;
  submitted: boolean;
} | null;

type ServiceItem = { name: string; description: string; image?: string };
type ProjectItem = { name: string; year: string; client: string; description: string; images: string[] };
type TestimonialItem = { name: string; designation: string; company: string; review: string; photo?: string };
type TeamItem = { name: string; designation: string; linkedin: string; bio: string; photo?: string };

const PAGE_OPTIONS = [
  "Home", "About Us", "Services", "Products", "Portfolio", "Gallery", "Team",
  "Testimonials", "Clients", "Pricing", "Blog", "FAQs", "Contact Us",
  "Privacy Policy", "Terms & Conditions", "Careers",
];
const OBJECTIVE_OPTIONS = [
  "Business information", "Portfolio", "Appointment booking", "Showcase products",
  "Personal branding", "Service booking", "Company profile",
];
const STYLE_OPTIONS = [
  "Minimal", "Premium", "Corporate", "Luxury", "Modern", "Creative",
  "Apple-inspired", "Dark theme", "Light theme",
];
const FEATURE_OPTIONS = [
  "Contact form", "Enquiry form", "Newsletter signup", "Live chat", "WhatsApp chat",
  "Booking / appointments", "Google Maps embed", "Image gallery", "Video embeds",
  "Blog / articles", "Downloadable PDFs", "Multi-language", "Search bar",
];
const INTEGRATION_OPTIONS = [
  "Google Analytics", "Google Search Console", "Meta Pixel", "Mailchimp",
  "HubSpot", "Calendly", "Zapier", "Razorpay / Stripe (donations)",
];
const LEGAL_OPTIONS = ["Privacy Policy", "Terms & Conditions", "Cookie Policy", "Disclaimer"];

export function ProjectIntakeForm({
  orderId,
  packageSlug,
  initial,
  onSaved,
}: {
  orderId: string;
  packageSlug: PackageSlug;
  initial: RequirementsRow;
  onSaved: () => void;
}) {
  const save = useServerFn(saveRequirements);
  const submitted = initial?.submitted ?? false;

  const tier = packageSlug === "one_page" ? 1 : packageSlug === "five_page" ? 2 : 3;
  const pageBudget = packageSlug === "one_page" ? 1 : packageSlug === "five_page" ? 5 : 10;
  const showAdvanced = tier >= 2;
  const showPortfolio = tier >= 3;

  const d = (initial?.intake_data ?? {}) as Record<string, any>;

  // Section 1 — Basic
  const [businessName, setBusinessName] = useState(initial?.business_name ?? d.businessName ?? "");
  const [tagline, setTagline] = useState<string>(d.tagline ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? d.industry ?? "");
  const [yearEstablished, setYearEstablished] = useState<string>(d.yearEstablished ?? "");
  const [ownerName, setOwnerName] = useState<string>(d.ownerName ?? "");
  const [contactName, setContactName] = useState<string>(d.contactName ?? "");
  const [phone, setPhone] = useState<string>(d.phone ?? "");
  const [email, setEmail] = useState<string>(d.email ?? "");
  const [existingWebsite, setExistingWebsite] = useState<string>(d.existingWebsite ?? "");
  const [businessAddress, setBusinessAddress] = useState<string>(d.businessAddress ?? "");
  const [mapsLocation, setMapsLocation] = useState<string>(d.mapsLocation ?? "");

  // Section 2 — About
  const [businessAbout, setBusinessAbout] = useState<string>(d.businessAbout ?? "");
  const [productsServices, setProductsServices] = useState<string>(d.productsServices ?? "");
  const [uniqueValue, setUniqueValue] = useState<string>(d.uniqueValue ?? "");
  const [mission, setMission] = useState<string>(d.mission ?? "");
  const [vision, setVision] = useState<string>(d.vision ?? "");

  // Section 3 — Objectives / audience (tier 2+)
  const [objectives, setObjectives] = useState<string[]>(d.objectives ?? []);
  const [idealCustomers, setIdealCustomers] = useState<string>(d.idealCustomers ?? "");
  const [serviceLocations, setServiceLocations] = useState<string>(d.serviceLocations ?? "");
  const [serviceScope, setServiceScope] = useState<string>(d.serviceScope ?? "");

  // Section 4 — Pages / services / portfolio
  const [pages, setPages] = useState<string[]>(d.pages ?? (tier === 1 ? ["Home"] : ["Home", "About Us", "Contact Us"]));
  const [services, setServices] = useState<ServiceItem[]>(d.services ?? []);
  const [projects, setProjects] = useState<ProjectItem[]>(d.projects ?? []);

  // Section 5 — Branding
  const [primaryColor, setPrimaryColor] = useState<string>(d.primaryColor ?? "");
  const [secondaryColor, setSecondaryColor] = useState<string>(d.secondaryColor ?? "");
  const [preferredFont, setPreferredFont] = useState<string>(d.preferredFont ?? "");
  const [websiteReferences, setWebsiteReferences] = useState<string>(
    d.websiteReferences ?? initial?.reference_sites ?? "",
  );
  const [styles, setStyles] = useState<string[]>(d.styles ?? []);
  const [logoUrl, setLogoUrl] = useState<string>(initial?.logo_url ?? "");
  const [images, setImages] = useState<string[]>(
    Array.isArray(initial?.reference_images) ? (initial?.reference_images as string[]) : [],
  );

  // Section 6 — Contact & social
  const [publicPhone, setPublicPhone] = useState<string>(d.publicPhone ?? "");
  const [whatsapp, setWhatsapp] = useState<string>(d.whatsapp ?? "");
  const [salesEmail, setSalesEmail] = useState<string>(d.salesEmail ?? "");
  const [businessHours, setBusinessHours] = useState<string>(d.businessHours ?? "");
  const [facebook, setFacebook] = useState<string>(d.facebook ?? "");
  const [instagram, setInstagram] = useState<string>(d.instagram ?? "");
  const [linkedin, setLinkedin] = useState<string>(d.linkedin ?? "");
  const [youtube, setYoutube] = useState<string>(d.youtube ?? "");
  const [googleBusiness, setGoogleBusiness] = useState<string>(d.googleBusiness ?? "");

  // Section 7 — Features / SEO (tier 2+)
  const [features, setFeatures] = useState<string[]>(d.features ?? []);
  const [integrations, setIntegrations] = useState<string[]>(d.integrations ?? []);
  const [primaryKeywords, setPrimaryKeywords] = useState<string>(d.primaryKeywords ?? "");
  const [targetLocation, setTargetLocation] = useState<string>(d.targetLocation ?? "");
  const [competitors, setCompetitors] = useState<string>(d.competitors ?? "");

  // Section 8 — Domain / hosting / content
  const [hasDomain, setHasDomain] = useState<string>(d.hasDomain ?? "");
  const [domainName, setDomainName] = useState<string>(d.domainName ?? "");
  const [domainRegistrar, setDomainRegistrar] = useState<string>(d.domainRegistrar ?? "");
  const [businessEmailRequired, setBusinessEmailRequired] = useState<string>(d.businessEmailRequired ?? "");
  const [emailAccounts, setEmailAccounts] = useState<string>(d.emailAccounts ?? "");
  const [legalPages, setLegalPages] = useState<string[]>(d.legalPages ?? []);
  const [contentProvider, setContentProvider] = useState<string>(d.contentProvider ?? "");
  const [copywriting, setCopywriting] = useState<string>(d.copywriting ?? "");

  // Section 9 — Testimonials / team (tier 3)
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(d.testimonials ?? []);
  const [team, setTeam] = useState<TeamItem[]>(d.team ?? []);
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    d.additionalNotes ?? initial?.content_notes ?? "",
  );

  // Section 10 — Confirmations
  const [accurateInfo, setAccurateInfo] = useState(false);
  const [timelineAck, setTimelineAck] = useState(false);
  const [contentRights, setContentRights] = useState(false);

  const [uploading, setUploading] = useState<string | null>(null);

  async function uploadFile(file: File, kind: string): Promise<string | null> {
    setUploading(kind);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not signed in");
      const path = `${uid}/${orderId}/${kind}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("project-assets").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("project-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 30);
      return signed?.signedUrl ?? null;
    } catch (e: any) {
      toast(e.message ?? "Upload failed");
      return null;
    } finally {
      setUploading(null);
    }
  }

  function buildPayload(submit: boolean) {
    const intake: Record<string, any> = {
      tagline, yearEstablished, ownerName, contactName, phone, email, existingWebsite,
      businessAddress, mapsLocation,
      businessAbout, productsServices, uniqueValue, mission, vision,
      objectives, idealCustomers, serviceLocations, serviceScope,
      pages, services, projects,
      primaryColor, secondaryColor, preferredFont, websiteReferences, styles,
      publicPhone, whatsapp, salesEmail, businessHours,
      facebook, instagram, linkedin, youtube, googleBusiness,
      features, integrations, primaryKeywords, targetLocation, competitors,
      hasDomain, domainName, domainRegistrar,
      businessEmailRequired, emailAccounts, legalPages, contentProvider, copywriting,
      testimonials, team, additionalNotes,
      confirmations: submit ? { accurateInfo, timelineAck, contentRights } : undefined,
    };
    return {
      orderId,
      businessName, industry,
      brandColors: [primaryColor, secondaryColor].filter(Boolean).join(", "),
      referenceSites: websiteReferences,
      contentNotes: additionalNotes,
      logoUrl,
      referenceImages: images,
      intakeData: intake,
      submit,
    };
  }

  function validateForSubmit(): string | null {
    if (!businessName.trim()) return "Business name is required";
    if (!industry.trim()) return "Industry is required";
    if (!ownerName.trim()) return "Business owner name is required";
    if (!contactName.trim()) return "Primary contact person is required";
    if (!phone.trim()) return "Mobile number is required";
    if (!email.trim()) return "Email is required";
    if (!businessAbout.trim()) return "Please tell us about your business";
    if (!productsServices.trim()) return "List your products or services";
    if (showAdvanced) {
      if (objectives.length === 0) return "Select at least one website purpose";
      if (!idealCustomers.trim()) return "Describe your ideal customers";
      if (!serviceScope) return "Select a service area";
      if (!contentProvider) return "Confirm who provides the content";
    }
    if (pages.length === 0) return "Select at least one page";
    if (pages.length > pageBudget)
      return `Your ${pageBudget}-page package covers ${pageBudget} page${pageBudget === 1 ? "" : "s"}. You selected ${pages.length}. Remove some or add extras via billing.`;
    if (!accurateInfo || !timelineAck || !contentRights)
      return "Please confirm all three checkboxes at the bottom";
    return null;
  }

  const mutation = useMutation({
    mutationFn: async (submit: boolean) => {
      if (submit) {
        const err = validateForSubmit();
        if (err) throw new Error(err);
      }
      return save({ data: buildPayload(submit) });
    },
    onSuccess: (_res, submit) => {
      toast(submit ? "Submitted to your developer" : "Draft saved");
      onSaved();
    },
    onError: (e: any) => toast(e.message ?? "Failed to save"),
  });

  const pageCount = pages.length;
  const overBudget = pageCount > pageBudget;

  return (
    <Card className="p-5 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-medium">Project intake questionnaire</h2>
          <p className="text-xs text-muted-foreground">
            Tailored for your {pageBudget}-page package. Save a draft any time and return later.
          </p>
        </div>
        {submitted && <Badge>Submitted</Badge>}
      </div>

      {/* 01 Basic */}
      <Section num="01" title="Basic business information" subtitle="The essentials we need to identify and contact you.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name *"><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></Field>
          <Field label="Business tagline"><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></Field>
          <Field label="Industry / category *"><Input value={industry} onChange={(e) => setIndustry(e.target.value)} /></Field>
          <Field label="Year established"><Input type="number" value={yearEstablished} onChange={(e) => setYearEstablished(e.target.value)} /></Field>
          <Field label="Business owner *"><Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></Field>
          <Field label="Primary contact person *"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
          <Field label="Mobile number *"><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Email address *"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Current website (if any)"><Input type="url" placeholder="https://" value={existingWebsite} onChange={(e) => setExistingWebsite(e.target.value)} /></Field>
          <Field label="Google Maps link"><Input type="url" value={mapsLocation} onChange={(e) => setMapsLocation(e.target.value)} /></Field>
          <Field label="Business address" full><Textarea rows={2} value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} /></Field>
        </div>
      </Section>

      {/* 02 About */}
      <Section num="02" title="About your business" subtitle="Context to shape clear, authentic website content.">
        <div className="grid gap-4">
          <Field label="Tell us about your business *"><Textarea rows={4} value={businessAbout} onChange={(e) => setBusinessAbout(e.target.value)} /></Field>
          <Field label="Products / services you offer *"><Textarea rows={3} value={productsServices} onChange={(e) => setProductsServices(e.target.value)} /></Field>
          <Field label="What makes your business unique?"><Textarea rows={2} value={uniqueValue} onChange={(e) => setUniqueValue(e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mission"><Textarea rows={2} value={mission} onChange={(e) => setMission(e.target.value)} /></Field>
            <Field label="Vision"><Textarea rows={2} value={vision} onChange={(e) => setVision(e.target.value)} /></Field>
          </div>
        </div>
      </Section>

      {/* 03 Objectives (tier 2+) */}
      {showAdvanced && (
        <Section num="03" title="Website objective & audience" subtitle="Choose every outcome that applies.">
          <FieldsetGrid label="Primary purpose of your website *" options={OBJECTIVE_OPTIONS} values={objectives} onChange={setObjectives} />
          <div className="grid gap-4 mt-4">
            <Field label="Who are your ideal customers? *"><Textarea rows={2} value={idealCustomers} onChange={(e) => setIdealCustomers(e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Countries / cities you serve"><Input value={serviceLocations} onChange={(e) => setServiceLocations(e.target.value)} /></Field>
              <Field label="Service area *">
                <Select value={serviceScope} onValueChange={setServiceScope}>
                  <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
                  <SelectContent>
                    {["Local", "National", "International", "Local and national"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        </Section>
      )}

      {/* 04 Pages / services */}
      <Section num="04" title="Pages required" subtitle={`Your package includes ${pageBudget} page${pageBudget === 1 ? "" : "s"}. Extra pages can be added as scope add-ons.`}>
        <FieldsetGrid label="" options={PAGE_OPTIONS} values={pages} onChange={setPages} compact />
        <div className={`mt-2 text-xs ${overBudget ? "text-destructive" : "text-muted-foreground"}`}>
          Selected {pageCount} of {pageBudget} included pages{overBudget ? " — over budget" : ""}.
        </div>

        {showAdvanced && (
          <div className="mt-6 space-y-3">
            <Repeatable
              title="Services to feature"
              items={services}
              onChange={setServices}
              blank={{ name: "", description: "", image: "" }}
              render={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Service name"><Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} /></Field>
                  <Field label="Image">
                    <Input type="file" accept="image/*" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { const url = await uploadFile(f, "service"); if (url) update({ ...item, image: url }); }
                    }} />
                    {item.image && <img src={item.image} alt="" className="mt-2 h-12 rounded border" />}
                  </Field>
                  <Field label="Description" full><Textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} /></Field>
                </div>
              )}
            />
          </div>
        )}

        {showPortfolio && (
          <div className="mt-6">
            <Repeatable
              title="Portfolio projects"
              items={projects}
              onChange={setProjects}
              blank={{ name: "", year: "", client: "", description: "", images: [] }}
              render={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project name"><Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} /></Field>
                  <Field label="Completion year"><Input type="number" value={item.year} onChange={(e) => update({ ...item, year: e.target.value })} /></Field>
                  <Field label="Client name"><Input value={item.client} onChange={(e) => update({ ...item, client: e.target.value })} /></Field>
                  <Field label="Images">
                    <Input type="file" accept="image/*" multiple onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      const urls: string[] = [];
                      for (const f of files) { const u = await uploadFile(f, "project"); if (u) urls.push(u); }
                      update({ ...item, images: [...item.images, ...urls] });
                    }} />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.images.map((u) => <img key={u} src={u} alt="" className="h-10 w-10 object-cover rounded border" />)}
                    </div>
                  </Field>
                  <Field label="Description" full><Textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} /></Field>
                </div>
              )}
            />
          </div>
        )}
      </Section>

      {/* 05 Brand */}
      <Section num="05" title="Branding & visual direction" subtitle="Share the visual references that represent your brand.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary color"><Input placeholder="#0A84FF or Blue" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></Field>
          <Field label="Secondary color"><Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} /></Field>
          <Field label="Preferred font"><Input value={preferredFont} onChange={(e) => setPreferredFont(e.target.value)} /></Field>
          <Field label="Websites you like (comma-separated)"><Input value={websiteReferences} onChange={(e) => setWebsiteReferences(e.target.value)} /></Field>
        </div>
        <FieldsetGrid label="Preferred website style" options={STYLE_OPTIONS} values={styles} onChange={setStyles} compact />
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <Field label="Logo">
            <Input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) { const url = await uploadFile(f, "logo"); if (url) setLogoUrl(url); }
            }} />
            {uploading === "logo" && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
            {logoUrl && <img src={logoUrl} alt="Logo" className="mt-2 h-16 rounded border" />}
          </Field>
          <Field label="Reference / brand images">
            <Input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) { const url = await uploadFile(f, "ref"); if (url) setImages((p) => [...p, url]); }
            }} />
            {uploading === "ref" && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((u) => (
                <div key={u} className="relative">
                  <img src={u} alt="ref" className="h-14 w-14 object-cover rounded border" />
                  <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== u))}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 text-[10px] leading-none">×</button>
                </div>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* 06 Contacts & socials */}
      <Section num="06" title="Contact & social information" subtitle="Details you want published on the website.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Public phone"><Input type="tel" value={publicPhone} onChange={(e) => setPublicPhone(e.target.value)} /></Field>
          <Field label="WhatsApp"><Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
          <Field label="Sales / enquiry email"><Input type="email" value={salesEmail} onChange={(e) => setSalesEmail(e.target.value)} /></Field>
          <Field label="Business hours"><Input placeholder="Mon–Fri, 9 AM–6 PM" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} /></Field>
          <Field label="Facebook"><Input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} /></Field>
          <Field label="Instagram"><Input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></Field>
          <Field label="LinkedIn"><Input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></Field>
          <Field label="YouTube"><Input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} /></Field>
          <Field label="Google Business Profile" full><Input type="url" value={googleBusiness} onChange={(e) => setGoogleBusiness(e.target.value)} /></Field>
        </div>
      </Section>

      {/* 07 Features / SEO (tier 2+) */}
      {showAdvanced && (
        <Section num="07" title="Features, SEO & integrations" subtitle="Functionality and marketing tools relevant to your site.">
          <FieldsetGrid label="Features required" options={FEATURE_OPTIONS} values={features} onChange={setFeatures} compact />
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <Field label="Primary keywords"><Textarea rows={2} value={primaryKeywords} onChange={(e) => setPrimaryKeywords(e.target.value)} /></Field>
            <Field label="Target location"><Input value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} /></Field>
            <Field label="Competitor websites (comma-separated)" full><Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} /></Field>
          </div>
          {tier >= 3 && (
            <div className="mt-4">
              <FieldsetGrid label="Integrations" options={INTEGRATION_OPTIONS} values={integrations} onChange={setIntegrations} compact />
            </div>
          )}
        </Section>
      )}

      {/* 08 Technical */}
      <Section num="08" title="Domain, hosting & content" subtitle="We'll request access details securely later — never share passwords here.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Do you already own a domain?">
            <Select value={hasDomain} onValueChange={setHasDomain}>
              <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Need business emails?">
            <Select value={businessEmailRequired} onValueChange={setBusinessEmailRequired}>
              <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {hasDomain === "yes" && (
            <>
              <Field label="Domain name"><Input value={domainName} onChange={(e) => setDomainName(e.target.value)} /></Field>
              <Field label="Domain registrar"><Input value={domainRegistrar} onChange={(e) => setDomainRegistrar(e.target.value)} /></Field>
            </>
          )}
          {businessEmailRequired === "yes" && (
            <Field label="How many email accounts?"><Input type="number" min={1} value={emailAccounts} onChange={(e) => setEmailAccounts(e.target.value)} /></Field>
          )}
        </div>
        <div className="mt-4">
          <FieldsetGrid label="Legal pages required" options={LEGAL_OPTIONS} values={legalPages} onChange={setLegalPages} compact />
        </div>
        {showAdvanced && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm">Who will provide content? *</Label>
              <RadioGroup value={contentProvider} onValueChange={setContentProvider} className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Client" /> We will</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Agency" /> Please write for us</label>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm">Need copywriting?</Label>
              <RadioGroup value={copywriting} onValueChange={setCopywriting} className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Yes" /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="No" /> No</label>
              </RadioGroup>
            </div>
          </div>
        )}
      </Section>

      {/* 09 Testimonials / team (tier 3) */}
      {showPortfolio && (
        <Section num="09" title="Testimonials, team & notes" subtitle="Optional content that adds credibility.">
          <Repeatable
            title="Testimonials"
            items={testimonials}
            onChange={setTestimonials}
            blank={{ name: "", designation: "", company: "", review: "", photo: "" }}
            render={(item, update) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name"><Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} /></Field>
                <Field label="Designation"><Input value={item.designation} onChange={(e) => update({ ...item, designation: e.target.value })} /></Field>
                <Field label="Company"><Input value={item.company} onChange={(e) => update({ ...item, company: e.target.value })} /></Field>
                <Field label="Photo">
                  <Input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) { const u = await uploadFile(f, "testimonial"); if (u) update({ ...item, photo: u }); }
                  }} />
                  {item.photo && <img src={item.photo} alt="" className="mt-2 h-12 rounded-full border" />}
                </Field>
                <Field label="Review" full><Textarea rows={2} value={item.review} onChange={(e) => update({ ...item, review: e.target.value })} /></Field>
              </div>
            )}
          />
          <div className="mt-6">
            <Repeatable
              title="Team members"
              items={team}
              onChange={setTeam}
              blank={{ name: "", designation: "", linkedin: "", bio: "", photo: "" }}
              render={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name"><Input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} /></Field>
                  <Field label="Designation"><Input value={item.designation} onChange={(e) => update({ ...item, designation: e.target.value })} /></Field>
                  <Field label="LinkedIn"><Input type="url" value={item.linkedin} onChange={(e) => update({ ...item, linkedin: e.target.value })} /></Field>
                  <Field label="Photo">
                    <Input type="file" accept="image/*" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { const u = await uploadFile(f, "team"); if (u) update({ ...item, photo: u }); }
                    }} />
                    {item.photo && <img src={item.photo} alt="" className="mt-2 h-12 rounded-full border" />}
                  </Field>
                  <Field label="Short bio" full><Textarea rows={2} value={item.bio} onChange={(e) => update({ ...item, bio: e.target.value })} /></Field>
                </div>
              )}
            />
          </div>
        </Section>
      )}

      <Section num={showPortfolio ? "10" : "09"} title="Additional notes" subtitle="Anything else your developer should know?">
        <Textarea rows={4} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Specific design preferences, features, deadlines, references…" />
      </Section>

      {/* Confirmations */}
      <Section num={showPortfolio ? "11" : "10"} title="Review & submit" subtitle="Please confirm before sending to your developer.">
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={accurateInfo} onCheckedChange={(v) => setAccurateInfo(Boolean(v))} />
            <span>I confirm the information provided is accurate. *</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={timelineAck} onCheckedChange={(v) => setTimelineAck(Boolean(v))} />
            <span>I understand the project timeline begins after content and approvals are received. *</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={contentRights} onCheckedChange={(v) => setContentRights(Boolean(v))} />
            <span>I have the rights to use all uploaded content, including images, logos, and text. *</span>
          </label>
        </div>
      </Section>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
        <Button variant="outline" onClick={() => mutation.mutate(false)} disabled={mutation.isPending}>
          Save draft
        </Button>
        <Button onClick={() => mutation.mutate(true)} disabled={mutation.isPending}>
          {submitted ? "Update & re-submit" : "Submit to developer"}
        </Button>
      </div>
    </Card>
  );
}

function Section({ num, title, subtitle, children }: { num: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 pt-4 border-t border-white/5 first:border-0 first:pt-0">
      <div className="flex gap-3">
        <div className="text-xs font-mono text-muted-foreground pt-1">{num}</div>
        <div>
          <h3 className="font-medium">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function FieldsetGrid({
  label, options, values, onChange, compact,
}: {
  label: string; options: string[]; values: string[]; onChange: (v: string[]) => void; compact?: boolean;
}) {
  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  }
  return (
    <div>
      {label && <Label className="text-sm">{label}</Label>}
      <div className={`grid gap-2 mt-2 ${compact ? "sm:grid-cols-3 grid-cols-2" : "sm:grid-cols-2"}`}>
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={values.includes(o)} onCheckedChange={() => toggle(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Repeatable<T>({
  title, items, onChange, blank, render,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, structuredClone(blank)])}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      {items.length === 0 && <p className="text-xs text-muted-foreground">None added yet.</p>}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="relative border border-white/5 rounded-lg p-3">
            <button type="button"
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </button>
            {render(item, (next) => onChange(items.map((x, idx) => (idx === i ? next : x))))}
          </div>
        ))}
      </div>
    </div>
  );
}
