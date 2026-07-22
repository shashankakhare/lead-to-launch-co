import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminGetOrder,
  adminUpdateOrderStatus,
  adminPostUpdate,
  adminUpdateOrder,
  adminDeleteOrder,
  listStaff,
} from "@/lib/admin.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Admin · Order" }] }),
  component: AdminOrderDetail,
});

const STATUSES = [
  "pending_payment",
  "paid",
  "requirements_pending",
  "in_progress",
  "review",
  "delivered",
  "cancelled",
] as const;

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(adminGetOrder);
  const updateStatus = useServerFn(adminUpdateOrderStatus);
  const postUpdate = useServerFn(adminPostUpdate);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getFn({ data: { orderId: id } }),
  });

  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");

  const statusMut = useMutation({
    mutationFn: (status: (typeof STATUSES)[number]) =>
      updateStatus({ data: { orderId: id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-order", id] }),
  });

  const updateMut = useMutation({
    mutationFn: () => postUpdate({ data: { orderId: id, stage, message } }),
    onSuccess: () => {
      setStage("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const pkg = PACKAGES[data.order.package as keyof typeof PACKAGES];
  const req = data.requirements as any;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted-foreground">#{data.order.id}</div>
        <h1 className="text-2xl font-semibold">{pkg?.name ?? data.order.package}</h1>
        <div className="flex items-center gap-3 text-sm mt-1">
          <Badge variant="secondary">{data.order.status}</Badge>
          <span className="text-muted-foreground">${Number(data.order.amount_usd).toFixed(0)} {data.order.currency}</span>
        </div>
      </div>

      <EditOrderCard order={data.order} />




      <Card className="p-5 space-y-2 text-sm">
        <h2 className="font-medium">Client</h2>
        <div>{data.profile?.full_name ?? "—"} · {data.profile?.email ?? "—"}</div>
        <div className="text-muted-foreground">
          {data.profile?.phone ?? "no phone"} · {data.profile?.company ?? "no company"}
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Update status</h2>
        <Select
          value={data.order.status}
          onValueChange={(v) => statusMut.mutate(v as (typeof STATUSES)[number])}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Prerequisites from client</h2>
        {!req ? (
          <p className="text-sm text-muted-foreground">Not submitted yet.</p>
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">Business:</span> {req.business_name ?? "—"}</div>
            <div><span className="text-muted-foreground">Industry:</span> {req.industry ?? "—"}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Colors:</span> {req.brand_colors ?? "—"}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">References:</span> <span className="whitespace-pre-wrap">{req.reference_sites ?? "—"}</span></div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> <span className="whitespace-pre-wrap">{req.content_notes ?? "—"}</span></div>
            {req.logo_url && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground mb-1">Logo</div>
                <a href={req.logo_url} target="_blank" rel="noreferrer"><img src={req.logo_url} alt="logo" className="h-20 rounded border" /></a>
              </div>
            )}
            {Array.isArray(req.reference_images) && req.reference_images.length > 0 && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground mb-1">Reference images</div>
                <div className="flex flex-wrap gap-2">
                  {req.reference_images.map((u: string) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      <img src={u} alt="ref" className="h-20 w-20 object-cover rounded border" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-2 text-xs">
              {req.submitted ? <Badge>Submitted</Badge> : <Badge variant="outline">Draft</Badge>}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Post an update to client</h2>
        <div className="space-y-2">
          <Label>Stage</Label>
          <Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="e.g. Design draft ready" />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending || !stage || !message}
        >
          Send update
        </Button>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Update history</h2>
        {data.updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.updates.map((u: { id: string; stage: string; message: string | null; created_at: string }) => (
              <li key={u.id} className="border-l-2 border-primary/40 pl-3">
                <div className="font-medium">{u.stage}</div>
                {u.message && <div className="text-muted-foreground whitespace-pre-wrap">{u.message}</div>}
                <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.rating && (
        <Card className="p-5 space-y-2 text-sm">
          <h2 className="font-medium">Client rating</h2>
          <div className="text-2xl">{"★".repeat(data.rating.stars)}{"☆".repeat(5 - data.rating.stars)}</div>
          {data.rating.review && <p className="text-muted-foreground whitespace-pre-wrap">{data.rating.review}</p>}
        </Card>
      )}
    </div>
  );
}
