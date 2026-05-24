import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyPanelPermissions } from "@/lib/panel-permissions.functions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function usePanelPermissions() {
  const { user } = useAuth();
  const fetchFn = useServerFn(getMyPanelPermissions);
  const [panelIds, setPanelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPanelIds([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        if (!cancelled) {
          setPanelIds([]);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetchFn();
        if (!cancelled) setPanelIds(res.panelIds);
      } catch {
        if (!cancelled) setPanelIds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, fetchFn]);

  return { panelIds, loading, canAccess: (id: string) => panelIds.includes(String(id)) };
}
