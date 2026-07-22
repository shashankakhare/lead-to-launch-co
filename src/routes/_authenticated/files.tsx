import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FileDown, ImageIcon } from "lucide-react";
import { listMyOrders, getMyOrder } from "@/lib/orders.functions";
import { PACKAGES } from "@/lib/packages";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/files")({
  head: () => ({ meta: [{ title: "Files · Building Website Now" }] }),
  component: FilesPage,
});

function FilesPage() {
  const ordersFn = useServerFn(listMyOrders);
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: () => ordersFn() });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Files & deliverables</h1>
        <p className="text-sm text-muted-foreground">
          Your uploaded brand assets and the final deliverables from your developer.
        </p>
      </div>

      {(!orders || orders.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No projects yet.
        </Card>
      )}
      {orders?.map((o) => (
        <OrderFilesBlock key={o.id} orderId={o.id} pkg={o.package} />
      ))}
    </div>
  );
}

function OrderFilesBlock({ orderId, pkg }: { orderId: string; pkg: string }) {
  const getFn = useServerFn(getMyOrder);
  const { data } = useQuery({
    queryKey: ["order-files", orderId],
    queryFn: () => getFn({ data: { orderId } }),
  });
  const req = data?.requirements as
    | { logo_url?: string | null; reference_images?: string[] | null }
    | undefined;
  const logo = req?.logo_url;
  const refs = req?.reference_images ?? [];
  const anything = logo || refs.length > 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium">
            {PACKAGES[pkg as keyof typeof PACKAGES]?.name ?? "Project"}
          </div>
          <div className="text-xs text-muted-foreground">#{orderId.slice(0, 8)}</div>
        </div>
        <Link
          to="/orders/$id"
          params={{ id: orderId }}
          className="text-xs text-primary hover:underline"
        >
          Open project
        </Link>
      </div>
      {!anything && (
        <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
          No files yet. Upload logo & references from the project page.
        </div>
      )}
      {anything && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {logo && (
            <a
              href={logo}
              target="_blank"
              rel="noreferrer"
              className="group border rounded-lg p-3 hover:border-primary/40 transition flex flex-col items-center gap-2"
            >
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <div className="text-xs">Logo</div>
              <FileDown className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
            </a>
          )}
          {refs.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group border rounded-lg overflow-hidden hover:border-primary/40 transition aspect-square bg-muted/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
