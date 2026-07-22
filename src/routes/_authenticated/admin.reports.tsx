import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getReports } from "@/lib/admin-stats.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { PACKAGES } from "@/lib/packages";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Admin · Reports" }] }),
  component: ReportsPage,
});

const TABS = ["Revenue", "Funnel", "Developers", "Satisfaction", "Time"] as const;
type Tab = (typeof TABS)[number];

function ReportsPage() {
  const fn = useServerFn(getReports);
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: () => fn() });
  const [tab, setTab] = useState<Tab>("Revenue");

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading reports…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Deep analytics across the business.</p>
      </div>

      <div className="flex gap-1 border-b border-white/5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Revenue" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Total revenue" value={`$${data.totalRevenue.toFixed(0)}`} />
            {Object.entries(data.revenueByPackage).map(([pkg, val]) => (
              <Kpi key={pkg} label={PACKAGES[pkg as keyof typeof PACKAGES]?.name ?? pkg} value={`$${Number(val).toFixed(0)}`} />
            ))}
          </div>
          <Card className="p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-medium">Revenue by package</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    "revenue-by-package.csv",
                    Object.entries(data.revenueByPackage).map(([pkg, val]) => ({ package: pkg, revenue_usd: val })),
                  )
                }
              >
                Export CSV
              </Button>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={Object.entries(data.revenueByPackage).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === "Funnel" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Created" value={data.funnel.created} />
          <Kpi label="Paid" value={data.funnel.paid} sub={pct(data.funnel.paid, data.funnel.created)} />
          <Kpi label="In progress" value={data.funnel.in_progress} sub={pct(data.funnel.in_progress, data.funnel.paid)} />
          <Kpi label="Delivered" value={data.funnel.delivered} sub={pct(data.funnel.delivered, data.funnel.paid)} />
        </div>
      )}

      {tab === "Developers" && (
        <Card className="p-4">
          <div className="flex justify-between mb-3">
            <h3 className="text-sm font-medium">Developer performance</h3>
            <Button variant="outline" size="sm" onClick={() => downloadCsv("developer-performance.csv", data.devPerf)}>
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2">Developer</th>
                  <th>Assigned</th>
                  <th>Delivered</th>
                  <th>Avg rating</th>
                  <th>Hours</th>
                  <th>Avg delivery (d)</th>
                </tr>
              </thead>
              <tbody>
                {data.devPerf.map((d: any) => (
                  <tr key={d.id} className="border-t border-white/5">
                    <td className="py-2">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.email}</div>
                    </td>
                    <td>{d.assignedCount}</td>
                    <td>{d.deliveredCount}</td>
                    <td>{d.avgRating > 0 ? d.avgRating.toFixed(1) : "—"}</td>
                    <td>{d.hours}</td>
                    <td>{d.avgDeliveryDays || "—"}</td>
                  </tr>
                ))}
                {data.devPerf.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      No developers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "Satisfaction" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Rating distribution</h3>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={data.ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="stars" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Recent feedback</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recentRatings.map((r: any) => (
                <div key={r.id ?? r.created_at} className="text-sm p-2 rounded bg-white/5">
                  <div className="text-amber-400">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                  {r.review && <p className="text-muted-foreground">{r.review}</p>}
                </div>
              ))}
              {data.recentRatings.length === 0 && <p className="text-sm text-muted-foreground">No ratings yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === "Time" && (
        <Card className="p-4">
          <div className="flex justify-between mb-3">
            <h3 className="text-sm font-medium">Team hours per week</h3>
            <Button variant="outline" size="sm" onClick={() => downloadCsv("team-hours.csv", data.timeSeries)}>
              Export CSV
            </Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return `${Math.round((a / b) * 100)}% of prev`;
}
