import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/lib/admin-stats.functions";
import { PACKAGES, formatInr } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  Rocket,
  ClipboardList,
  Star,
  Users,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin overview" }] }),
  component: OverviewPage,
});

const COLORS = ["hsl(var(--primary))", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ec4899"];

function OverviewPage() {
  const fn = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading overview…</p>;

  const { kpi, charts, recentOrders, recentUpdates, alerts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Live operations snapshot.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={DollarSign} label="Revenue" value={`$${kpi.totalRevenue.toFixed(0)}`} />
        <Kpi icon={ShoppingBag} label="Orders / mo" value={kpi.ordersThisMonth} />
        <Kpi icon={Rocket} label="Active projects" value={kpi.active} />
        <Kpi icon={ClipboardList} label="Awaiting reqs" value={kpi.pendingReqs} />
        <Kpi icon={Star} label="Avg rating" value={kpi.avgRating > 0 ? kpi.avgRating.toFixed(1) : "—"} />
        <Kpi icon={Users} label="Clients" value={kpi.totalClients} />
      </div>

      {/* Alerts */}
      {(alerts.unassignedPaidCount > 0 || alerts.pendingReqsCount > 0) && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm space-y-1">
              {alerts.unassignedPaidCount > 0 && (
                <p>
                  <strong>{alerts.unassignedPaidCount}</strong> paid order{alerts.unassignedPaidCount > 1 ? "s" : ""} unassigned.{" "}
                  <Link to="/admin/orders" className="text-primary hover:underline">Review →</Link>
                </p>
              )}
              {alerts.pendingReqsCount > 0 && (
                <p>
                  <strong>{alerts.pendingReqsCount}</strong> project{alerts.pendingReqsCount > 1 ? "s" : ""} awaiting client requirements.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Revenue — last 12 weeks</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={charts.weeks}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Orders by status</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={charts.statusDist} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                  {charts.statusDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Package mix</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={charts.packageMix}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Signups per week</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={charts.signups}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Recent orders</h3>
          <div className="space-y-2">
            {recentOrders.map((o: any) => (
              <Link key={o.id} to="/admin/orders/$id" params={{ id: o.id }} className="flex items-center justify-between text-sm p-2 rounded hover:bg-white/5">
                <div>
                  <div>{PACKAGES[o.package as keyof typeof PACKAGES]?.name ?? o.package}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.client?.email ?? o.user_id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatInr(Number(o.amount_usd))}</span>
                  <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Latest updates</h3>
          <div className="space-y-2">
            {recentUpdates.map((u: any) => (
              <div key={u.id} className="text-sm p-2 rounded hover:bg-white/5">
                <div className="font-medium">{u.stage}</div>
                <div className="text-xs text-muted-foreground truncate">{u.message}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleString()}</div>
              </div>
            ))}
            {recentUpdates.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </Card>
  );
}
