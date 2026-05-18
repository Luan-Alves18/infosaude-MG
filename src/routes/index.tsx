import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import * as Icons from "lucide-react";
import { ArrowRight, Activity, BarChart3, Database, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AREAS_TEMATICAS, INDICADORES_HOME, NOTICIAS } from "@/data/site";
import { getAreaColor } from "@/lib/areaColors";
import { MapaMG } from "@/components/MapaMG";
import { supabase } from "@/integrations/supabase/client";
import { useLogPortalVisit } from "@/hooks/useLogPortalVisit";
import { formatVisitsApprox } from "@/lib/visits";

const Index = () => {
  // Registra a visita à entrada do portal (1x por sessão).
  useLogPortalVisit("/");

  // Total de acessos do último mês fechado, exibido de forma arredondada.
  const [acessos, setAcessos] = useState<string>("+0");
  useEffect(() => {
    let active = true;
    (supabase as any).rpc("get_last_month_visits").then((res: any) => {
      const { data, error } = res;
      if (!active || error) return;
      const total = typeof data === "number" ? data : Number(data ?? 0);
      setAcessos(formatVisitsApprox(total));
    });
    return () => {
      active = false;
    };
  }, []);

  const indicadores = INDICADORES_HOME.map((i) =>
    i.label === "Acessos/mês" ? { ...i, valor: acessos } : i,
  );

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 relative grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          <div className="max-w-2xl">
            <Badge className="mb-5 bg-primary-foreground/15 text-primary-foreground border-0 backdrop-blur hover:bg-primary-foreground/25">
              <Sparkles className="h-3 w-3 mr-1" /> Integração das informações em saúde de MG
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-4 sm:mb-6">
              Portal de Informações em Saúde
            </h1>
            <p className="text-base sm:text-lg md:text-xl opacity-90 mb-6 sm:mb-8 leading-relaxed">
              Análise de dados e informações em saúde do Estado de Minas Gerais
              por meio de ferramentas interativas e produtos de dados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="text-sm sm:text-base flex-1 sm:flex-none min-w-[160px]">
                <Link to="/paineis">Galeria de Painéis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative h-[280px] sm:h-[360px] lg:h-[440px] mt-6 lg:mt-0">
            <MapaMG />
          </div>
        </div>
      </section>

      {/* INDICADORES */}
      <section className="container mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {indicadores.map((i) => (
            <Card key={i.label} className="shadow-elegant border-0 gradient-card animate-scale-in">
              <CardContent className="p-5 md:p-6">
                <div className="text-2xl md:text-4xl font-bold text-primary leading-none">{i.valor}</div>
                <div className="mt-2 text-sm font-semibold text-foreground">{i.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{i.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* DESTAQUES / FUNCIONALIDADES */}
      <section className="container mx-auto px-4 pt-20 pb-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {[
            { icon: BarChart3, t: "Painéis interativos", d: "Visualize indicadores com filtros por município, regional e período." },
            { icon: Database, t: "Produtos de dados", d: "Bases consolidadas para apoiar gestores e pesquisadores." },
            { icon: Activity, t: "Atualização contínua", d: "Dados oficiais integrados a sistemas estaduais e federais." },
          ].map((f) => (
            <div key={f.t} className="bg-card p-6 rounded-xl shadow-soft border border-border/60">
              <div className="h-11 w-11 rounded-lg gradient-accent flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ÁREAS TEMÁTICAS */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <Badge variant="secondary" className="mb-3">Áreas Temáticas</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Explore os dados por área</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              10 áreas temáticas com painéis interativos e produtos de dados.
            </p>
          </div>
          <Button asChild variant="ghost" className="gap-1">
            <Link to="/paineis">Ver todas <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS_TEMATICAS.slice(0, 6).map((a) => {
            const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[a.icon] || Activity;
            const c = getAreaColor(a.slug);
            return (
              <Link key={a.id} to={`/paineis?area=${a.slug}`} className="group">
                <Card className="h-full hover:shadow-elegant transition-smooth hover:-translate-y-1 border-border/60">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl ${c.iconBg} flex items-center justify-center mb-4 shadow-soft`}>
                      <Icon className={`h-6 w-6 ${c.icon}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth">{a.nome}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.descricao}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* NOTÍCIAS / DESTAQUES */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <Badge variant="secondary" className="mb-3">Destaques</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Últimas atualizações</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {NOTICIAS.map((n) => (
            <article key={n.titulo} className="group bg-card p-6 rounded-xl border border-border hover:shadow-elegant transition-smooth">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <Badge variant="outline" className="text-xs">{n.categoria}</Badge>
                <time>{new Date(n.data).toLocaleDateString("pt-BR")}</time>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth">{n.titulo}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.resumo}</p>
            </article>
          ))}
        </div>
      </section>

      {/* MAPA ESTRATÉGICO */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-border/60 bg-card shadow-elegant overflow-hidden">
          <div className="p-6 md:p-10 border-b border-border/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center shadow-soft shrink-0">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-2">Mapa Estratégico · 2023-2026</Badge>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">Mapa Estratégico da SES-MG</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl">
                  Acompanhe de forma interativa a visão, os objetivos e os indicadores estratégicos
                  da Secretaria de Estado de Saúde de Minas Gerais para o ciclo 2023-2026,
                  organizando as prioridades que orientam as ações de saúde no Estado.
                </p>
              </div>
            </div>
          </div>
          <div className="relative w-full bg-muted/30" style={{ aspectRatio: "16 / 7" }}>
            <iframe
              title="Mapa Estratégico SES-MG 2023-2026"
              src="https://app.powerbi.com/view?r=eyJrIjoiOGIxZjhjOGEtNDMwNy00ZmFkLWE3OTYtMTMwMzkyMDNlZTMwIiwidCI6ImU1ZDNhZTdjLTliMzgtNDhkZS1hMDg3LWY2NzM0YTI4NzU3NCJ9"
              className="absolute inset-0 w-full h-full"
              frameBorder={0}
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="gradient-hero rounded-2xl p-10 md:p-14 text-primary-foreground text-center shadow-elegant">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">É gestor ou profissional de saúde?</h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto">
            Acesse painéis restritos e indicadores avançados criando uma conta no portal.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">Criar conta gratuita</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export const Route = createFileRoute("/")({ component: Index });
