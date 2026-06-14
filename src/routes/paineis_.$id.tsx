import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useParams, Navigate } from "@/lib/router-compat";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Pencil,
  Save,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PAINEIS } from "@/data/site";
import { useAuth } from "@/hooks/useAuth";
import { usePanelPermissions } from "@/hooks/usePanelPermissions";
import { useLogPortalVisit } from "@/hooks/useLogPortalVisit";
import { toast } from "@/hooks/use-toast";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/favorites.functions";
import { getPanelNote, upsertPanelNote } from "@/lib/panel-notes.functions";

const DEFAULT_NOTE =
  'Painel publicado pela Secretaria de Estado de Saúde de Minas Gerais (SES-MG). Caso o painel não carregue, utilize "Abrir em nova aba".';

const VisualizarPainel = () => {
  const { id } = useParams<{ id: string }>();
  const painel = PAINEIS.find((p) => String(p.id) === id);
  const [loaded, setLoaded] = useState(false);
  // Por padrão, a barra superior do portal fica OCULTA enquanto o usuário
  // está visualizando o painel — assim ele ocupa praticamente a tela inteira.
  const [headerVisible, setHeaderVisible] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [note, setNote] = useState<string>(DEFAULT_NOTE);
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const { user, loading: authLoading, roles } = useAuth();
  const { panelIds: allowedIds, loading: permLoading } = usePanelPermissions();

  const listFavoritesFn = useServerFn(listFavorites);
  const addFavoriteFn = useServerFn(addFavorite);
  const removeFavoriteFn = useServerFn(removeFavorite);
  const getNoteFn = useServerFn(getPanelNote);
  const upsertNoteFn = useServerFn(upsertPanelNote);

  useLogPortalVisit(`/paineis/${id}`);

  const isAdmin = roles.includes("admin") || roles.includes("owner");
  const orientationLockedRef = useRef(false);

  // Liga/desliga a classe que esconde o header/footer globais
  useEffect(() => {
    const root = document.documentElement;
    if (headerVisible) root.classList.remove("panel-fullscreen");
    else root.classList.add("panel-fullscreen");
    return () => root.classList.remove("panel-fullscreen");
  }, [headerVisible]);

  // Carrega nota técnica
  useEffect(() => {
    if (!id) return;
    getNoteFn({ data: { panelId: String(id) } })
      .then((r) => {
        setNote(r.content && r.content.trim() ? r.content : DEFAULT_NOTE);
      })
      .catch(() => setNote(DEFAULT_NOTE))
      .finally(() => setNoteLoaded(true));
  }, [id, getNoteFn]);

  // Carrega favoritos
  useEffect(() => {
    if (!user || !id) return;
    listFavoritesFn()
      .then((r) => setIsFavorite(r.panelIds.includes(String(id))))
      .catch(() => undefined);
  }, [user, id, listFavoritesFn]);

  // Força orientação paisagem em dispositivos móveis
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;
    const so = (typeof screen !== "undefined" ? (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void } }).orientation : null);
    if (so?.lock) {
      so.lock("landscape").then(
        () => { orientationLockedRef.current = true; },
        () => { /* navegador bloqueou; fallback CSS abaixo */ },
      );
    }
    document.documentElement.classList.add("force-landscape");
    return () => {
      document.documentElement.classList.remove("force-landscape");
      if (orientationLockedRef.current && so?.unlock) {
        try { so.unlock(); } catch { /* ignore */ }
        orientationLockedRef.current = false;
      }
    };
  }, []);

  if (!painel) return <Navigate to="/paineis" replace />;

  if (painel.restrito) {
    if (authLoading || permLoading) {
      return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando…</div>;
    }
    if (!user) return <Navigate to="/auth" replace />;
    if (!allowedIds.includes(String(painel.id))) {
      return (
        <div className="container mx-auto px-4 py-20 max-w-xl text-center animate-fade-in">
          <Lock className="h-10 w-10 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Painel restrito</h1>
          <p className="text-muted-foreground mb-6">
            Você não possui permissão para acessar este painel. Solicite o acesso à equipe administradora.
          </p>
          <Button asChild>
            <Link to="/solicitar-acesso-painel">Solicitar acesso</Link>
          </Button>
        </div>
      );
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Faça login para favoritar",
        description: "Você precisa estar autenticado para salvar painéis favoritos.",
      });
      return;
    }
    setFavBusy(true);
    try {
      if (isFavorite) {
        await removeFavoriteFn({ data: { panelId: String(painel.id) } });
        setIsFavorite(false);
        toast({ title: "Removido dos favoritos" });
      } else {
        await addFavoriteFn({ data: { panelId: String(painel.id) } });
        setIsFavorite(true);
        toast({ title: "Adicionado aos favoritos" });
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha ao atualizar favoritos.",
        variant: "destructive",
      });
    } finally {
      setFavBusy(false);
    }
  };

  const handleStartEditNote = () => {
    setDraftNote(note === DEFAULT_NOTE ? "" : note);
    setEditingNote(true);
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const content = draftNote.trim();
      await upsertNoteFn({ data: { panelId: String(painel.id), content } });
      setNote(content || DEFAULT_NOTE);
      setEditingNote(false);
      toast({ title: "Nota técnica salva" });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  // Quando o cabeçalho global está visível (sticky 64px), descemos a área
  // do painel para não ficar atrás dele.
  const containerTop = headerVisible ? "top-16 sm:top-20" : "top-0";

  return (
    <div className={`fixed inset-x-0 bottom-0 ${containerTop} z-30 bg-background flex flex-col`}>
      {/* Barra de ferramentas flutuante (sempre visível, fica sobre o painel
          mas ocupa pouco espaço). */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Lado esquerdo: voltar + título */}
        <div className="flex items-center gap-2 pointer-events-auto bg-background/95 backdrop-blur-md border border-border rounded-full shadow-md pl-1 pr-3 py-1 max-w-[60%]">
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="rounded-full h-9 w-9 text-primary hover:bg-primary/10 shrink-0"
            aria-label="Voltar para Galeria de Painéis"
            title="Voltar para Galeria de Painéis"
          >
            <Link to={`/paineis?area=${painel.areaSlug}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 hidden sm:block">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
              {painel.areaNome}
            </div>
            <div className="text-xs font-semibold truncate leading-tight">
              {painel.titulo}
            </div>
          </div>
        </div>

        {/* Lado direito: favorito, abrir em nova aba e mostrar/ocultar barra */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-background/95 backdrop-blur-md border border-border rounded-full shadow-md px-1.5 py-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            disabled={favBusy}
            className={`rounded-full h-9 w-9 ${isFavorite ? "text-yellow-500" : ""}`}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full h-9 w-9" aria-label="Abrir em nova aba" title="Abrir em nova aba">
            <a href={painel.embedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => setHeaderVisible((v) => !v)}
            aria-label={headerVisible ? "Ocultar barra superior" : "Mostrar barra superior"}
            title={headerVisible ? "Ocultar barra superior" : "Mostrar barra superior"}
            aria-pressed={headerVisible}
          >
            {headerVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Embed — ocupa toda a área restante */}
      <div className="flex-1 relative bg-muted">
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

        {/* Botão flutuante "Notas técnicas" — canto inferior esquerdo,
            próximo ao rótulo "Microsoft Power BI" do iframe. */}
        {!notesOpen && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setNotesOpen(true)}
            className="absolute bottom-3 left-3 z-20 gap-1.5 rounded-full shadow-md border border-border bg-background/95 backdrop-blur-md hover:bg-background"
          >
            <FileText className="h-4 w-4 text-primary" />
            Notas técnicas
          </Button>
        )}
      </div>

      {/* Painel de Notas técnicas */}
      {notesOpen && (
        <div className="border-t border-border bg-background max-h-[40vh] overflow-y-auto shrink-0 animate-in slide-in-from-bottom-2">
          <div className="px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Notas técnicas</h2>
              <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                {painel.titulo}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !editingNote && (
                <Button variant="outline" size="sm" onClick={handleStartEditNote} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotesOpen(false)}
                aria-label="Fechar notas técnicas"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="px-4 pb-4">
            {!noteLoaded ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : editingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder={DEFAULT_NOTE}
                  rows={6}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para restaurar o texto padrão.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSaveNote} disabled={savingNote} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {savingNote ? "Salvando…" : "Salvar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNote(false)}
                    disabled={savingNote}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {note}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute("/paineis_/$id")({ component: VisualizarPainel });
