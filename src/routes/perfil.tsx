import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, Navigate } from "@/lib/router-compat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, KeyRound, Lock, Star, User as UserIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { listFavorites, removeFavorite } from "@/lib/favorites.functions";
import { PAINEIS } from "@/data/site";
import { getAreaColor } from "@/lib/areaColors";

const Perfil = () => {
  const { user, loading: authLoading } = useAuth();
  const getProfileFn = useServerFn(getMyProfile);
  const updateProfileFn = useServerFn(updateMyProfile);
  const listFavoritesFn = useServerFn(listFavorites);
  const removeFavoriteFn = useServerFn(removeFavorite);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfileFn()
      .then((res) => {
        setDisplayName(res.profile?.display_name ?? "");
        setEmail(res.profile?.email ?? user.email ?? "");
      })
      .catch(() => setEmail(user.email ?? ""));
    setLoadingFavs(true);
    listFavoritesFn()
      .then((res) => setFavoriteIds(res.panelIds))
      .catch(() => setFavoriteIds([]))
      .finally(() => setLoadingFavs(false));
  }, [user, getProfileFn, listFavoritesFn]);

  const favorites = useMemo(
    () => PAINEIS.filter((p) => favoriteIds.includes(String(p.id))),
    [favoriteIds],
  );

  if (authLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileFn({ data: { display_name: displayName.trim() } });
      toast({ title: "Perfil atualizado" });
    } catch (err) {
      toast({
        title: "Erro ao atualizar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRemoveFav = async (panelId: string) => {
    try {
      await removeFavoriteFn({ data: { panelId } });
      setFavoriteIds((prev) => prev.filter((p) => p !== panelId));
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao remover favorito.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    // Revalida a senha atual para evitar troca quando alguém deixou a sessão aberta
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: email || user.email || "",
      password: currentPw,
    });
    if (verifyErr) {
      setChangingPw(false);
      toast({ title: "Senha atual incorreta", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    toast({ title: "Senha alterada com sucesso" });
  };

  return (
    <div className="container mx-auto px-4 py-10 animate-fade-in max-w-4xl">
      <Badge variant="secondary" className="mb-3">
        <UserIcon className="h-3 w-3 mr-1" /> Meu perfil
      </Badge>
      <h1 className="text-3xl font-bold mb-2">Meu perfil</h1>
      <p className="text-muted-foreground mb-6">Gerencie seus dados, favoritos e senha.</p>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
          <TabsTrigger value="senha">Alterar senha</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="displayName">Nome</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={email} disabled />
                </div>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Salvando…" : "Salvar alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favoritos">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <h2 className="font-semibold">Painéis favoritos</h2>
              </div>
              {loadingFavs ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                  Você ainda não favoritou nenhum painel. Vá à{" "}
                  <Link to="/paineis" className="text-primary hover:underline">Galeria de Painéis</Link> e clique na estrela.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {favorites.map((p) => {
                    const c = getAreaColor(p.areaSlug);
                    return (
                      <div key={p.id} className="border border-border rounded-lg p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs gap-1.5 border-transparent ${c.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            {p.areaNome}
                          </Badge>
                          {p.restrito && (
                            <Badge className="bg-warning text-warning-foreground gap-1 text-xs">
                              <Lock className="h-3 w-3" /> Restrito
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-3 flex-1">{p.titulo}</h3>
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/paineis/${p.id}`}
                            className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            Visualizar <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFav(String(p.id))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="senha">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="h-4 w-4" />
                <h2 className="font-semibold">Alterar senha</h2>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="currentPw">Senha atual</Label>
                  <Input
                    id="currentPw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPw">Nova senha</Label>
                  <Input
                    id="newPw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPw">Confirmar nova senha</Label>
                  <Input
                    id="confirmPw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" disabled={changingPw}>
                  {changingPw ? "Alterando…" : "Alterar senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute("/perfil")({ component: Perfil });
