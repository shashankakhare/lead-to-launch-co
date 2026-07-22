import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { listThreadMessages, markThreadRead, sendMessage } from "@/lib/messages.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: Thread,
});

function Thread() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(listThreadMessages);
  const sendFn = useServerFn(sendMessage);
  const markFn = useServerFn(markThreadRead);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: msgs } = useQuery({
    queryKey: ["thread", id],
    queryFn: () => listFn({ data: { orderId: id } }),
  });

  const send = useMutation({
    mutationFn: (b: string) => sendFn({ data: { orderId: id, body: b } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["thread", id] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  useEffect(() => {
    markFn({ data: { orderId: id } }).then(() => qc.invalidateQueries({ queryKey: ["threads"] }));
  }, [id, markFn, qc]);

  useEffect(() => {
    const ch = supabase
      .channel(`msgs-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["thread", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs]);

  return (
    <Card className="flex flex-col h-[70vh] overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {(!msgs || msgs.length === 0) && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Send the first one below.
          </div>
        )}
        {msgs?.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {!mine && (
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">
                    {m.sender_role === "admin" ? "Developer" : "Client"}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className="text-[10px] opacity-60 mt-1 text-right">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) send.mutate(body.trim());
        }}
        className="border-t border-white/5 p-3 flex gap-2 items-end"
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (body.trim()) send.mutate(body.trim());
            }
          }}
        />
        <Button type="submit" size="icon" disabled={!body.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
