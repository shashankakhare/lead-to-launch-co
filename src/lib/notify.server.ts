import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { PACKAGES, type PackageSlug } from "@/lib/packages";

const SITE_URL = "https://eazybuildwebsite.com";

type Audience = "client" | "developer" | "admin";

type Recipient = {
  userId: string;
  email: string | null;
  name: string | null;
  role: Audience;
};

type ProjectEventInput = {
  orderId: string;
  title: string;
  message: string;
  status?: string;
  /** Which roles should receive email + in-app notification. Defaults to all. */
  audiences?: Audience[];
  /** Notification bucket used for the in-app `notifications.type` column. */
  notificationType?: string;
  /** Idempotency key stem (without role suffix); dedupes retries per recipient. */
  eventKey: string;
};

async function loadRecipients(orderId: string, audiences: Audience[]): Promise<{
  recipients: Recipient[];
  order: { id: string; user_id: string; package: string; assigned_to: string | null } | null;
}> {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, package, assigned_to")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { recipients: [], order: null };

  const ids: string[] = [];
  if (audiences.includes("client")) ids.push(order.user_id);
  if (audiences.includes("developer") && order.assigned_to) ids.push(order.assigned_to);

  let adminIds: string[] = [];
  if (audiences.includes("admin")) {
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    adminIds = (admins ?? []).map((r) => r.user_id as string);
    ids.push(...adminIds);
  }

  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return { recipients: [], order };

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", uniqueIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));

  const recipients: Recipient[] = uniqueIds.map((id) => {
    const p = map.get(id);
    let role: Audience = "client";
    if (id === order.user_id) role = "client";
    else if (id === order.assigned_to) role = "developer";
    else if (adminIds.includes(id)) role = "admin";
    return { userId: id, email: p?.email ?? null, name: p?.full_name ?? null, role };
  });

  return { recipients, order };
}

function linkForRole(role: Audience, orderId: string): { url: string; label: string; path: string } {
  if (role === "developer") {
    const path = `/developer/orders/${orderId}`;
    return { url: `${SITE_URL}${path}`, label: "Open in developer panel →", path };
  }
  if (role === "admin") {
    const path = `/admin/orders/${orderId}`;
    return { url: `${SITE_URL}${path}`, label: "Open in admin panel →", path };
  }
  const path = `/orders/${orderId}`;
  return { url: `${SITE_URL}${path}`, label: "Open your project →", path };
}

/**
 * Emails the given audiences and creates in-app notifications for the same
 * users. Never throws — logs and continues on failure so a downstream email
 * outage cannot roll back the primary business action.
 */
export async function notifyProjectEvent(input: ProjectEventInput): Promise<void> {
  const audiences = input.audiences ?? ["client", "developer", "admin"];
  const notificationType = input.notificationType ?? "update";

  try {
    const { recipients, order } = await loadRecipients(input.orderId, audiences);
    if (!order) return;

    const pkg = PACKAGES[order.package as PackageSlug];
    const packageLabel = pkg ? `${pkg.name} — ${pkg.pages}` : String(order.package);

    for (const r of recipients) {
      const link = linkForRole(r.role, input.orderId);

      // In-app notification
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: r.userId,
          type: notificationType,
          title: input.title,
          body: input.message.slice(0, 240),
          link: link.path,
          order_id: input.orderId,
        });
      } catch (err) {
        console.error(`[notify] in-app failed for ${r.userId}`, err);
      }

      // Email
      if (!r.email) continue;
      try {
        const result = await sendTemplateEmail("project-event", r.email, {
          idempotencyKey: `${input.eventKey}-${r.role}-${r.userId}`,
          templateData: {
            recipientName: r.name ?? undefined,
            recipientRole: r.role,
            title: input.title,
            message: input.message,
            orderId: input.orderId.slice(0, 8),
            packageLabel,
            status: input.status,
            linkUrl: link.url,
            linkLabel: link.label,
          },
        });
        if (!result.sent) {
          console.warn(`[notify] email suppressed for ${r.email} (${input.eventKey})`);
        }
      } catch (err) {
        console.error(`[notify] email failed for ${r.email}`, err);
      }
    }
  } catch (err) {
    console.error(`[notify] notifyProjectEvent failed for order ${input.orderId}`, err);
  }
}
