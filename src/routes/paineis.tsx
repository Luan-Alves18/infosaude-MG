import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import * as Icons from "lucide-react";
import { Activity, ArrowRight, LayoutGrid, Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AREAS_TEMATICAS, PAINEIS } from "@/data/site";
import { getAreaColor } from "@/lib/areaColors";

const Paineis = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const areaSlug = params.get("area") || "todas";

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
    PAINEIS.forEach((p) => (map[p.areaSlug] = (map[p.areaSlug] || 0) + 1));
    return map;
  }, []);

  const filtered = useMemo(() => {
    return PAINEIS.filter(
      (p) =>
        (areaSlug === "todas" || p.areaSlug === areaSlug) &&
        p.titulo.toLowerCase().includes(q.toLowerCase().trim())
    );
  }, [q, areaSlug]);

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
              Selecione uma área para filtrar os painéis abaixo.
            </p>
          </div>
          {areaSlug !== "todas" && (
            <Button variant="ghost" size="sm" onClick={() => setArea("todas")} className="gap-1">
              Limpar filtro <span aria-hidden>×</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {AREAS_TEMATICAS.map((a) => {
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
          return (
          <Card key={p.id} className="group hover:shadow-elegant transition-smooth hover:-translate-y-0.5">
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-start justify-between mb-3 gap-2">
                <Badge variant="outline" className={`text-xs gap-1.5 border-transparent ${c.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  {p.areaNome}
                </Badge>
                {p.restrito && (
                  <Badge className="bg-warning text-warning-foreground gap-1 text-xs">
                    <Lock className="h-3 w-3" /> Restrito
                  </Badge>
                )}
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