import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listSiteContent, upsertSiteContent } from "@/lib/admin-content.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({ meta: [{ title: "Admin · Content" }] }),
  component: AdminContentPage,
});

type Row = { key: string; value: any };

const SECTIONS: {
  key: string;
  label: string;
  fields: { name: string; label: string; type: "text" | "textarea" }[];
}[] = [
  {
    key: "hero",
    label: "Hero",
    fields: [
      { name: "eyebrow", label: "Eyebrow (small text above headline)", type: "text" },
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "sub", label: "Subheadline", type: "textarea" },
      { name: "cta_primary", label: "Primary CTA", type: "text" },
      { name: "cta_secondary", label: "Secondary CTA", type: "text" },
    ],
  },
  {
    key: "process",
    label: "Process (4 days)",
    fields: [
      { name: "title", label: "Section title", type: "text" },
      { name: "sub", label: "Section subtext", type: "textarea" },
    ],
  },
  {
    key: "footer",
    label: "Footer CTA",
    fields: [
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "sub", label: "Subtext", type: "textarea" },
      { name: "email", label: "Contact email", type: "text" },
    ],
  },
];

function AdminContentPage() {
  const listFn = useServerFn(listSiteContent);
  const { data, isLoading } = useQuery({ queryKey: ["admin-content"], queryFn: () => listFn() });
  const rows: Row[] = (data ?? []) as Row[];
  const byKey = new Map(rows.map((r) => [r.key, r.value ?? {}]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Landing page content</h1>
      <p className="text-sm text-muted-foreground">
        Leave any field blank to fall back to the built-in default text.
      </p>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {SECTIONS.map((s) => (
        <SectionEditor key={s.key} section={s} initial={byKey.get(s.key) ?? {}} />
      ))}
      <FaqEditor initial={byKey.get("faq") ?? {}} />
    </div>
  );
}

function SectionEditor({
  section,
  initial,
}: {
  section: (typeof SECTIONS)[number];
  initial: Record<string, string>;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>(initial);
  useEffect(() => setValues(initial), [initial]);
  const fn = useServerFn(upsertSiteContent);
  const save = useMutation({
    mutationFn: () => fn({ data: { key: section.key, value: values } }),
    onSuccess: () => {
      toast.success(`${section.label} saved`);
      qc.invalidateQueries({ queryKey: ["admin-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-medium">{section.label}</h2>
      <div className="grid gap-3">
        {section.fields.map((f) => (
          <div key={f.name} className="space-y-1">
            <Label>{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                rows={3}
                value={values[f.name] ?? ""}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            ) : (
              <Input
                value={values[f.name] ?? ""}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Save {section.label}
      </Button>
    </Card>
  );
}

function FaqEditor({ initial }: { initial: any }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<{ q: string; a: string }[]>(
    Array.isArray(initial?.items) ? initial.items : [],
  );
  useEffect(() => {
    setItems(Array.isArray(initial?.items) ? initial.items : []);
  }, [initial]);
  const fn = useServerFn(upsertSiteContent);
  const save = useMutation({
    mutationFn: () => fn({ data: { key: "faq", value: { items } } }),
    onSuccess: () => {
      toast.success("FAQ saved");
      qc.invalidateQueries({ queryKey: ["admin-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">FAQ</h2>
        <Button size="sm" variant="secondary" onClick={() => setItems([...items, { q: "", a: "" }])}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Leave FAQ empty to use the built-in default questions.
      </p>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 border border-white/5 rounded-md p-3">
          <div className="flex items-center justify-between">
            <Label>Q{i + 1}</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="Question"
            value={it.q}
            onChange={(e) => {
              const c = [...items];
              c[i] = { ...c[i], q: e.target.value };
              setItems(c);
            }}
          />
          <Textarea
            rows={3}
            placeholder="Answer"
            value={it.a}
            onChange={(e) => {
              const c = [...items];
              c[i] = { ...c[i], a: e.target.value };
              setItems(c);
            }}
          />
        </div>
      ))}
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Save FAQ
      </Button>
    </Card>
  );
}
