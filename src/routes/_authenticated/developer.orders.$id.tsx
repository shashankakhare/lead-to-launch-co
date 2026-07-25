import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, PlayCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { devGetOrder, devUpdateOrderStatus, devPostUpdate, devLogTime } from "@/lib/developer.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  "pending_payment", "paid", "requirements_pending", "in_progress", "review", "delivered", "cancelled",
] as const;

export const Route = createFileRoute("/_authenticated/developer/orders/$id")({
  head: () => ({ meta: [{ title: "Project · Developer" }] }),
  component: DevOrderDetail;
});

function DevOrderDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(devGetOrder);
  const updateStatus = useServerFn(devUpdateOrderStatus);
  const postUpdate = useServerFn(devPostUpdate);
  const logTime = useServerFn(devLogTime);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dev-order", id],
    queryFn: () => getFn({ data: { orderId: id } }),
  });

  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const statusMut = useMutation({
    mutationFn: (status: (typeof STATUSES)[number]) => updateStatus({ data: { orderId: id, status } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["dev-order", id] });
      qc.invalidateQueries({ queryKey: ["dev-orders"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: () => postUpdate({ data: { orderId: id, stage, message } }),
    onSuccess: () => {
      toast.success("Update posted");
      setStage(""); setMessage("");
      qc.invalidateQueries({ queryKey: ["dev-order", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const timeMut = useMutation({
    mutationFn: () => logTime({ data: { orderId: id, minutes: Number(minutes), note: note || undefined } }),
    onSuccess: () => {
      toast.success("Time logged");
      setMinutes(""); setNote("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const pkg = PACKAGES[data.order.package as keyof typeof PACKAGES];
  const req = data.requirements as any;
  const isClosed = data.order.status === "delivered" || data.order.status === "cancelled";

  return (
    <div className="space-y-6">
      <Link to="/developer" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to my projects
      </Link>

      <div>
        <div className="text-xs text-muted-foreground">#{data.order.id}</div>
        <h1 className="text-2xl font-semibold">{pkg?.name ?? data.order.package}</h1>
        <div className="flex items-center gap-3 text-sm mt-1">
          <Badge variant="secondary">{data.order.status}</Badge>
          <span className="text-muted-foreground">${Number(data.order.amount_usd).toFixed(0)} {data.order.currency}</span>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Project controls</h2>
          {isClosed ? <Badge variant="outline">Closed</Badge> : <Badge>Open</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => statusMut.mutate("in_progress")}
            disabled={statusMut.isPending || data.order.status === "in_progress"}
          >
            <PlayCircle className="h-4 w-4 mr-1" /> Open / Start work
          </Button>
          <Button
            variant="secondary"
            onClick={() => statusMut.mutate("review")}
            disabled={statusMut.isPending}
          >
            Send to review
          </Button>
          <Button
            onClick={() => statusMut.mutate("delivered")}
            disabled={statusMut.isPending || data.order.status === "delivered"}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Close as delivered
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Cancel this project? The client will be notified.")) statusMut.mutate("cancelled");
            }}
            disabled={statusMut.isPending || data.order.status === "cancelled"}
          >
            <XCircle className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </div>

        <div className="pt-2 border-t border-white/5">
          <Label className="text-xs text-muted-foreground">Or set exact status</Label>
          <Select
            value={data.order.status}
            onValueChange={(v) => statusMut.mutate(v as any)}
          >
            <SelectTrigger className="w-full sm:w-72 mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-5 space-y-2 text-sm">
        <h2 className="font-medium">Client</h2>
        <div>{data.profile?.full_name ?? "—"} · {data.profile?.email ?? "—"}</div>
        <div className="text-muted-foreground">
          {data.profile?.phone ?? "no phone"} · {data.profile?.company ?? "no company"}
        </div>
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
            <div className="sm:col-span-2"><span className="text-muted-foreground">Reference sites:</span> {req.reference_sites ?? "—"}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {req.content_notes ?? "—"}</div>
            {req.logo_url && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground mb-1">Logo</div>
                <img src={req.logo_url} alt="logo" className="h-16 rounded border" />
              </div>
            )}
            {Array.isArray(req.reference_images) && req.reference_images.length > 0 && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground mb-1">Reference images</div>
                <div className="flex flex-wrap gap-2">
                  {req.reference_images.map((u: string) => (
                    <img key={u} src={u} alt="ref" className="h-16 w-16 object-cover rounded border" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium">Post an update to the client</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Stage (e.g. Design, Build, Review)" value={stage} onChange={(e) => setStage(e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea placeholder="Message to the client" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <Button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending || !stage.trim() || !message.trim()}
        >
          {updateMut.isPending ? "Posting…" : "Post update"}
        </Button>

        {data.updates.length > 0 && (
          <ul className="space-y-2 text-sm pt-3 border-t border-white/5">
            {data.updates.map((u: any) => (
              <li key={u.id} className="border-l-2 border-primary/40 pl-3">
                <div className="font-medium">{u.stage}</div>
                {u.message && <div className="text-muted-foreground">{u.message}</div>}
                <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Log time</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input type="number" placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <div className="sm:col-span-2">
            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => timeMut.mutate()}
          disabled={timeMut.isPending || !minutes || Number(minutes) <= 0}
        >
          {timeMut.isPending ? "Saving…" : "Log time"}
        </Button>
      </Card>
    </div>
  );
}
