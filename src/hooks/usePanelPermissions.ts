import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyPanelPermissions } from "@/lib/panel-permissions.functions";
import { useAuth } from "@/hooks/useAuth";

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
    setLoading(true);
    fetchFn()
      .then((res) => setPanelIds(res.panelIds))
      .catch(() => setPanelIds([]))
      .finally(() => setLoading(false));
  }, [user, fetchFn]);

  return { panelIds, loading, canAccess: (id: string) => panelIds.includes(String(id)) };
}
