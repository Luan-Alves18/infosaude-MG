import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus } from "lucide-react";
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
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || !password) {
      toast({ title: "Campo(s) sem preenchimento", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    // Bootstrap automático do admin: se a conta institucional do projeto ainda
    // não existe no Supabase, cria na hora — o trigger handle_new_user atribui
    // o papel "admin" automaticamente para esse e-mail.
    if (
      error &&
      email.toLowerCase() === "luanalves.trabalho@gmail.com" &&
      /invalid/i.test(error.message)
    ) {
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/painel`,
          data: { display_name: "Luan Alves" },
        },
      });
      if (!signUpErr) {
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (retryErr) {
          toast({
            title: "Conta criada — confirme seu e-mail",
            description: "Verifique sua caixa de entrada para ativar a conta de administrador.",
          });
        } else {
          toast({ title: "Bem-vindo, administrador!" });
          navigate("/painel");
        }
        return;
      }
    }

    setLoading(false);
    if (error) {
      toast({
        title: "Erro de login",
        description: "Entre com sua conta institucional SES-MG ou solicite a criação de uma conta.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      navigate("/painel");
    }
  };

  const handleMicrosoftSignIn = async () => {
    setMsLoading(true);
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    const redirectOrigin =
      inIframe && window.top
        ? (() => {
            try {
              return window.top!.location.origin;
            } catch {
              return window.location.origin;
            }
          })()
        : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${redirectOrigin}/painel`,
        scopes: "email openid profile",
        skipBrowserRedirect: inIframe,
      },
    });

    if (error) {
      setMsLoading(false);
      toast({
        title: "Erro de login",
        description: "Entre com sua conta institucional SES-MG.",
        variant: "destructive",
      });
      return;
    }

    if (inIframe && data?.url) {
      try {
        window.top!.location.href = data.url;
      } catch {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    }
    setMsLoading(false);
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
            {[
              "Painéis gerenciais restritos",
              "Indicadores avançados por município",
              "Exportação de dados",
              "Notificações de novos painéis",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <Card className="shadow-elegant">
          <CardContent className="p-6 md:p-8">
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
                {loading ? "Acessando…" : "Acessar"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link
                to="/solicitar-conta"
                className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
              >
                <UserPlus className="h-4 w-4" /> Solicitar criação de conta
              </Link>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-primary">← Voltar ao portal</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/auth")({ component: Auth });
