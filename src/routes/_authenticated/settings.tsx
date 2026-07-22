import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · Building Website Now" }] }),
  component: Settings,
});

function Settings() {
  const getFn = useServerFn(getMyProfile);
  const updFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => getFn() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (data) {
      setFullName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      setCompany(data.company ?? "");
      setAvatarUrl(data.avatar_url ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updFn({ data: { fullName, phone, company, avatarUrl } }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and account.</p>
      </div>
      <Card className="p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={data?.email ?? ""} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1…" />
          </div>
          <div className="grid gap-1.5">
            <Label>Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Avatar URL</Label>
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
