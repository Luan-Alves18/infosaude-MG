import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { display_name: string }) =>
    z.object({ display_name: z.string().trim().min(1).max(150) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: data.display_name })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
