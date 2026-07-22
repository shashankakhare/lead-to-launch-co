import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, phone, company, avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fullName?: string; phone?: string; company?: string; avatarUrl?: string }) =>
    z
      .object({
        fullName: z.string().max(200).optional(),
        phone: z.string().max(50).optional(),
        company: z.string().max(200).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        avatar_url: data.avatarUrl || null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
