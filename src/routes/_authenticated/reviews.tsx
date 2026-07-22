import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";

const listMyRatings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ratings")
      .select("id, stars, review, created_at, order_id")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Reviews · Building Website Now" }] }),
  component: Reviews,
});

function Reviews() {
  const fn = useServerFn(listMyRatings);
  const { data } = useQuery({ queryKey: ["my-ratings"], queryFn: () => fn() });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your reviews</h1>
        <p className="text-sm text-muted-foreground">Feedback you've given on delivered projects.</p>
      </div>
      {(!data || data.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No reviews yet. Once a project is delivered you can rate it.
        </Card>
      )}
      <div className="grid gap-3">
        {data?.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < r.stars ? "fill-primary" : "opacity-30"}`}
                />
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.review && <p className="text-sm mt-2">{r.review}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
