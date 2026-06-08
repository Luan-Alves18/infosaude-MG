import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { safeDbError } from "@/lib/db-error";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, created_at, equipe_trabalho")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw safeDbError(error, "Não foi possível carregar o perfil.");
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { display_name?: string; equipe_trabalho?: string | null }) =>
    z
      .object({
        display_name: z.string().trim().min(1).max(150).optional(),
        equipe_trabalho: z.string().trim().max(200).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    const patch: Record<string, unknown> = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.equipe_trabalho !== undefined)
      patch.equipe_trabalho = data.equipe_trabalho === "" ? null : data.equipe_trabalho;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) throw safeDbError(error, "Não foi possível atualizar o perfil.");
    return { ok: true };
  });
