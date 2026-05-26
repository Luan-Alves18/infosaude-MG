import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AuthReset = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Quando o usuário chega via link de recovery, o supabase-js processa o hash
    // automaticamente e dispara um evento PASSWORD_RECOVERY com sessão temporária.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password.length < 8) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Senha redefinida", description: "Acesse com sua nova senha." });
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in max-w-md">
      <Badge variant="secondary" className="mb-3">
        <KeyRound className="h-3 w-3 mr-1" /> Redefinir senha
      </Badge>
      <h1 className="text-3xl font-bold mb-6">Definir nova senha</h1>
      <Card className="shadow-elegant">
        <CardContent className="p-6 md:p-8">
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Validando link de recuperação… Se nada acontecer, solicite um novo link na página de login.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              <div>
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input id="confirm" name="confirm" type="password" required minLength={8} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando…" : "Redefinir senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute("/auth/reset")({ component: AuthReset });
