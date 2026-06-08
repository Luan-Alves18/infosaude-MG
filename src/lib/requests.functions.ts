import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { safeDbError } from "@/lib/db-error";

const accountReqSchema = z.object({
  nome_completo: z.string().trim().min(1).max(200),
  instituicao: z.string().trim().min(1).max(200),
  chefia_imediata: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  motivo: z.string().trim().min(1).max(2000),
});

export const createAccountRequest = createServerFn({ method: "POST" })
  .inputValidator((input) => accountReqSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("account_requests").insert({
      nome_completo: data.nome_completo,
      instituicao: data.instituicao,
      chefia_imediata: data.chefia_imediata,
      email: data.email.toLowerCase(),
      motivo: data.motivo,
    });
    if (error) {
      // Mascarar erros conhecidos para não expor schema/constraints
      console.error("[createAccountRequest]", error.message);
      if (/Muitas solicitações/i.test(error.message)) {
        throw new Error("Muitas solicitações deste e-mail. Tente novamente amanhã.");
      }
      throw new Error("Não foi possível enviar sua solicitação. Tente novamente.");
    }
    return { ok: true };
  });

const panelReqSchema = z.object({
  panel_ids: z.array(z.string().min(1)).min(1).max(50),
  motivo: z.string().trim().min(1).max(2000),
});

export const createPanelAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => panelReqSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as {
      supabase: import("@supabase/supabase-js").SupabaseClient;
      userId: string;
      claims: { email?: string };
    };
    const email = claims.email ?? "";
    const name = email.includes("@")
      ? email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : email;

    const { error } = await supabase.from("panel_access_requests").insert({
      user_id: userId,
      user_email: email,
      user_name: name,
      panel_ids: data.panel_ids,
      motivo: data.motivo,
    });
    if (error) throw safeDbError(error, "Não foi possível enviar a solicitação.");
    return { ok: true };
  });
