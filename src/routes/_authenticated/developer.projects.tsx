import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listMyAssignedOrders } from "@/lib/developer.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUSES = ["all", "pending_payment", "paid", "requirements_pending", "in_progress", "review", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/_authenticated/developer/projects")({
  head: () => ({ meta: [{ title: "All assigned · Developer" }] }),
  component: DeveloperProjects,
});

function DeveloperProjects() {
  const fn = useServerFn(listMyAssignedOrders);
  const { data, isLoading } = useQuery({ queryKey: ["dev-orders"], queryFn: () => fn() });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const orders = (data ?? []).filter((o: any) => {
    if (status !== "all" && o.status !== status) return false;
    if (q) {
      const hay = `${o.id} ${o.profile?.email ?? ""} ${o.profile?.full_name ?? ""} ${o.package}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Search by client, package, or ID" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-sm" />
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="divide-y divide-white/5">
        {orders.map((o: any) => {
          const pkg = PACKAGES[o.package as keyof typeof PACKAGES];
          return (
            <Link
              key={o.id}
              to="/developer/orders/$id"
              params={{ id: o.id }}
              className="flex items-center justify-between py-3 hover:bg-white/5 rounded-md px-2 -mx-2"
            >
              <div>
                <div className="text-sm font-medium">{pkg?.name ?? o.package} · #{o.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">
                  {o.profile?.full_name ?? o.profile?.email ?? "Client"} · {new Date(o.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant="secondary">{o.status}</Badge>
            </Link>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No projects match.</p>}
      </div>
    </Card>
  );
}
