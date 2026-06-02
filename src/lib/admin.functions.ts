import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function ensureAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito ao administrador.");
}

function nameFromEmail(email: string | null | undefined) {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string } | undefined) =>
    z.object({ search: z.string().trim().max(200).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: requests } = await supabase
      .from("account_requests")
      .select("email, nome_completo")
      .order("created_at", { ascending: false });
    const nameByEmail = new Map<string, string>();
    for (const r of requests ?? []) {
      const key = (r.email ?? "").toLowerCase();
      if (key && !nameByEmail.has(key)) nameByEmail.set(key, r.nome_completo);
    }

    const { data: roleRows } = await supabase.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    const items = (profiles ?? []).map((p) => {
      const email = (p.email ?? "").toLowerCase();
      const name = nameByEmail.get(email) ?? p.display_name ?? nameFromEmail(email);
      return {
        id: p.id,
        email,
        name,
        created_at: p.created_at,
        roles: rolesByUser.get(p.id) ?? [],
      };
    });

    const q = (data.search ?? "").toLowerCase();
    const filtered = q
      ? items.filter((i) => i.email.includes(q) || i.name.toLowerCase().includes(q))
      : items;

    return { users: filtered };
  });

export const listPanelPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);
    const { data: rows, error } = await supabase
      .from("panel_permissions")
      .select("panel_id")
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { panelIds: (rows ?? []).map((r) => r.panel_id) };
  });

export const listPanelAccessRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);

    const { data, error } = await supabase
      .from("panel_access_requests")
      .select("id, user_id, user_email, user_name, panel_ids, motivo, status, created_at")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Mesma lógica de nome usada em listUsers: prioriza nome_completo de
    // account_requests, depois display_name do profile, depois deriva do e-mail.
    const { data: requestsRows } = await supabase
      .from("account_requests")
      .select("email, nome_completo")
      .order("created_at", { ascending: false });
    const nameByEmail = new Map<string, string>();
    for (const r of requestsRows ?? []) {
      const key = (r.email ?? "").toLowerCase();
      if (key && !nameByEmail.has(key)) nameByEmail.set(key, r.nome_completo);
    }

    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const profileNameByUserId = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        if (p.display_name) profileNameByUserId.set(p.id, p.display_name);
      }
    }

    return {
      requests: (data ?? []).map((request) => {
        const email = (request.user_email ?? "").toLowerCase();
        const resolvedName =
          nameByEmail.get(email) ??
          profileNameByUserId.get(request.user_id) ??
          nameFromEmail(email);
        return {
          id: request.id,
          userId: request.user_id,
          userEmail: request.user_email,
          userName: resolvedName,
          panelIds: request.panel_ids,
          motivo: request.motivo,
          status: request.status,
          createdAt: request.created_at,
        };
      }),
    };
  });


export const approvePanelAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string }) =>
    z.object({ requestId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, supabase } = context as {
      userId: string;
      supabase: SupabaseClient;
    };

    await ensureAdmin(supabase, adminId);

    const { data: request, error: requestError } = await supabase
      .from("panel_access_requests")
      .select("id, user_id, panel_ids, status")
      .eq("id", data.requestId)
      .maybeSingle();

    if (requestError) throw new Error(requestError.message);
    if (!request) throw new Error("Solicitação não encontrada.");

    const panelIds: string[] = Array.from(
      new Set(((request.panel_ids ?? []) as string[]).map((id: string) => String(id))),
    );

    if (panelIds.length > 0) {
      const { error: permissionError } = await supabase.from("panel_permissions").upsert(
        panelIds.map((panelId) => ({
          user_id: request.user_id,
          panel_id: panelId,
          granted_by: adminId,
        })),
        { onConflict: "user_id,panel_id" },
      );

      if (permissionError) throw new Error(permissionError.message);
    }

    if (request.status !== "aprovado") {
      const { error: updateError } = await supabase
        .from("panel_access_requests")
        .update({ status: "aprovado" })
        .eq("id", request.id);

      if (updateError) throw new Error(updateError.message);
    }

    return { ok: true as const, userId: request.user_id, panelIds };
  });

export const setPanelPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; panelId: string; granted: boolean }) =>
    z
      .object({
        userId: z.string().uuid(),
        panelId: z.string().min(1).max(100),
        granted: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, supabase } = context as {
      userId: string;
      supabase: SupabaseClient;
    };
    await ensureAdmin(supabase, adminId);
    if (data.granted) {
      const { error } = await supabase
        .from("panel_permissions")
        .upsert(
          { user_id: data.userId, panel_id: data.panelId, granted_by: adminId },
          { onConflict: "user_id,panel_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("panel_permissions")
        .delete()
        .eq("user_id", data.userId)
        .eq("panel_id", data.panelId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------- Account requests (criar conta) ----------

export const listAccountRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);

    const { data, error } = await supabase
      .from("account_requests")
      .select("id, nome_completo, email, instituicao, chefia_imediata, motivo, status, created_at")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      requests: (data ?? []).map((r) => ({
        id: r.id,
        nomeCompleto: r.nome_completo,
        email: r.email,
        instituicao: r.instituicao,
        chefiaImediata: r.chefia_imediata,
        motivo: r.motivo,
        status: r.status,
        createdAt: r.created_at,
      })),
    };
  });


export const approveAccountRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string }) =>
    z.object({ requestId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);

    const { data: req, error: reqErr } = await supabase
      .from("account_requests")
      .select("id, email, nome_completo, instituicao, status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);
    if (!req) throw new Error("Solicitação não encontrada.");

    const email = req.email.trim().toLowerCase();

    const origin =
      process.env.SITE_URL ||
      `https://project--6bcf2ab2-9482-479a-a655-be09a4f31797.lovable.app`;
    const redirectTo = `${origin}/auth/reset`;

    // Usa o client admin para CONVIDAR o usuário diretamente. Diferente do
    // signInWithOtp anon, o invite respeita o `redirectTo` informado mesmo
    // quando a Site URL do Supabase aponta para localhost — assim o link no
    // e-mail vai sempre para o domínio publicado do portal.
    let invitedUserId: string | undefined;
    const { data: inviteData, error: inviteErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          display_name: req.nome_completo,
          equipe_trabalho: req.instituicao,
        },
      });

    if (inviteErr) {
      const msg = inviteErr.message?.toLowerCase() ?? "";
      const alreadyRegistered =
        msg.includes("already") || msg.includes("registered") || msg.includes("exist");
      if (!alreadyRegistered) throw new Error(inviteErr.message);

      // Usuário já existe → envia magic link via admin.generateLink para o
      // mesmo `redirectTo`. Como a Supabase não dispara o e-mail nesse caso,
      // tentamos `signInWithOtp` como fallback que ENVIA o e-mail.
      const { error: otpErr } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      if (otpErr) throw new Error(otpErr.message);
    } else {
      invitedUserId = inviteData?.user?.id;
    }

    // Pré-preenche "Equipe de Trabalho" no profile a partir da instituição
    // informada na solicitação. Para usuários novos, aguarda o trigger
    // handle_new_user criar o profile; o update abaixo é idempotente.
    if (invitedUserId && req.instituicao) {
      await supabaseAdmin
        .from("profiles")
        .update({ equipe_trabalho: req.instituicao } as never)
        .eq("id", invitedUserId);
    }

    const { error: updErr } = await supabase
      .from("account_requests")
      .update({ status: "aprovado" })
      .eq("id", req.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true as const };
  });

export const rejectAccountRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string }) =>
    z.object({ requestId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);
    const { error } = await supabase
      .from("account_requests")
      .update({ status: "recusado" })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rejectPanelAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string }) =>
    z.object({ requestId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);
    const { error } = await supabase
      .from("panel_access_requests")
      .update({ status: "recusado" })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------- Estatísticas de visitas por painel ----------

export const getPanelVisitsStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { period: "week" | "month" | "year" }) =>
    z.object({ period: z.enum(["week", "month", "year"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as { userId: string; supabase: SupabaseClient };
    await ensureAdmin(supabase, userId);

    const now = Date.now();
    const days = data.period === "week" ? 7 : data.period === "month" ? 30 : 365;
    const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await supabase
      .from("portal_visits")
      .select("path")
      .gte("visited_at", since)
      .like("path", "/paineis/%")
      .limit(50000);

    if (error) throw new Error(error.message);

    const countsByPanelId = new Map<string, number>();
    for (const row of rows ?? []) {
      const m = /^\/paineis\/(\d+)/.exec(String(row.path ?? ""));
      if (!m) continue;
      const id = m[1];
      countsByPanelId.set(id, (countsByPanelId.get(id) ?? 0) + 1);
    }

    return {
      countsByPanelId: Object.fromEntries(countsByPanelId),
      since,
    };
  });
