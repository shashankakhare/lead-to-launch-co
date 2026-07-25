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
  listAssignmentAuditLog,
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

      <AssignmentAuditCard orderId={id} />
    </div>
  );
}

function AssignmentAuditCard({ orderId }: { orderId: string }) {
  const listFn = useServerFn(listAssignmentAuditLog);
  const { data, isLoading } = useQuery({
    queryKey: ["assignment-audit", orderId],
    queryFn: () => listFn({ data: { orderId } }),
  });

  return (
    <Card className="p-5 space-y-3">
      <div>
        <h2 className="font-medium">Assignment audit log</h2>
        <p className="text-xs text-muted-foreground">
          Every auto-assignment decision for this order, including trigger, reason, and workload snapshot.
        </p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No assignment events recorded yet.</p>
      )}
      <ul className="space-y-3">
        {(data ?? []).map((row: any) => (
          <li key={row.id} className="rounded-md border p-3 text-sm space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{row.trigger_source}</Badge>
                <span className="font-medium">
                  {row.assigned_to_profile?.full_name ?? row.assigned_to_profile?.email ?? (row.assigned_to ? row.assigned_to.slice(0, 8) : "Unassigned")}
                </span>
                {row.previous_assignee && row.previous_assignee !== row.assigned_to && (
                  <span className="text-xs text-muted-foreground">
                    (was {row.previous_assignee_profile?.email ?? row.previous_assignee.slice(0, 8)})
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-muted-foreground">{row.reason}</p>
            {(row.candidate_count != null || row.active_project_count != null) && (
              <p className="text-xs text-muted-foreground">
                Candidates: {row.candidate_count ?? "—"} · Picked developer's active load: {row.active_project_count ?? "—"}
              </p>
            )}
            {row.initiated_by_profile && (
              <p className="text-xs text-muted-foreground">
                Initiated by {row.initiated_by_profile.email}
              </p>
            )}
            {row.workload_snapshot && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Workload snapshot</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(row.workload_snapshot, null, 2)}</pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}


type OrderRow = {
  id: string;
  package: string;
  status: string;
  amount_usd: number | string;
  currency: string;
  notes?: string | null;
  assigned_to?: string | null;
};

function EditOrderCard({ order }: { order: OrderRow }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const staffFn = useServerFn(listStaff);
  const updateFn = useServerFn(adminUpdateOrder);
  const deleteFn = useServerFn(adminDeleteOrder);
  const { data: staff } = useQuery({ queryKey: ["admin-staff"], queryFn: () => staffFn() });

  const [pkg, setPkg] = useState(order.package);
  const [amount, setAmount] = useState(Number(order.amount_usd));
  const [notes, setNotes] = useState(order.notes ?? "");
  const [assignedTo, setAssignedTo] = useState<string>(order.assigned_to ?? "unassigned");

  useEffect(() => {
    setPkg(order.package);
    setAmount(Number(order.amount_usd));
    setNotes(order.notes ?? "");
    setAssignedTo(order.assigned_to ?? "unassigned");
  }, [order.id]);

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          orderId: order.id,
          package: pkg as any,
          amount_usd: amount,
          notes,
          assigned_to: assignedTo === "unassigned" ? null : assignedTo,
        },
      }),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-order", order.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { orderId: order.id } }),
    onSuccess: () => {
      toast.success("Order deleted");
      navigate({ to: "/admin" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Edit order</h2>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => confirm("Delete this order permanently?") && del.mutate()}
        >
          Delete order
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Package</Label>
          <Select value={pkg} onValueChange={setPkg}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(PACKAGES).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Amount (USD)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Assigned developer</Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {(staff ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name ?? s.email ?? s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Internal notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>Save changes</Button>
    </Card>
  );
}

