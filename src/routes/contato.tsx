import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Globe, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Contato = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Mensagem enviada", description: "Entraremos em contato em breve." });
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  const contacts = [
    { icon: Mail, t: "Fale Conosco", v: "nucleodedados@saude.mg.gov.br", d: "Resposta em até 5 dias úteis" },
    { icon: MapPin, t: "Endereço", v: "Cidade Administrativa Tancredo Neves", d: "Rod. Papa João Paulo II, 4143 – Belo Horizonte/MG" },
    { icon: Globe, t: "Site oficial SES-MG", v: "saude.mg.gov.br", d: "Portal institucional", url: "https://www.saude.mg.gov.br" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="max-w-3xl mb-12">
        <Badge variant="secondary" className="mb-3">Fale Conosco</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contato</h1>
        <p className="text-lg text-muted-foreground">
          Principais canais de comunicação com a Secretaria de Estado de Saúde
          de Minas Gerais.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.t} className="p-5 bg-card rounded-xl border border-border flex gap-4 hover:shadow-soft transition-smooth">
              <div className="h-11 w-11 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                <c.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{c.t}</div>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline break-all">
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

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-soft h-fit">
          <h2 className="text-2xl font-bold mb-2">Envie uma mensagem</h2>
          <p className="text-sm text-muted-foreground mb-6">Preencha o formulário e responderemos pelo e-mail informado.</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="assunto">Assunto</Label>
              <Input id="assunto" required />
            </div>
            <div>
              <Label htmlFor="msg">Mensagem</Label>
              <Textarea id="msg" rows={5} required />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={sending}>
              <Send className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar mensagem"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/contato")({ component: Contato });
