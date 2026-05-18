import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/painel", { replace: true });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      navigate("/painel");
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/painel`,
        data: { display_name: String(fd.get("nome") || "") },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada", description: "Verifique seu e-mail para confirmar." });
    }
  };

  const handleMicrosoftSignIn = async () => {
    setMsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/painel`,
        scopes: "email openid profile",
      },
    });
    setMsLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar com Microsoft", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
        <div className="hidden lg:block">
          <Badge variant="secondary" className="mb-3">Acesso ao portal</Badge>
          <h1 className="text-4xl font-bold mb-4">Acesse painéis exclusivos do InfoSaúde MG</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Profissionais e gestores cadastrados acessam relatórios restritos,
            painéis gerenciais e ferramentas avançadas de análise.
          </p>
          <ul className="space-y-3 text-sm">
            {["Painéis gerenciais restritos", "Indicadores avançados por município", "Exportação de dados", "Notificações de novos painéis"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <Card className="shadow-elegant">
          <CardContent className="p-6 md:p-8">
            {/* Microsoft SSO Button */}
            <Button
              variant="outline"
              className="w-full h-12 mb-6 border-2 hover:bg-accent transition-colors"
              onClick={handleMicrosoftSignIn}
              disabled={msLoading}
            >
              <MicrosoftIcon />
              <span className="ml-2 font-semibold">
                {msLoading ? "Redirecionando…" : "Entrar com a conta Microsoft"}
              </span>
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou acesse com e-mail</span>
              </div>
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 mb-6 w-full">
                <TabsTrigger value="signin"><LogIn className="h-4 w-4 mr-2" />Entrar</TabsTrigger>
                <TabsTrigger value="signup"><UserPlus className="h-4 w-4 mr-2" />Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="si-email">E-mail</Label>
                    <Input id="si-email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="si-pw">Senha</Label>
                    <Input id="si-pw" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="su-nome">Nome</Label>
                    <Input id="su-nome" name="nome" required />
                  </div>
                  <div>
                    <Label htmlFor="su-email">E-mail</Label>
                    <Input id="su-email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="su-pw">Senha</Label>
                    <Input id="su-pw" name="password" type="password" minLength={6} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando…" : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Ao criar uma conta você concorda com a política de privacidade da SES-MG.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">← Voltar ao portal</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
