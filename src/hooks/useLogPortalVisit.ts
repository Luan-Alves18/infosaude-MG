import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registra UMA visita à entrada do portal por sessão de navegador.
 * - Só dispara na primeira montagem dentro da sessão (sessionStorage flag).
 * - Falhas são silenciosas: nunca devem quebrar a UI.
 * - A função roda imediatamente; assim que o portal for publicado,
 *   cada acesso novo passa a ser contabilizado automaticamente.
 */
export function useLogPortalVisit(path: string = "/") {
  useEffect(() => {
    const FLAG = `portal_visit_logged:${path}`;
    try {
      if (sessionStorage.getItem(FLAG)) return;
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
      .then(({ error }) => {
        if (!error) {
          try {
            sessionStorage.setItem(FLAG, "1");
          } catch {
            /* ignore */
          }
        }
      });
  }, [path]);
}