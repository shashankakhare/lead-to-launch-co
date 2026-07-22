import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listPackagesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("packages_config")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const PackageSchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  pages: z.string().min(1).max(50),
  price_usd: z.number().min(0).max(1000000),
  tagline: z.string().max(200).default(""),
  features: z.array(z.string().max(200)).max(30),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
  cta_text: z.string().min(1).max(50).default("Get started"),
});

export const upsertPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PackageSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("packages_config")
      .upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("packages_config").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAddonsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("addons_config")
      .select("*")
      .order("kind", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AddonSchema = z.object({
  kind: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  price_usd: z.number().min(0).max(1000000),
  active: z.boolean().default(true),
});

export const upsertAddon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AddonSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("addons_config")
      .upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
