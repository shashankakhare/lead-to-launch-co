import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listUsers, updateUserProfile, setUserRoles, deleteUser, type Role } from "@/lib/admin-users.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users" }] }),
  component: AdminUsersPage,
});

const ALL_ROLES: Role[] = ["admin", "developer", "client"];

function AdminUsersPage() {
  const listFn = useServerFn(listUsers);
  const delFn = useServerFn(deleteUser);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });

  const delMut = useMutation({
    mutationFn: (userId: string) => delFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users & roles</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="grid gap-3">
        {data?.map((u) => (
          <Card key={u.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="font-medium truncate">{u.full_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email ?? u.id}</div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {u.roles.length === 0 && <Badge variant="outline">no role</Badge>}
                {u.roles.map((r) => (
                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <EditUserDialog user={u} />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${u.email}? This removes their auth account too.`)) {
                    delMut.mutate(u.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        )}
      </div>
    </div>
  );
}

function EditUserDialog({
  user,
}: {
  user: { id: string; email: string | null; full_name: string | null; phone: string | null; company: string | null; roles: string[] };
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [company, setCompany] = useState(user.company ?? "");
  const [roles, setRoles] = useState<Role[]>(user.roles as Role[]);

  const updateProfile = useServerFn(updateUserProfile);
  const setRolesFn = useServerFn(setUserRoles);

  const save = useMutation({
    mutationFn: async () => {
      await updateProfile({
        data: { userId: user.id, full_name: fullName, phone, company },
      });
      await setRolesFn({ data: { userId: user.id, roles } });
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-col gap-2">
              {ALL_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={roles.includes(r)}
                    onCheckedChange={(v) =>
                      setRoles((prev) => (v ? [...prev, r] : prev.filter((x) => x !== r)))
                    }
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
