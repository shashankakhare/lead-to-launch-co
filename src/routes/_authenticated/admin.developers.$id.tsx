import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getDeveloper,
  updateDeveloper,
  adminUpsertTimeEntry,
  adminDeleteTimeEntry,
} from "@/lib/admin-developers.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { PACKAGES } from "@/lib/packages";

export const Route = createFileRoute("/_authenticated/admin/developers/$id")({
  head: () => ({ meta: [{ title: "Admin · Developer" }] }),
  component: DeveloperDetail,
});

function DeveloperDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getDeveloper);
  const updateFn = useServerFn(updateDeveloper);
  const upsertTime = useServerFn(adminUpsertTimeEntry);
  const deleteTime = useServerFn(adminDeleteTimeEntry);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-dev", id], queryFn: () => getFn({ data: { id } }) });

  const [form, setForm] = useState({
    fullName: "", phone: "", hourlyRate: "", weeklyCapacityHours: "40", isActive: true, skills: "",
  });

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        fullName: p.full_name ?? "",
        phone: p.phone ?? "",
        hourlyRate: p.hourly_rate?.toString() ?? "",
        weeklyCapacityHours: p.weekly_capacity_hours?.toString() ?? "40",
        isActive: p.is_active !== false,
        skills: (p.skills ?? []).join(", "),
      });
    }
  }, [data?.profile]);

  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id,
          fullName: form.fullName,
          phone: form.phone,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          weeklyCapacityHours: Number(form.weeklyCapacityHours) || 0,
          isActive: form.isActive,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["admin-dev", id] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  // Time entry form
  const [teForm, setTeForm] = useState({ startedAt: "", minutes: "", orderId: "", note: "" });
  async function addTime(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertTime({
        data: {
          developerId: id,
          startedAt: teForm.startedAt || new Date().toISOString(),
          minutes: Number(teForm.minutes) || 0,
          orderId: teForm.orderId || null,
          note: teForm.note || undefined,
        },
      });
      toast.success("Time entry added");
      setTeForm({ startedAt: "", minutes: "", orderId: "", note: "" });
      qc.invalidateQueries({ queryKey: ["admin-dev", id] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function removeTime(entryId: string) {
    if (!confirm("Delete this time entry?")) return;
    await deleteTime({ data: { id: entryId } });
    qc.invalidateQueries({ queryKey: ["admin-dev", id] });
  }

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const totalMins = data.timeEntries.reduce((s: number, t: any) => s + (t.minutes || 0), 0);
  const avgRating = data.ratings.length > 0
    ? data.ratings.reduce((s: number, r: any) => s + Number(r.stars || 0), 0) / data.ratings.length
    : 0;

  return (
    <div className="space-y-5">
      <Link to="/admin/developers" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to developers
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={data.profile.email ?? ""} disabled />
            </div>
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Hourly rate (USD)</Label>
              <Input type="number" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Weekly capacity (h)</Label>
              <Input type="number" value={form.weeklyCapacityHours} onChange={(e) => setForm((f) => ({ ...f, weeklyCapacityHours: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Active</Label>
              <div className="pt-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} /></div>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Skills (comma separated)</Label>
            <Input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} placeholder="wordpress, elementor, seo" />
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-medium">Summary</h3>
          <Stat label="Assigned" value={data.orders.length} />
          <Stat label="Delivered" value={data.orders.filter((o: any) => o.status === "delivered").length} />
          <Stat label="Hours logged" value={`${(totalMins / 60).toFixed(1)}h`} />
          <Stat label="Avg rating" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} />
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Assigned projects</h3>
        <div className="space-y-2">
          {data.orders.map((o: any) => (
            <Link key={o.id} to="/admin/orders/$id" params={{ id: o.id }} className="flex items-center justify-between text-sm p-2 rounded hover:bg-white/5">
              <div>
                <div>{PACKAGES[o.package as keyof typeof PACKAGES]?.name ?? o.package} · #{o.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
              </div>
              <Badge variant="secondary">{o.status}</Badge>
            </Link>
          ))}
          {data.orders.length === 0 && <p className="text-sm text-muted-foreground">No projects assigned.</p>}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Time entries</h3>
        <form onSubmit={addTime} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
          <Input type="datetime-local" value={teForm.startedAt} onChange={(e) => setTeForm((f) => ({ ...f, startedAt: e.target.value }))} required />
          <Input type="number" placeholder="Minutes" value={teForm.minutes} onChange={(e) => setTeForm((f) => ({ ...f, minutes: e.target.value }))} required />
          <Input placeholder="Order ID (optional)" value={teForm.orderId} onChange={(e) => setTeForm((f) => ({ ...f, orderId: e.target.value }))} />
          <Textarea placeholder="Note" value={teForm.note} onChange={(e) => setTeForm((f) => ({ ...f, note: e.target.value }))} className="min-h-[36px]" />
          <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground text-left">
              <tr>
                <th className="py-2">When</th>
                <th>Minutes</th>
                <th>Order</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.timeEntries.map((t: any) => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className="py-2">{new Date(t.started_at).toLocaleString()}</td>
                  <td>{t.minutes}</td>
                  <td className="text-xs text-muted-foreground">{t.order_id ? t.order_id.slice(0, 8) : "—"}</td>
                  <td className="text-xs">{t.note}</td>
                  <td>
                    <Button variant="ghost" size="icon" onClick={() => removeTime(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.timeEntries.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-sm border-b border-white/5 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
