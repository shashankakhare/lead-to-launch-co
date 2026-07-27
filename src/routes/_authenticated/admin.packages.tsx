import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listPackagesAdmin,
  upsertPackage,
  deletePackage,
  listAddonsAdmin,
  upsertAddon,
} from "@/lib/admin-packages.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/packages")({
  head: () => ({ meta: [{ title: "Admin · Packages" }] }),
  component: AdminPackagesPage,
});

type Pkg = {
  slug: string;
  name: string;
  pages: string;
  price_usd: number;
  tagline: string;
  features: string[];
  sort_order: number;
  active: boolean;
  cta_text: string;
};

type Addon = {
  kind: string;
  title: string;
  description: string;
  price_usd: number;
  active: boolean;
};

function AdminPackagesPage() {
  const pkgFn = useServerFn(listPackagesAdmin);
  const addonFn = useServerFn(listAddonsAdmin);
  const { data: pkgs, isLoading } = useQuery({ queryKey: ["admin-packages"], queryFn: () => pkgFn() });
  const { data: addons } = useQuery({ queryKey: ["admin-addons"], queryFn: () => addonFn() });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Packages</h1>
          <NewPackageButton existingSlugs={(pkgs ?? []).map((p) => p.slug)} />
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        <div className="grid gap-4">
          {(pkgs ?? []).map((p) => (
            <PackageEditor key={p.slug} initial={p as Pkg} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Add-ons</h2>
        <div className="grid gap-4">
          {(addons ?? []).map((a) => (
            <AddonEditor key={a.kind} initial={a as Addon} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PackageEditor({ initial }: { initial: Pkg }) {
  const qc = useQueryClient();
  const [p, setP] = useState<Pkg>({ ...initial, features: [...initial.features] });
  const upsertFn = useServerFn(upsertPackage);
  const delFn = useServerFn(deletePackage);

  const save = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          ...p,
          price_usd: Number(p.price_usd),
          sort_order: Number(p.sort_order),
        },
      }),
    onSuccess: () => {
      toast.success(`${p.name} saved`);
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => delFn({ data: { slug: initial.slug } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">slug: {p.slug}</div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={p.active} onCheckedChange={(v) => setP({ ...p, active: v })} />
            Active
          </label>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => confirm(`Delete package ${p.name}?`) && del.mutate()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </Field>
        <Field label="Pages label">
          <Input value={p.pages} onChange={(e) => setP({ ...p, pages: e.target.value })} />
        </Field>
        <Field label="Price (INR)">
          <Input
            type="number"
            value={p.price_usd}
            onChange={(e) => setP({ ...p, price_usd: Number(e.target.value) })}
          />
        </Field>
        <Field label="Sort order">
          <Input
            type="number"
            value={p.sort_order}
            onChange={(e) => setP({ ...p, sort_order: Number(e.target.value) })}
          />
        </Field>
        <Field label="Tagline" className="sm:col-span-2">
          <Input value={p.tagline} onChange={(e) => setP({ ...p, tagline: e.target.value })} />
        </Field>
        <Field label="CTA text">
          <Input value={p.cta_text} onChange={(e) => setP({ ...p, cta_text: e.target.value })} />
        </Field>
        <Field label="Features (one per line)" className="sm:col-span-2">
          <Textarea
            rows={6}
            value={p.features.join("\n")}
            onChange={(e) =>
              setP({ ...p, features: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) })
            }
          />
        </Field>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Save package
      </Button>
    </Card>
  );
}

function AddonEditor({ initial }: { initial: Addon }) {
  const qc = useQueryClient();
  const [a, setA] = useState<Addon>({ ...initial });
  const fn = useServerFn(upsertAddon);
  const save = useMutation({
    mutationFn: () => fn({ data: { ...a, price_usd: Number(a.price_usd) } }),
    onSuccess: () => {
      toast.success(`${a.title} saved`);
      qc.invalidateQueries({ queryKey: ["admin-addons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">kind: {a.kind}</div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={a.active} onCheckedChange={(v) => setA({ ...a, active: v })} />
          Active
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <Input value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} />
        </Field>
        <Field label="Price (INR)">
          <Input
            type="number"
            value={a.price_usd}
            onChange={(e) => setA({ ...a, price_usd: Number(e.target.value) })}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            rows={2}
            value={a.description}
            onChange={(e) => setA({ ...a, description: e.target.value })}
          />
        </Field>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Save add-on
      </Button>
    </Card>
  );
}

function NewPackageButton({ existingSlugs }: { existingSlugs: string[] }) {
  const qc = useQueryClient();
  const fn = useServerFn(upsertPackage);
  const create = useMutation({
    mutationFn: () => {
      let n = 1;
      let slug = `package_${n}`;
      while (existingSlugs.includes(slug)) slug = `package_${++n}`;
      return fn({
        data: {
          slug,
          name: "New package",
          pages: "1 page",
          price_usd: 99,
          tagline: "",
          features: [],
          sort_order: existingSlugs.length + 1,
          active: false,
          cta_text: "Get started",
        },
      });
    },
    onSuccess: () => {
      toast.success("Package created");
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
      <Plus className="h-4 w-4 mr-1" /> New package
    </Button>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
