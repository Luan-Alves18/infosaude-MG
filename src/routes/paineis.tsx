import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useSearchParams } from "@/lib/router-compat";
import * as Icons from "lucide-react";
import { Activity, ArrowRight, LayoutGrid, Lock, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AREAS_TEMATICAS, PAINEIS } from "@/data/site";
import { getAreaColor } from "@/lib/areaColors";
import { useAuth } from "@/hooks/useAuth";
import { usePanelPermissions } from "@/hooks/usePanelPermissions";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/favorites.functions";
import { toast } from "@/hooks/use-toast";

const sortByName = <T extends { nome: string }>(arr: T[]) =>
  [...arr].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

const Paineis = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState<"az" | "za" | "favorites">("az");
  const areaSlug = params.get("area") || "todas";
  const { user } = useAuth();
  const { panelIds: allowedPanelIds } = usePanelPermissions();

  const listFavoritesFn = useServerFn(listFavorites);
  const addFavoriteFn = useServerFn(addFavorite);
  const removeFavoriteFn = useServerFn(removeFavorite);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    listFavoritesFn()
      .then((res) => setFavoriteIds(res.panelIds))
      .catch(() => setFavoriteIds([]));
  }, [user, listFavoritesFn]);

  const visiblePaineis = useMemo(
    () =>
      PAINEIS.filter(
        (p) => !p.restrito || (user && allowedPanelIds.includes(String(p.id))),
      ),
    [user, allowedPanelIds],
  );

  const setArea = (slug: string) => {
    if (slug === "todas") {
      params.delete("area");
    } else {
      params.set("area", slug);
    }
    setParams(params, { replace: true });
  };

  const countsByArea = useMemo(() => {
    const map: Record<string, number> = {};
    visiblePaineis.forEach((p) => (map[p.areaSlug] = (map[p.areaSlug] || 0) + 1));
    return map;
  }, [visiblePaineis]);

  // Ordena áreas: as com painéis visíveis em ordem alfabética; as vazias ao final, também em ordem alfabética.
  const orderedAreas = useMemo(() => {
    const withPanels = AREAS_TEMATICAS.filter((a) => (countsByArea[a.slug] ?? 0) > 0);
    const empty = AREAS_TEMATICAS.filter((a) => (countsByArea[a.slug] ?? 0) === 0);
    return [...sortByName(withPanels), ...sortByName(empty)];
  }, [countsByArea]);

  const filtered = useMemo(() => {
    let list = visiblePaineis.filter(
      (p) =>
        (areaSlug === "todas" || p.areaSlug === areaSlug) &&
        p.titulo.toLowerCase().includes(q.toLowerCase().trim()),
    );
    if (sortMode === "favorites") {
      list = list.filter((p) => favoriteIds.includes(String(p.id)));
    }
    list = [...list].sort((a, b) => {
      const t = a.titulo.localeCompare(b.titulo, "pt-BR", { sensitivity: "base" });
      return sortMode === "za" ? -t : t;
    });
    return list;
  }, [q, areaSlug, visiblePaineis, sortMode, favoriteIds]);

  const toggleFavorite = async (panelId: string) => {
    if (!user) {
      toast({ title: "Entre na sua conta", description: "É preciso estar logado para favoritar painéis." });
      return;
    }
    const isFav = favoriteIds.includes(panelId);
    try {
      if (isFav) {
        await removeFavoriteFn({ data: { panelId } });
        setFavoriteIds((prev) => prev.filter((p) => p !== panelId));
      } else {
        await addFavoriteFn({ data: { panelId } });
        setFavoriteIds((prev) => [...prev, panelId]);
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao atualizar favoritos.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="max-w-3xl mb-8">
        <Badge variant="secondary" className="mb-3">
          <LayoutGrid className="h-3 w-3 mr-1" /> Galeria de Painéis
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Galeria de Painéis</h1>
        <p className="text-lg text-muted-foreground">
          {PAINEIS.length} painéis interativos publicados pelo InfoSaúde MG,
          organizados em {AREAS_TEMATICAS.length} áreas temáticas. Escolha uma área abaixo
          ou busque pelo título do painel.
        </p>
      </div>

      {/* Áreas Temáticas - cards visuais que funcionam como filtros */}
      <section aria-labelledby="areas-heading" className="mb-12">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 id="areas-heading" className="text-2xl md:text-3xl font-bold">Áreas Temáticas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione uma área para filtrar os painéis abaixo. Áreas sem painéis disponíveis aparecem ao final.
            </p>
          </div>
          {areaSlug !== "todas" && (
            <Button variant="ghost" size="sm" onClick={() => setArea("todas")} className="gap-1">
              Limpar filtro <span aria-hidden>×</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {orderedAreas.map((a) => {
            const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[a.icon] || Activity;
            const count = countsByArea[a.slug] || 0;
            const c = getAreaColor(a.slug);
            const active = areaSlug === a.slug;
            const disabled = count === 0;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setArea(active ? "todas" : a.slug)}
                disabled={disabled}
                aria-pressed={active}
                title={disabled ? "Área sem painéis disponíveis" : a.nome}
                className={`group text-left rounded-xl border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:shadow-elegant disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                  active ? "ring-2 ring-primary border-primary" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className={`h-10 w-10 rounded-lg ${c.iconBg} flex items-center justify-center shadow-soft shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                  <Badge variant="secondary" className={`text-xs gap-1 ${c.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {count}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm leading-snug">{a.nome}</h3>
                {disabled && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1 block">
                    Em breve
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Busca */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl md:text-3xl font-bold">
          {areaSlug === "todas"
            ? "Todos os painéis"
            : AREAS_TEMATICAS.find((a) => a.slug === areaSlug)?.nome}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h2>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar painel pelo título…"
          className="pl-10 h-12"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const c = getAreaColor(p.areaSlug);
          const isFav = favoriteIds.includes(String(p.id));
          return (
            <Card key={p.id} className="group hover:shadow-elegant transition-smooth hover:-translate-y-0.5">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <Badge variant="outline" className={`text-xs gap-1.5 border-transparent ${c.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {p.areaNome}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {p.restrito && (
                      <Badge className="bg-warning text-warning-foreground gap-1 text-xs">
                        <Lock className="h-3 w-3" /> Restrito
                      </Badge>
                    )}
                    {user && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(String(p.id))}
                        aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            isFav ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-4 leading-snug flex-1">{p.titulo}</h3>
                <Link
                  to={`/paineis/${p.id}`}
                  className="text-sm text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Visualizar painel <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">
            Nenhum painel encontrado.
          </p>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/paineis")({ component: Paineis });
