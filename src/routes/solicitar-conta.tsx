import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SolicitarConta = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome_completo: String(fd.get("nome_completo") || "").trim(),
      instituicao: String(fd.get("instituicao") || "").trim(),
      chefia_imediata: String(fd.get("chefia_imediata") || "").trim(),
      email: String(fd.get("email") || "").trim().toLowerCase(),
      motivo: String(fd.get("motivo") || "").trim(),
    };

    if (
      !payload.nome_completo ||
      !payload.instituicao ||
      !payload.chefia_imediata ||
      !payload.email ||
      !payload.motivo
    ) {
      toast({ title: "Campo(s) sem preenchimento", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Bloqueia duplicidade: já existe solicitação pendente para este e-mail?
    const { data: existing, error: checkErr } = await supabase
      .from("account_requests")
      .select("id, status")
      .eq("email", payload.email)
      .eq("status", "pendente")
      .limit(1);
    if (checkErr) {
      setLoading(false);
      toast({
        title: "Erro ao verificar solicitação",
        description: checkErr.message,
        variant: "destructive",
      });
      return;
    }
    if (existing && existing.length > 0) {
      setLoading(false);
      toast({
        title: "Solicitação já registrada",
        description:
          "Já existe uma solicitação pendente para este e-mail. Aguarde a análise do administrador.",
        variant: "destructive",
      });
      return;
    }

    // Inserção direta usando a política RLS de INSERT pública (anon).
    const { error } = await supabase.from("account_requests").insert(payload);
    setLoading(false);
    if (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação foi registrada. Você será notificado quando a conta for criada.",
    });
    navigate("/auth");
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in max-w-2xl">
      <Link to="/auth" className="text-sm text-primary inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar para login
      </Link>
      <Badge variant="secondary" className="mb-3">
        <UserPlus className="h-3 w-3 mr-1" /> Nova solicitação
      </Badge>
      <h1 className="text-3xl font-bold mb-2">Solicitar criação de conta</h1>
      <p className="text-muted-foreground mb-8">
        Preencha os campos abaixo para solicitar acesso ao InfoSaúde MG. Sua
        solicitação será analisada pela equipe da SES-MG.
      </p>

      <Card className="shadow-elegant">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome_completo">Nome completo *</Label>
              <Input id="nome_completo" name="nome_completo" required />
            </div>
            <div>
              <Label htmlFor="instituicao">Instituição de trabalho *</Label>
              <Input id="instituicao" name="instituicao" required />
            </div>
            <div>
              <Label htmlFor="chefia_imediata">Chefia imediata *</Label>
              <Input id="chefia_imediata" name="chefia_imediata" required />
            </div>
            <div>
              <Label htmlFor="email">E-mail que deseja cadastrar *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="motivo">Motivo da solicitação *</Label>
              <Textarea id="motivo" name="motivo" rows={4} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando…" : "Solicitar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute("/solicitar-conta")({ component: SolicitarConta });
