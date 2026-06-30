import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, Navigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PAINEIS } from "@/data/site";
import { createPanelAccessRequest } from "@/lib/requests.functions";

const SolicitarAcessoPainel = () => {
  const { user, loading: authLoading } = useAuth();
  const submitFn = useServerFn(createPanelAccessRequest);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [motivo, setMotivo] = useState("");

  const restritos = useMemo(() => PAINEIS.filter((p) => p.restrito), []);

  if (authLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0 || !motivo.trim()) {
      toast({ title: "Campo(s) sem preenchimento", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await submitFn({ data: { panel_ids: selected, motivo: motivo.trim() } });

      // Notifica o admin via SMTP institucional. Falha de envio não invalida
      // a solicitação já persistida.
      const titulos = selected
        .map((id) => PAINEIS.find((p) => String(p.id) === id)?.titulo ?? id);
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.functions.invoke("send-smtp-notification", {
          body: {
            tipo_notificacao: "solicitacao_painel",
            dados: {
              user_email: user.email,
              user_name:
                user.user_metadata?.display_name ?? user.email?.split("@")[0],
              panel_ids: selected,
              panel_titulos: titulos,
              motivo: motivo.trim(),
            },
          },
        });
      } catch (err) {
        console.warn("[send-smtp-notification] falha ao notificar admin:", err);
      }

      toast({ title: "Solicitação enviada", description: "Sua solicitação foi registrada." });
      setSelected([]);
      setMotivo("");
    } catch (err) {
      toast({
        title: "Erro ao enviar solicitação",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in max-w-2xl">
      <Link to="/painel" className="text-sm text-primary inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <Badge variant="secondary" className="mb-3">
        <Lock className="h-3 w-3 mr-1" /> Acesso a painel restrito
      </Badge>
      <h1 className="text-3xl font-bold mb-2">Solicitar acesso a painel</h1>
      <p className="text-muted-foreground mb-8">
        Selecione os painéis restritos para os quais deseja solicitar acesso e descreva o motivo.
      </p>

      <Card className="shadow-elegant">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="mb-2 block">Painel(is) que deseja solicitar *</Label>
              {restritos.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-4">
                  Nenhum painel restrito disponível no momento.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto border border-border rounded-md p-3">
                  {restritos.map((p) => (
                    <label key={p.id} className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={selected.includes(String(p.id))}
                        onCheckedChange={() => toggle(String(p.id))}
                      />
                      <span className="text-sm">
                        <span className="font-medium">{p.titulo}</span>
                        <span className="block text-xs text-muted-foreground">{p.areaNome}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="motivo">Motivo da solicitação *</Label>
              <Textarea
                id="motivo"
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || restritos.length === 0}>
              {loading ? "Enviando…" : "Solicitar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute("/solicitar-acesso-painel")({ component: SolicitarAcessoPainel });
