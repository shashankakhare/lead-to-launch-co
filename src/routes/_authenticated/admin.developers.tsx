import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listDevelopers,
  createDeveloper,
  removeDeveloper,
} from "@/lib/admin-developers.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/developers")({
  head: () => ({ meta: [{ title: "Admin · Developers" }] }),
  component: DevelopersPage,
});

function DevelopersPage() {
  const list = useServerFn(listDevelopers);
  const create = useServerFn(createDeveloper);
  const remove = useServerFn(removeDeveloper);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-developers"], queryFn: () => list() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", hourlyRate: "" });
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({
        data: {
          email: form.email,
          password: form.password,
          fullName: form.fullName || undefined,
          phone: form.phone || undefined,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        },
      });
      toast.success("Developer created");
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", phone: "", hourlyRate: "" });
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Disable this developer? They'll lose access; time and orders are preserved.")) return;
    try {
      await remove({ data: { id } });
      toast.success("Developer disabled");
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Developers</h1>
          <p className="text-sm text-muted-foreground">Manage your dev team, workloads and performance.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add developer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add developer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="dev-email">Email *</Label>
                <Input id="dev-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dev-password">Password *</Label>
                <Input id="dev-password" type="text" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dev-name">Full name</Label>
                <Input id="dev-name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dev-phone">Phone</Label>
                  <Input id="dev-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dev-rate">Hourly rate (USD)</Label>
                  <Input id="dev-rate" type="number" min="0" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid gap-3">
        {(data ?? []).map((d: any) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{d.full_name || d.email}</div>
                  {d.is_active === false && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{d.email}{d.phone ? ` · ${d.phone}` : ""}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{d.openCount}</div>
                  <div className="text-xs text-muted-foreground">open</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{d.hoursWeek}h</div>
                  <div className="text-xs text-muted-foreground">this week</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{d.avgRating > 0 ? d.avgRating.toFixed(1) : "—"}</div>
                  <div className="text-xs text-muted-foreground">rating</div>
                </div>
                <Link to="/admin/developers/$id" params={{ id: d.id }}>
                  <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Manage</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(d.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No developers yet. Invite your first one.
          </Card>
        )}
      </div>
    </div>
  );
}
