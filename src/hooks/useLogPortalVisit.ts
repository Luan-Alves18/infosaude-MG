import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registra UMA visita por sessão de navegador para o `path` informado.
 * - Marca a flag de "já registrado" SINCRONAMENTE antes do insert, evitando
 *   contagem duplicada quando o componente remonta (StrictMode, mudanças de
 *   estado de auth, etc.) e o `.then()` do insert ainda não rodou.
 * - Falhas são silenciosas: nunca devem quebrar a UI.
 */
// Flag global para pausar o registro de visitas. Quando `true`, o hook
// não envia nada para `portal_visits`. Reative trocando para `false`
// (e, opcionalmente, removendo este bloco) quando o cliente solicitar.
const VISIT_LOGGING_PAUSED = true;

export function useLogPortalVisit(path: string = "/") {
  useEffect(() => {
    if (VISIT_LOGGING_PAUSED) return;
    const FLAG = `portal_visit_logged:${path}`;
    try {
      if (sessionStorage.getItem(FLAG)) return;
      // Marca ANTES do insert para impedir remontagens de duplicar a contagem.
      sessionStorage.setItem(FLAG, "1");
    } catch {
      // sessionStorage indisponível — segue tentando registrar
    }

    let sessionId: string | null = null;
    try {
      sessionId = sessionStorage.getItem("portal_session_id");
      if (!sessionId) {
        sessionId =
          (crypto as Crypto).randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem("portal_session_id", sessionId);
      }
    } catch {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    (supabase as any)
      .from("portal_visits")
      .insert({
        session_id: sessionId,
        path,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      })
      .then(({ error }: any) => {
        if (error) {
          // Se o insert falhar, libera a flag para uma nova tentativa em
          // outra montagem dentro da mesma sessão.
          try {
            sessionStorage.removeItem(FLAG);
          } catch {
            /* ignore */
          }
        }
      });
  }, [path]);
}
