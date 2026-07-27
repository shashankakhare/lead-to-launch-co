import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyOrder, saveRequirements, rateOrder, syncOrderStatus, requestRevision, approveOrder } from "@/lib/orders.functions";
import { PACKAGES, formatInr } from "@/lib/packages";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { ProjectIntakeForm } from "@/components/ProjectIntakeForm";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Project · Building Website Now" }] }),
  component: OrderDetail,
});

const STAGES = ["pending_payment", "requirements_pending", "in_progress", "review", "delivered"] as const;
const STAGE_LABEL: Record<string, string> = {
  pending_payment: "Payment",
  requirements_pending: "Requirements",
  in_progress: "Design & Build",
  review: "Review",
  delivered: "Delivered",
};

function OrderDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getMyOrder);
  const sync = useServerFn(syncOrderStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fn({ data: { orderId: id } }),
  });

  useEffect(() => {
    if (data?.order.status !== "pending_payment") return;
    let cancelled = false;
    sync({ data: { orderId: id } }).then((res) => {
      if (!cancelled && res.status !== "pending_payment") {
        qc.invalidateQueries({ queryKey: ["order", id] });
        qc.invalidateQueries({ queryKey: ["my-orders"] });
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [data?.order.status, id, qc, sync]);

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const pkg = PACKAGES[data.order.package as keyof typeof PACKAGES];
  const stageIdx = Math.max(0, STAGES.indexOf(data.order.status as (typeof STAGES)[number]));
  const progress = ((stageIdx + 1) / STAGES.length) * 100;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Order #{data.order.id.slice(0, 8)}</div>
        <h1 className="text-2xl font-semibold">{pkg.name} — {pkg.pages}</h1>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="secondary">{STAGE_LABEL[data.order.status] ?? data.order.status}</Badge>
          <span className="text-muted-foreground">{formatInr(Number(data.order.amount_usd))}</span>
        </div>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STAGES.map((s, i) => (
            <span key={s} className={i <= stageIdx ? "text-foreground font-medium" : ""}>
              {STAGE_LABEL[s]}
            </span>
          ))}
        </div>
        <Progress value={progress} />
      </Card>

      {data.order.status !== "pending_payment" && (
        <ProjectIntakeForm
          orderId={id}
          packageSlug={data.order.package as any}
          initial={data.requirements as any}
          onSaved={() => qc.invalidateQueries({ queryKey: ["order", id] })}
        />
      )}

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Updates from your developer</h2>
        {data.updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.updates.map((u: { id: string; stage: string; message: string | null; created_at: string }) => (
              <li key={u.id} className="border-l-2 border-primary/40 pl-3">
                <div className="font-medium">{u.stage}</div>
                {u.message && <div className="text-muted-foreground">{u.message}</div>}
                <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {(data.order.status === "review" || data.order.status === "delivered") && (
        <ReviewActions
          orderId={id}
          status={data.order.status}
          revisions={data.revisions}
          onSaved={() => qc.invalidateQueries({ queryKey: ["order", id] })}
        />
      )}

      {data.order.status === "delivered" && (
        <RatingForm
          orderId={id}
          existing={data.rating}
          onSaved={() => qc.invalidateQueries({ queryKey: ["order", id] })}
        />
      )}
    </div>
  );
}

type RequirementsRow = {
  business_name: string | null;
  industry: string | null;
  brand_colors: string | null;
  reference_sites: string | null;
  content_notes: string | null;
  logo_url: string | null;
  reference_images: unknown;
  submitted: boolean;
} | null;

function RequirementsForm({
  orderId,
  initial,
  onSaved,
}: {
  orderId: string;
  initial: RequirementsRow;
  onSaved: () => void;
}) {
  const save = useServerFn(saveRequirements);
  const [businessName, setBusinessName] = useState(initial?.business_name ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [brandColors, setBrandColors] = useState(initial?.brand_colors ?? "");
  const [referenceSites, setReferenceSites] = useState(initial?.reference_sites ?? "");
  const [contentNotes, setContentNotes] = useState(initial?.content_notes ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [images, setImages] = useState<string[]>(
    Array.isArray(initial?.reference_images) ? (initial?.reference_images as string[]) : [],
  );
  const [uploading, setUploading] = useState<"logo" | "image" | null>(null);
  const submitted = initial?.submitted ?? false;

  const mutation = useMutation({
    mutationFn: (submit: boolean) =>
      save({
        data: {
          orderId,
          businessName,
          industry,
          brandColors,
          referenceSites,
          contentNotes,
          logoUrl,
          referenceImages: images,
          submit,
        },
      }),
    onSuccess: () => onSaved(),
  });

  async function uploadFile(file: File, kind: "logo" | "image") {
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
      const url = signed?.signedUrl ?? "";
      if (kind === "logo") setLogoUrl(url);
      else setImages((prev) => [...prev, url]);
    } finally {
      setUploading(null);
    }
  }

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Project prerequisites</h2>
        {submitted && <Badge>Submitted</Badge>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Business name</Label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Industry</Label>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Brand colors (e.g. #0A0A0A, gold)</Label>
          <Input value={brandColors} onChange={(e) => setBrandColors(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Reference sites you love</Label>
          <Textarea rows={3} value={referenceSites} onChange={(e) => setReferenceSites(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Content, copy, product/services notes</Label>
          <Textarea rows={5} value={contentNotes} onChange={(e) => setContentNotes(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "logo")}
          />
          {uploading === "logo" && <p className="text-xs text-muted-foreground">Uploading…</p>}
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 rounded border" />}
        </div>
        <div className="space-y-2">
          <Label>Reference images</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "image")}
          />
          {uploading === "image" && <p className="text-xs text-muted-foreground">Uploading…</p>}
          <div className="flex flex-wrap gap-2">
            {images.map((u) => (
              <img key={u} src={u} alt="ref" className="h-16 w-16 object-cover rounded border" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
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

function RatingForm({
  orderId,
  existing,
  onSaved,
}: {
  orderId: string;
  existing: { stars: number; review: string | null } | null;
  onSaved: () => void;
}) {
  const rate = useServerFn(rateOrder);
  const [stars, setStars] = useState(existing?.stars ?? 5);
  const [review, setReview] = useState(existing?.review ?? "");
  const m = useMutation({
    mutationFn: () => rate({ data: { orderId, stars, review } }),
    onSuccess: () => onSaved(),
  });
  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-medium">Rate your developer</h2>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= stars ? "text-yellow-500" : "text-muted-foreground"}
            onClick={() => setStars(n)}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea rows={3} placeholder="Optional review" value={review} onChange={(e) => setReview(e.target.value)} />
      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        {existing ? "Update review" : "Submit review"}
      </Button>
    </Card>
  );
}

function ReviewActions({
  orderId,
  status,
  revisions,
  onSaved,
}: {
  orderId: string;
  status: string;
  revisions: { id: string; status: string; message: string; created_at: string }[];
  onSaved: () => void;
}) {
  const request = useServerFn(requestRevision);
  const approve = useServerFn(approveOrder);
  const [message, setMessage] = useState("");
  const qc = useQueryClient();

  const requestMut = useMutation({
    mutationFn: () => request({ data: { orderId, message } }),
    onSuccess: () => {
      toast("Revision request sent");
      setMessage("");
      onSaved();
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: any) => toast(e.message ?? "Failed"),
  });

  const approveMut = useMutation({
    mutationFn: () => approve({ data: { orderId } }),
    onSuccess: () => {
      toast("Project approved and delivered");
      onSaved();
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: any) => toast(e.message ?? "Failed"),
  });

  const pending = revisions.filter((r) => r.status === "pending");
  const addressed = revisions.filter((r) => r.status === "addressed");
  const approved = revisions.find((r) => r.status === "approved");

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4" /> Review & approve
        </h2>
        {approved && <Badge variant="default">Approved</Badge>}
      </div>

      {approved ? (
        <p className="text-sm text-muted-foreground">You approved this project. It is now delivered.</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-destructive">Pending revision requests</div>
              {pending.map((r) => (
                <div key={r.id} className="text-sm border-l-2 border-destructive/50 pl-3">
                  <div className="text-muted-foreground">{r.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          {addressed.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-primary">Addressed by developer</div>
              {addressed.map((r) => (
                <div key={r.id} className="text-sm border-l-2 border-primary/40 pl-3">
                  <div className="text-muted-foreground">{r.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          {status === "review" && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <Label>Request a change</Label>
              <Textarea
                rows={3}
                placeholder="Describe what needs to change before you approve the website..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => requestMut.mutate()}
                  disabled={requestMut.isPending || !message.trim()}
                >
                  <MessageSquareWarning className="h-4 w-4 mr-1" /> Request revision
                </Button>
                <Button
                  onClick={() => approveMut.mutate()}
                  disabled={approveMut.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & finalize
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
