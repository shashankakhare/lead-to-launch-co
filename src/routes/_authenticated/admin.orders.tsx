import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { listAllOrders, adminBackfillAssignments } from "@/lib/admin.functions";
import { PACKAGES, formatInr } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Admin · Orders" }] }),
  component: AdminOrders,
});

const STATUSES = ["all", "pending_payment", "paid", "requirements_pending", "in_progress", "review", "delivered", "cancelled"];

function AdminOrders() {
  const fn = useServerFn(listAllOrders);
  const backfillFn = useServerFn(adminBackfillAssignments);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => fn() });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const unassignedPaidCount = useMemo(
    () =>
      (data ?? []).filter(
        (o: any) =>
          !o.assigned_to &&
          ["paid", "requirements_pending", "in_progress", "review"].includes(o.status),
      ).length,
    [data],
  );

  const backfill = useMutation({
    mutationFn: () => backfillFn(),
    onSuccess: (res: any) => {
      toast.success(`Auto-assigned ${res.assigned} of ${res.total} project${res.total === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    return (data ?? []).filter((o: any) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        (o.profile?.email ?? "").toLowerCase().includes(s) ||
        (o.profile?.full_name ?? "").toLowerCase().includes(s) ||
        o.package.toLowerCase().includes(s)
      );
    });
  }, [data, q, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">All orders</h1>
          {unassignedPaidCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unassignedPaidCount} paid project{unassignedPaidCount === 1 ? "" : "s"} without a developer.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={backfill.isPending || unassignedPaidCount === 0}
            onClick={() => backfill.mutate()}
            title="Auto-assign every unassigned paid/active project to the lowest-workload developer"
          >
            {backfill.isPending ? "Assigning…" : `Auto-assign ${unassignedPaidCount || ""}`.trim()}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "orders.csv",
                rows.map((o: any) => ({
                  id: o.id,
                  package: o.package,
                  amount_usd: o.amount_usd,
                  status: o.status,
                  client: o.profile?.email ?? "",
                  assigned_to: o.assigned_to ?? "",
                  created_at: o.created_at,
                })),
              )
            }
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search by client, id, package…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-2 py-1 rounded border ${status === s ? "bg-primary/20 border-primary/40" : "border-white/10 hover:bg-white/5"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="grid gap-2">
        {rows.map((o: any) => {
          const pkg = PACKAGES[o.package as keyof typeof PACKAGES];
          return (
            <Link key={o.id} to="/admin/orders/$id" params={{ id: o.id }}>
              <Card className="p-4 flex items-center justify-between hover:border-primary/40 transition">
                <div>
                  <div className="font-medium">
                    {pkg?.name ?? o.package} — {o.profile?.email ?? o.profile?.full_name ?? o.user_id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">{formatInr(Number(o.amount_usd))}</div>
                  <Badge variant="secondary">{o.status}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
        {!isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground">No orders match.</p>}
      </div>
    </div>
  );
}
