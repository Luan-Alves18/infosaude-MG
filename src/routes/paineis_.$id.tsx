import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useParams, Navigate } from "@/lib/router-compat";
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAINEIS } from "@/data/site";

const VisualizarPainel = () => {
  const { id } = useParams<{ id: string }>();
  const painel = PAINEIS.find((p) => String(p.id) === id);
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  if (!painel) return <Navigate to="/paineis" replace />;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background flex flex-col" : "container mx-auto px-4 py-8 animate-fade-in"}>
      {/* Cabeçalho */}
      <div className={fullscreen ? "px-3 sm:px-4 py-2 sm:py-3 border-b border-border flex items-center justify-between gap-2 sm:gap-4 bg-background" : "mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"}>
        <div className={fullscreen ? "flex items-center gap-3 min-w-0 flex-1" : "min-w-0 flex-1"}>
          {!fullscreen && (
            <Link
              to={`/paineis?area=${painel.areaSlug}`}
              className="text-sm text-primary inline-flex items-center gap-1 hover:gap-2 transition-all mb-3"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para painéis de {painel.areaNome}
            </Link>
          )}
          <div className={fullscreen ? "min-w-0" : ""}>
            <Badge variant="outline" className="mb-2">{painel.areaNome}</Badge>
            <h1 className={fullscreen ? "text-sm sm:text-lg font-semibold truncate" : "text-xl sm:text-2xl md:text-3xl font-bold leading-tight"}>
              {painel.titulo}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen((v) => !v)}
            className="gap-2"
            aria-label={fullscreen ? "Sair de tela cheia" : "Tela cheia"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{fullscreen ? "Sair" : "Tela cheia"}</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={painel.embedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Abrir em nova aba</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Embed */}
      <div
        className={
          fullscreen
            ? "flex-1 relative bg-muted"
            : "relative w-full bg-muted rounded-xl overflow-hidden border border-border shadow-elegant"
        }
        style={fullscreen ? undefined : { aspectRatio: "16 / 10", minHeight: 'min(600px, 75vh)' }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Carregando painel…</p>
          </div>
        )}
        <iframe
          title={painel.titulo}
          src={painel.embedUrl}
          onLoad={() => setLoaded(true)}
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {!fullscreen && (
        <p className="text-xs text-muted-foreground mt-4">
          Painel publicado pela Secretaria de Estado de Saúde de Minas Gerais (SES-MG).
          Caso o painel não carregue, utilize "Abrir em nova aba".
        </p>
      )}
    </div>
  );
};

export const Route = createFileRoute("/paineis_/$id")({ component: VisualizarPainel });