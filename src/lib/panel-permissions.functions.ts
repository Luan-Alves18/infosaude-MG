import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
