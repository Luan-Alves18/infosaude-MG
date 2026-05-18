import { Navigate } from "@/lib/router-compat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Crown } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { PAINEIS } from "@/data/site";

const Painel = () => {
  const { user, loading, roles } = useAuth();

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const restritos = PAINEIS.filter((p) => p.restrito);
  const publicos = PAINEIS.filter((p) => !p.restrito);

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-10">
        <Badge variant="secondary" className="mb-3">Área autenticada</Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Olá, {user.email?.split("@")[0]} 👋</h1>
        <p className="text-muted-foreground">
          Você tem acesso a painéis exclusivos como usuário cadastrado do InfoSaúde MG.
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {roles.map((r) => (
            <Badge key={r} className="gap-1 bg-secondary text-secondary-foreground">
              <Crown className="h-3 w-3" /> {r}
            </Badge>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="h-4 w-4 text-warning" /> Painéis restritos</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {restritos.map((p) => (
          <Card key={p.id} className="border-warning/30 bg-warning/5">
            <CardContent className="p-5">
              <Badge variant="outline" className="mb-3 text-xs">{p.areaNome}</Badge>
              <h3 className="font-semibold mb-3">{p.titulo}</h3>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to={`/paineis/${p.id}`}>
                  Acessar painel <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {restritos.length === 0 && (
          <p className="text-muted-foreground col-span-full">Nenhum painel restrito publicado no momento.</p>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Outros painéis disponíveis</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {publicos.slice(0, 12).map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5">
              <Badge variant="outline" className="mb-3 text-xs">{p.areaNome}</Badge>
              <h3 className="font-semibold mb-3">{p.titulo}</h3>
              <Link
                to={`/paineis/${p.id}`}
                className="text-sm text-primary font-medium inline-flex items-center gap-1"
              >
                Visualizar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Painel;
