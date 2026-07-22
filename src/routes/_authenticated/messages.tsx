import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyThreads } from "@/lib/messages.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages · Building Website Now" }] }),
  component: MessagesLayout,
});

function MessagesLayout() {
  const fn = useServerFn(listMyThreads);
  const { data } = useQuery({ queryKey: ["threads"], queryFn: () => fn() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeId = pathname.split("/messages/")[1];

  return (
    <div className="max-w-6xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with your developer, per project.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[300px_1fr] min-h-[60vh]">
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto">
            {(!data || data.length === 0) && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessagesSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                No projects yet.
              </div>
            )}
            {data?.map((t) => (
              <Link
                key={t.orderId}
                to="/messages/$id"
                params={{ id: t.orderId }}
                className={`block p-3 hover:bg-muted/40 transition ${
                  activeId === t.orderId ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">
                    {PACKAGES[t.package as keyof typeof PACKAGES]?.name ?? "Project"}
                  </div>
                  {t.unread > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{t.unread}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {t.lastMessage ?? "No messages yet"}
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
