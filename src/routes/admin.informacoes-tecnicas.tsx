import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navigate } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, BookOpen, Lock, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AREAS_TEMATICAS, PAINEIS } from "@/data/site";
import { getAreaColor } from "@/lib/areaColors";
import { listAllPanelNotes } from "@/lib/panel-notes.functions";
import { matchesSearch } from "@/lib/normalize";
import { TechnicalDocsManager } from "@/components/TechnicalDocsManager";

type NoteRow = { panelId: string; content: string; updatedAt: string | null };

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const InformacoesTecnicas = () => {
  const { user, loading: authLoading, roles } = useAuth();
  const listNotesFn = useServerFn(listAllPanelNotes);

  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [accessFilter, setAccessFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const isOwner = roles.includes("owner");

  useEffect(() => {
    if (!isOwner) return;
    setLoadingNotes(true);
    listNotesFn()
      .then((r) => setNotes(r.notes))
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false));
  }, [isOwner, listNotesFn]);

  // Combina painéis com nota técnica (ou texto vazio quando não houver registro)
  const noteByPanel = useMemo(() => {
    const m = new Map<string, NoteRow>();
    notes.forEach((n) => m.set(String(n.panelId), n));
    return m;
  }, [notes]);

  const rows = useMemo(() => {
    return PAINEIS.map((p) => {
      const n = noteByPanel.get(String(p.id));
      return {
        id: String(p.id),
        titulo: p.titulo,
        areaSlug: p.areaSlug,
        areaNome: p.areaNome,
        restrito: Boolean(p.restrito),
        content: n?.content ?? "",
        updatedAt: n?.updatedAt ?? null,
      };
    });
  }, [noteByPanel]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => matchesSearch(r.titulo, search))
      .filter((r) => areaFilter === "all" || r.areaSlug === areaFilter)
      .filter((r) => {
        if (accessFilter === "publico") return !r.restrito;
        if (accessFilter === "restrito") return r.restrito;
        return true;
      })
      .sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return sortBy === "old" ? ta - tb : tb - ta;
      });
  }, [rows, search, areaFilter, accessFilter, sortBy]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center">
        <Lock className="h-10 w-10 text-warning mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">
          Esta seção é exclusiva do perfil Owner (Núcleo de Dados).
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 animate-fade-in max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Informações técnicas</h1>
        <p className="text-muted-foreground">
          Consulta centralizada das notas técnicas dos painéis e documentações
          internas do portal — disponível apenas para o perfil Owner.
        </p>
      </div>

      <Tabs defaultValue="notas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notas" className="gap-2">
            <FileText className="h-4 w-4" /> Notas técnicas
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="h-4 w-4" /> Documentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar pelo título do painel…"
                  className="pl-9"
                />
              </div>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="md:w-64">
                  <SelectValue placeholder="Área temática" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {AREAS_TEMATICAS.map((a) => (
                    <SelectItem key={a.slug} value={a.slug}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accessFilter} onValueChange={setAccessFilter}>
                <SelectTrigger className="md:w-44">
                  <SelectValue placeholder="Acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Públicos e privados</SelectItem>
                  <SelectItem value="publico">Apenas públicos</SelectItem>
                  <SelectItem value="restrito">Apenas privados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="md:w-56">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Atualizados recentemente</SelectItem>
                  <SelectItem value="old">Atualizados há mais tempo</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            {filteredRows.length} {filteredRows.length === 1 ? "painel" : "painéis"}
            {loadingNotes ? " · carregando notas…" : ""}
          </p>

          <div className="space-y-3">
            {filteredRows.map((r) => {
              const c = getAreaColor(r.areaSlug);
              return (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight">{r.titulo}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs gap-1.5 border-transparent ${c.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            {r.areaNome}
                          </Badge>
                          {r.restrito ? (
                            <Badge className="bg-warning text-warning-foreground gap-1 text-xs">
                              <Lock className="h-3 w-3" /> Restrito
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Globe className="h-3 w-3" /> Público
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        Atualizada em {formatDate(r.updatedAt)}
                      </span>
                    </div>
                    {r.content.trim() ? (
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mt-2">
                        {r.content}
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground mt-2">
                        Nenhuma nota técnica cadastrada para este painel.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!loadingNotes && filteredRows.length === 0 && (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground text-sm">
                  Nenhum painel encontrado com os filtros aplicados.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <TechnicalDocsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute("/admin/informacoes-tecnicas")({
  component: InformacoesTecnicas,
});
