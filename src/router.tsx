import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Defaults sensatos para reduzir requisições duplicadas e melhorar a
  // percepção de velocidade do portal. Por padrão, o React Query refaz a
  // requisição em cada montagem (staleTime: 0); aqui cacheamos por 1 min
  // e mantemos em memória por 5 min, o que dedupa chamadas iguais (ex.:
  // listFavorites, getMyPanelPermissions, getMyProfile) feitas em telas
  // diferentes em sequência.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload em hover/focus + cache curto para que rotas pré-carregadas
    // não disparem novas requisições ao navegar.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
