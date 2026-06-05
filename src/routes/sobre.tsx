import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Database, ShieldCheck, Info } from "lucide-react";
import { FichaTecnica } from "@/components/FichaTecnica";
import { isModoEleitoral } from "@/lib/modoEleitoral";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";

const SobreEleitoral = () => (
  <div className="container mx-auto px-4 py-20 animate-fade-in">
    <div className="max-w-2xl mx-auto text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
        <Info className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-3">
        Conteúdo temporariamente indisponível
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Em conformidade com a legislação eleitoral (Lei nº 9.504/97), esta
        página está temporariamente indisponível durante o período de vedações.
        O conteúdo será restabelecido após o encerramento do período eleitoral.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  </div>
);

const SobreCompleto = () => (
  <div className="container mx-auto px-4 py-12 animate-fade-in">
    <div className="max-w-3xl mb-12">
      <Badge variant="secondary" className="mb-3">Sobre o Portal</Badge>
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre o InfoSaúde MG</h1>
      <p className="text-lg text-muted-foreground leading-relaxed">
        O <strong>Portal de Informações em Saúde</strong> é uma iniciativa da
        Secretaria de Estado de Saúde de Minas Gerais (SES-MG) para promover a
        integração das informações em saúde do estado, fornecendo análise de
        dados por meio de ferramentas interativas e produtos de dados.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6 mb-16">
      {[
        { icon: Target, t: "Por que existe?", d: "Centralizar e democratizar o acesso a dados de saúde de Minas Gerais, apoiando a tomada de decisão baseada em evidências." },
        { icon: Users, t: "Para quem?", d: "Gestores municipais e estaduais, profissionais da saúde, pesquisadores e a sociedade civil interessada em informações de saúde." },
        { icon: Database, t: "O que oferece?", d: "Painéis interativos em 10 áreas temáticas, indicadores epidemiológicos, estudos técnicos e produtos de dados consolidados." },
        { icon: ShieldCheck, t: "Compromisso", d: "Dados oficiais provenientes dos sistemas estaduais e federais, com atualização contínua e total transparência." },
      ].map((b) => (
        <div key={b.t} className="p-6 bg-card rounded-xl border border-border">
          <div className="h-11 w-11 rounded-lg gradient-hero flex items-center justify-center mb-4 shadow-soft">
            <b.icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-xl mb-2">{b.t}</h3>
          <p className="text-muted-foreground leading-relaxed">{b.d}</p>
        </div>
      ))}
    </div>

    <div className="bg-muted/40 rounded-2xl p-8 md:p-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Integração das informações em saúde</h2>
      <p className="text-muted-foreground leading-relaxed mb-3">
        O portal reúne informações de diversas áreas — vigilância
        epidemiológica, atenção primária, regulação, vigilância sanitária,
        auditoria do SUS-MG, gestão, regionalização, estudos técnicos, saúde
        digital e atenção especializada — para garantir uma visão integrada da
        saúde em todos os 853 municípios mineiros.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Trabalhamos para que cada gestor, profissional ou cidadão tenha acesso
        a informação clara, atualizada e útil sobre a saúde no seu território.
      </p>
    </div>

    <section className="mt-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <Badge variant="secondary" className="mb-3">Ficha Técnica</Badge>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Equipe Responsável</h2>
        <p className="text-muted-foreground">
          Conheça os profissionais que tornaram o InfoSaúde MG possível.
        </p>
      </div>
      <FichaTecnica />
    </section>
  </div>
);

const Sobre = () => (isModoEleitoral() ? <SobreEleitoral /> : <SobreCompleto />);

export const Route = createFileRoute("/sobre")({ component: Sobre });
