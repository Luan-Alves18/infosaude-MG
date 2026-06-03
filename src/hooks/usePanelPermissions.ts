import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPanelPermissions } from "@/lib/panel-permissions.functions";
import { useAuth } from "@/hooks/useAuth";

/**
 * Permissões de painéis do usuário atual, com cache compartilhado entre
 * páginas via React Query. Antes esse hook fazia um fetch em cada
 * montagem, gerando chamadas duplicadas ao alternar entre /paineis,
 * /perfil e /paineis/$id. Com o cache padrão (staleTime 60s definido
 * no router), o resultado é reutilizado.
 */
export function usePanelPermissions() {
  const { user, session } = useAuth();
  const fetchFn = useServerFn(getMyPanelPermissions);

  const { data, isLoading } = useQuery({
    queryKey: ["panel-permissions", user?.id ?? null],
    enabled: Boolean(user && session?.access_token),
    queryFn: async () => {
      const res = await fetchFn();
      return res.panelIds;
    },
  });

  const panelIds = data ?? [];
  return {
    panelIds,
    loading: isLoading,
    canAccess: (id: string) => panelIds.includes(String(id)),
  };
}
