import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import { searchDomains, listHostingPlans, saveDomainChoice, purchaseDomainHosting } from "@/lib/domain.functions";
import { getCashfreeMode } from "@/lib/cashfree-client";
import { formatInr } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Search, PlayCircle, CheckCircle2, Loader2 } from "lucide-react";

type Mode = "have" | "buy_self" | "buy_from_us" | "need_help";

type SavedDomain = {
  mode?: Mode;
  domainName?: string | null;
  registrar?: string | null;
  registrarLogin?: string | null;
  registrarNotes?: string | null;
  hostingPlan?: string | null;
  domainPriceInr?: number | null;
};

const YT_BUY = "https://www.youtube.com/watch?v=Z3q2_1qX5vE"; // "How to buy a domain from GoDaddy"
const YT_NAMESERVER = "https://www.youtube.com/watch?v=1cADFxHmzKk"; // "How to change nameservers"

export function DomainHostingCard({ orderId, saved }: { orderId: string; saved: SavedDomain | null }) {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchDomains);
  const saveFn = useServerFn(saveDomainChoice);
  const purchaseFn = useServerFn(purchaseDomainHosting);
  const plansFn = useServerFn(listHostingPlans);

  const [mode, setMode] = useState<Mode>((saved?.mode as Mode) ?? "have");
  const [domainName, setDomainName] = useState(saved?.domainName ?? "");
  const [registrar, setRegistrar] = useState(saved?.registrar ?? "");
  const [registrarLogin, setRegistrarLogin] = useState(saved?.registrarLogin ?? "");
  const [registrarNotes, setRegistrarNotes] = useState(saved?.registrarNotes ?? "");
  const [hostingPlan, setHostingPlan] = useState<string | null>(saved?.hostingPlan ?? null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ domain: string; priceInr: number } | null>(
    saved?.mode === "buy_from_us" && saved.domainName && saved.domainPriceInr
      ? { domain: saved.domainName, priceInr: saved.domainPriceInr }
      : null,
  );

  const { data: plans } = useQuery({ queryKey: ["hosting-plans"], queryFn: () => plansFn() });

  const search = useMutation({
    mutationFn: (q: string) => searchFn({ data: { query: q } }),
  });

  const savePref = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          orderId,
          mode,
          domainName: mode === "buy_from_us" ? picked?.domain : domainName || undefined,
          registrar: registrar || undefined,
          registrarLogin: registrarLogin || undefined,
          registrarNotes: registrarNotes || undefined,
          hostingPlan,
          domainPriceInr: mode === "buy_from_us" ? picked?.priceInr ?? null : null,
        },
      }),
    onSuccess: () => {
      toast("Domain preference saved. Your developer has been notified.");
      qc.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (e: any) => toast(e.message ?? "Failed to save"),
  });

  const purchase = useMutation({
    mutationFn: async () => {
      if (!picked) throw new Error("Pick a domain first");
      return purchaseFn({
        data: {
          orderId,
          domainName: picked.domain,
          domainPriceInr: picked.priceInr,
          hostingSlug: hostingPlan,
        },
      });
    },
    onSuccess: async (res) => {
      if (res.mode === "mock") {
        toast("Test payment completed. Developer notified.");
        qc.invalidateQueries({ queryKey: ["order", orderId] });
        return;
      }
      try {
        const cashfree = await loadCashfree({ mode: getCashfreeMode() });
        await cashfree.checkout({ paymentSessionId: res.paymentSessionId, redirectTarget: "_self" });
      } catch (e: any) {
        toast(e.message ?? "Failed to open checkout");
      }
    },
    onError: (e: any) => toast(e.message ?? "Failed to start checkout"),
  });

  const hostingTotal =
    (plans ?? []).find((p) => p.slug === hostingPlan)?.price_inr ?? 0;
  const purchaseTotal = (picked?.priceInr ?? 0) + Number(hostingTotal);

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-medium">Domain & hosting</h2>
        </div>
        {saved?.mode && <Badge variant="secondary" className="text-[10px]">Saved</Badge>}
      </div>

      <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid gap-2 sm:grid-cols-2">
        <ModeOption id="have" active={mode === "have"} title="I already have a domain" desc="Share access or point nameservers to us." />
        <ModeOption id="buy_self" active={mode === "buy_self"} title="I'll buy my own domain" desc="Watch our quick guide to buy from GoDaddy." />
        <ModeOption id="buy_from_us" active={mode === "buy_from_us"} title="Buy a domain through us" desc="Search live availability & register in one click." />
        <ModeOption id="need_help" active={mode === "need_help"} title="I need help deciding" desc="A team member will reach out to guide you." />
      </RadioGroup>

      {mode === "have" && (
        <div className="space-y-4">
          <a href={YT_NAMESERVER} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <PlayCircle className="h-4 w-4" /> Watch: how to update nameservers at your registrar
          </a>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Your domain name</Label>
              <Input placeholder="example.com" value={domainName} onChange={(e) => setDomainName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Registrar (e.g. GoDaddy, BigRock)</Label>
              <Input value={registrar} onChange={(e) => setRegistrar(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Registrar login email (optional — for us to update DNS)</Label>
              <Input type="email" value={registrarLogin} onChange={(e) => setRegistrarLogin(e.target.value)} />
              <p className="text-xs text-muted-foreground">Never share passwords here — the developer will send a secure link when needed.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Anything else your developer should know</Label>
              <Textarea rows={2} value={registrarNotes} onChange={(e) => setRegistrarNotes(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {mode === "buy_self" && (
        <div className="space-y-3">
          <a href={YT_BUY} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <PlayCircle className="h-4 w-4" /> Watch: how to buy a domain (5 min)
          </a>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Domain you plan to buy</Label>
              <Input placeholder="example.com" value={domainName} onChange={(e) => setDomainName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Registrar</Label>
              <Input placeholder="GoDaddy, Namecheap…" value={registrar} onChange={(e) => setRegistrar(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Once purchased, come back here and switch to "I already have a domain" so we can pick it up.
          </p>
        </div>
      )}

      {mode === "buy_from_us" && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) search.mutate(query.trim());
            }}
            className="flex gap-2"
          >
            <Input placeholder="myclinic, mybrand…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button type="submit" disabled={search.isPending || !query.trim()}>
              {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {search.data && !search.data.ok && (
            <p className="text-xs text-destructive">{search.data.error}</p>
          )}

          {search.data?.ok && (
            <div className="border border-white/5 rounded-lg divide-y divide-white/5 max-h-72 overflow-y-auto">
              {search.data.results.map((r) => {
                const active = picked?.domain === r.domain;
                return (
                  <button
                    key={r.domain}
                    type="button"
                    disabled={!r.available || r.priceInr == null}
                    onClick={() => r.priceInr != null && setPicked({ domain: r.domain, priceInr: r.priceInr })}
                    className={`w-full flex items-center justify-between p-3 text-sm text-left transition ${
                      active ? "bg-primary/10" : "hover:bg-muted/20"
                    } ${!r.available ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      <span className="font-medium">{r.domain}</span>
                      <Badge variant={r.available ? "default" : "secondary"} className="text-[10px]">
                        {r.available ? "Available" : "Taken"}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {r.priceInr != null ? `${formatInr(r.priceInr)}/yr` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {picked && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="text-sm">
                Selected <span className="font-medium">{picked.domain}</span> — {formatInr(picked.priceInr)}/yr
              </div>
              <div className="space-y-2">
                <Label>Add hosting (optional)</Label>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setHostingPlan(null)}
                    className={`text-left border rounded-lg p-3 text-sm transition ${
                      hostingPlan == null ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    Skip hosting for now
                  </button>
                  {(plans ?? []).map((p) => {
                    const active = hostingPlan === p.slug;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setHostingPlan(p.slug)}
                        className={`text-left border rounded-lg p-3 transition ${
                          active ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{p.name}</span>
                          <span className="text-sm">{formatInr(Number(p.price_inr))}/{p.billing_period}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  Total: <span className="font-semibold">{formatInr(purchaseTotal)}</span>
                </div>
                <Button onClick={() => purchase.mutate()} disabled={purchase.isPending}>
                  {purchase.isPending ? "Starting…" : "Buy & pay now"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "need_help" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No problem — save this preference and your developer will reach out with recommendations based on your business.
          </p>
          <Textarea rows={2} placeholder="Anything specific we should know? (budget, region, brand-safe names…)"
            value={registrarNotes} onChange={(e) => setRegistrarNotes(e.target.value)} />
        </div>
      )}

      {mode !== "buy_from_us" && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => savePref.mutate()} disabled={savePref.isPending}>
            {savePref.isPending ? "Saving…" : "Save preference"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function ModeOption({ id, active, title, desc }: { id: string; active: boolean; title: string; desc: string }) {
  return (
    <label
      htmlFor={`mode-${id}`}
      className={`flex gap-3 border rounded-lg p-3 cursor-pointer transition ${
        active ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"
      }`}
    >
      <RadioGroupItem id={`mode-${id}`} value={id} className="mt-1" />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}
