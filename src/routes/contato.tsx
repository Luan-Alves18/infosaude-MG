import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Globe, Clock, LifeBuoy, Accessibility, ShieldCheck, FileQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Contato = () => {
  const contacts = [
    { icon: Mail, t: "FALE CONOSCO", v: "nucleodedados@saude.mg.gov.br", d: "Resposta em até 5 dias úteis" },
    { icon: MapPin, t: "ENDEREÇO", v: "Cidade Administrativa Tancredo Neves", d: "Rod. Papa João Paulo II, 4143 – Belo Horizonte/MG" },
    { icon: Globe, t: "SITE OFICIAL SES-MG", v: "saude.mg.gov.br", d: "Portal institucional", url: "https://www.saude.mg.gov.br" },
  ];

  const info = [
    {
      icon: Clock,
      t: "HORÁRIO DE ATENDIMENTO",
      v: "Segunda a sexta, das 8h às 18h",
      d: "Exceto feriados nacionais e estaduais.",
    },
    {
      icon: LifeBuoy,
      t: "SUPORTE TÉCNICO",
      v: "Dúvidas sobre painéis e acesso",
      d: "Encaminhe sua solicitação pelo e-mail institucional informando o painel e o tipo de problema.",
    },
    {
      icon: FileQuestion,
      t: "SOLICITAÇÃO DE ACESSO",
      v: "Painéis restritos",
      d: "Servidores podem solicitar acesso a painéis restritos diretamente pela área autenticada do portal.",
    },
    {
      icon: Accessibility,
      t: "ACESSIBILIDADE",
      v: "Recursos disponíveis",
      d: "Use o menu de acessibilidade (canto da página) para ajustar contraste, tamanho de fonte e navegação por teclado.",
    },
    {
      icon: ShieldCheck,
      t: "PRIVACIDADE DE DADOS",
      v: "LGPD — Lei 13.709/2018",
      d: "Os dados pessoais informados nos formulários são utilizados exclusivamente para resposta à solicitação.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="max-w-3xl mb-12">
        <Badge variant="secondary" className="mb-3">Fale Conosco</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contato</h1>
        <p className="text-lg text-muted-foreground">
          Entre em contato com a nossa Equipe.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...contacts, ...info].map((c) => (
          <div key={c.t} className="p-5 bg-card rounded-xl border border-border flex gap-4 hover:shadow-soft transition-smooth">
            <div className="h-11 w-11 rounded-lg gradient-hero flex items-center justify-center shrink-0">
              <c.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{c.t}</div>
              {"url" in c && c.url ? (
                <a href={c.url as string} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline break-all">
                  {c.v}
                </a>
              ) : (
                <div className="font-semibold text-foreground break-all">{c.v}</div>
              )}
              <div className="text-sm text-muted-foreground mt-0.5">{c.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/contato")({ component: Contato });
