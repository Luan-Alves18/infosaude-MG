import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

    return {
      requests: (data ?? []).map((request) => ({
        id: request.id,
        userId: request.user_id,
        userEmail: request.user_email,
        userName: request.user_name ?? nameFromEmail(request.user_email),
        panelIds: request.panel_ids,
        motivo: request.motivo,
        status: request.status,
        createdAt: request.created_at,
      })),
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
