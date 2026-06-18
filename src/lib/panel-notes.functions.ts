import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { safeDbError } from "@/lib/db-error";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getPanelNote = createServerFn({ method: "POST" })
  .inputValidator((input: { panelId: string }) =>
    z.object({ panelId: z.string().min(1).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("panel_notes")
      .select("content, updated_at")
      .eq("panel_id", data.panelId)
      .maybeSingle();
    if (error) throw safeDbError(error, "Não foi possível carregar a nota técnica.");
    return { content: row?.content ?? "", updatedAt: row?.updated_at ?? null };
  });

export const upsertPanelNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { panelId: string; content: string }) =>
    z
      .object({
        panelId: z.string().min(1).max(100),
        content: z.string().max(20000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    // Confere se o usuário é admin via has_role (RLS já bloqueia, mas damos mensagem clara)
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas administradores podem editar notas técnicas.");
    const { error } = await supabase
      .from("panel_notes")
      .upsert(
        { panel_id: data.panelId, content: data.content, updated_by: userId, updated_at: new Date().toISOString() },
        { onConflict: "panel_id" },
      );
    if (error) throw safeDbError(error, "Não foi possível salvar a nota técnica.");
    return { ok: true };
  });

export const listAllPanelNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    // Apenas Owner pode listar todas as notas técnicas.
    const { data: isOwner } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "owner",
    });
    if (!isOwner) throw new Error("Acesso restrito ao perfil Owner.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("panel_notes")
      .select("panel_id, content, updated_at");
    if (error) throw safeDbError(error, "Não foi possível carregar as notas técnicas.");
    return {
      notes: (data ?? []).map((r: { panel_id: string; content: string | null; updated_at: string | null }) => ({
        panelId: String(r.panel_id),
        content: r.content ?? "",
        updatedAt: r.updated_at,
      })),
    };
  });
