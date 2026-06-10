import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

// A antiga "área autenticada" foi substituída pela página "Meu perfil".
// Mantemos esta rota apenas para redirecionar acessos antigos.
const PainelRedirect = () => <Navigate to="/perfil" replace />;

export const Route = createFileRoute("/painel")({ component: PainelRedirect });
