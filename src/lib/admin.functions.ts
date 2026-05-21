import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
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
    const { userId } = context as { userId: string };
    await ensureAdmin(userId);

    const { data: usersRes, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    // Override name from account_requests when available
    const { data: requests } = await supabaseAdmin
      .from("account_requests")
      .select("email, nome_completo")
      .order("created_at", { ascending: false });
    const nameByEmail = new Map<string, string>();
    for (const r of requests ?? []) {
      if (!nameByEmail.has(r.email.toLowerCase())) {
        nameByEmail.set(r.email.toLowerCase(), r.nome_completo);
      }
    }

    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    const items = usersRes.users
      .map((u) => {
        const email = (u.email ?? "").toLowerCase();
        const name = nameByEmail.get(email) ?? nameFromEmail(email);
        return {
          id: u.id,
          email,
          name,
          created_at: u.created_at,
          roles: rolesByUser.get(u.id) ?? [],
        };
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

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
    const { userId } = context as { userId: string };
    await ensureAdmin(userId);
    const { data: rows, error } = await supabaseAdmin
      .from("panel_permissions")
      .select("panel_id")
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { panelIds: (rows ?? []).map((r) => r.panel_id) };
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
    const { userId: adminId } = context as { userId: string };
    await ensureAdmin(adminId);
    if (data.granted) {
      const { error } = await supabaseAdmin
        .from("panel_permissions")
        .upsert(
          { user_id: data.userId, panel_id: data.panelId, granted_by: adminId },
          { onConflict: "user_id,panel_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("panel_permissions")
        .delete()
        .eq("user_id", data.userId)
        .eq("panel_id", data.panelId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const getMyPanelPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as {
      supabase: import("@supabase/supabase-js").SupabaseClient;
      userId: string;
    };
    const { data, error } = await supabase
      .from("panel_permissions")
      .select("panel_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { panelIds: (data ?? []).map((r: { panel_id: string }) => r.panel_id) };
  });
