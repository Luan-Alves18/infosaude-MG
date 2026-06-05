/**
 * MODO ELEITORAL — Flag de conformidade com vedações eleitorais (Lei 9.504/97).
 *
 * Como funciona
 * -------------
 * - Controlado pela variável `VITE_MODO_ELEITORAL` em `.env`.
 *   - `"true"`  → modo eleitoral ATIVO (esconde conteúdo institucional vedado).
 *   - `"false"` (ou ausente) → modo NORMAL (layout permanente completo).
 * - Nenhum componente é removido do código. Os elementos vedados ficam
 *   envolvidos por `<HideInModoEleitoral>` (ou checados via `isModoEleitoral()`),
 *   garantindo que basta alternar a flag para voltar ao layout permanente,
 *   integrando automaticamente qualquer funcionalidade adicionada nesse meio-tempo.
 *
 * Como ativar antes de uma eleição
 * --------------------------------
 *   1. No `.env`: VITE_MODO_ELEITORAL="true"
 *   2. Republicar o portal.
 *
 * Como reverter (período pós-eleitoral)
 * -------------------------------------
 *   1. No `.env`: VITE_MODO_ELEITORAL="false"
 *   2. Republicar. O layout original volta integralmente — incluindo novas
 *      funcionalidades adicionadas durante o período eleitoral.
 *
 * Uso em componentes
 * ------------------
 *   import { HideInModoEleitoral, ShowOnlyInModoEleitoral, isModoEleitoral } from "@/lib/modoEleitoral";
 *
 *   // Esconder durante o período eleitoral:
 *   <HideInModoEleitoral>
 *     <FichaTecnica />
 *   </HideInModoEleitoral>
 *
 *   // Substituir conteúdo:
 *   {isModoEleitoral() ? <TextoNeutro /> : <TextoInstitucional />}
 *
 *   // Mostrar apenas durante o período eleitoral (ex.: aviso):
 *   <ShowOnlyInModoEleitoral>
 *     <p>Algumas informações estão temporariamente indisponíveis.</p>
 *   </ShowOnlyInModoEleitoral>
 */

import type { ReactNode } from "react";

/** Retorna `true` se o modo eleitoral estiver ativo. */
export const isModoEleitoral = (): boolean =>
  String(import.meta.env.VITE_MODO_ELEITORAL ?? "false").toLowerCase() === "true";

/** Esconde os filhos quando o modo eleitoral está ATIVO. */
export const HideInModoEleitoral = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  /** Conteúdo opcional a renderizar no lugar durante o modo eleitoral. */
  fallback?: ReactNode;
}) => (isModoEleitoral() ? <>{fallback}</> : <>{children}</>);

/** Renderiza os filhos APENAS quando o modo eleitoral está ATIVO. */
export const ShowOnlyInModoEleitoral = ({ children }: { children: ReactNode }) =>
  isModoEleitoral() ? <>{children}</> : null;
