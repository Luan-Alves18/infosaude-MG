import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, Navigate } from "@/lib/router-compat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  CalendarDays,
  KeyRound,
  LayoutGrid,
  LogOut,
  Lock,
  Mail,
  ShieldCheck,
  Star,
  User as UserIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { listFavorites, removeFavorite } from "@/lib/favorites.functions";
import { usePanelPermissions } from "@/hooks/usePanelPermissions";
import { PAINEIS } from "@/data/site";
import { getAreaColor } from "@/lib/areaColors";

type Section = "overview" | "dados" | "favoritos" | "senha";

const initialsFrom = (name?: string, email?: string) => {
  const src = (name || email || "").trim();
  if (!src) return "U";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || src[0].toUpperCase();
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const Perfil = () => {
  const { user, loading: authLoading, roles, signOut } = useAuth();
  const { panelIds: allowedPanelIds } = usePanelPermissions();
  const getProfileFn = useServerFn(getMyProfile);
  const updateProfileFn = useServerFn(updateMyProfile);
  const listFavoritesFn = useServerFn(listFavorites);
  const removeFavoriteFn = useServerFn(removeFavorite);

  const [section, setSection] = useState<Section>("overview");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
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
        setCreatedAt(res.profile?.created_at ?? user.created_at ?? null);
      })
      .catch(() => {
        setEmail(user.email ?? "");
        setCreatedAt(user.created_at ?? null);
      });
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

  const accessiblePanels = useMemo(
    () =>
      PAINEIS.filter(
        (p) => !p.restrito || allowedPanelIds.includes(String(p.id)),
      ),
    [allowedPanelIds],
  );

  const primaryRole = roles.includes("admin")
    ? "Administrador"
    : roles.includes("gestor")
      ? "Gestor"
      : "Usuário";

  if (authLoading)
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      toast({ title: "Informe seu nome", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfileFn({ data: { display_name: name } });
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
      toast({
        title: "Senha muito curta",
        description: "Use pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    setChangingPw(true);
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
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    toast({ title: "Senha alterada com sucesso" });
  };

  const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Visão geral", icon: LayoutGrid },
    { id: "dados", label: "Dados pessoais", icon: UserIcon },
    { id: "favoritos", label: "Favoritos", icon: Star },
    { id: "senha", label: "Segurança", icon: KeyRound },
  ];

  const initials = initialsFrom(displayName, email);

  return (
    <div className="container mx-auto px-4 py-10 animate-fade-in max-w-6xl">
      {/* Cabeçalho — banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-secondary/10 to-background p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-elegant shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                {displayName || "Meu perfil"}
              </h1>
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> {primaryRole}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {email}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" /> Membro desde {formatDate(createdAt)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="gap-2 self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Navegação lateral */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardContent className="p-2">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap text-left ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          <Card className="mt-4 hidden lg:block">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                Ações rápidas
              </h3>
              <div className="space-y-2">
                <Link
                  to="/paineis"
                  className="flex items-center gap-2 text-sm px-2 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  Explorar painéis
                </Link>
                <Link
                  to="/solicitar-acesso-painel"
                  className="flex items-center gap-2 text-sm px-2 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Lock className="h-4 w-4 text-primary" />
                  Solicitar acesso
                </Link>
                <Link
                  to="/contato"
                  className="flex items-center gap-2 text-sm px-2 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  Falar com a equipe
                </Link>
              </div>
              <Separator />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Precisa de ajuda? Entre em contato com o administrador do portal.
              </p>
            </CardContent>
          </Card>
        </aside>

        {/* Conteúdo */}
        <section className="space-y-6">
          {section === "overview" && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard
                  icon={Star}
                  label="Favoritos"
                  value={favorites.length}
                  hint="painéis salvos"
                />
                <StatCard
                  icon={LayoutGrid}
                  label="Acesso a painéis"
                  value={accessiblePanels.length}
                  hint={`de ${PAINEIS.length} disponíveis`}
                />
                <StatCard
                  icon={Lock}
                  label="Painéis restritos"
                  value={allowedPanelIds.length}
                  hint="liberados para você"
                />
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      Favoritos recentes
                    </h2>
                    <Link
                      to="/perfil"
                      onClick={(e) => {
                        e.preventDefault();
                        setSection("favoritos");
                      }}
                      className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Ver todos <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {loadingFavs ? (
                    <p className="text-sm text-muted-foreground">Carregando…</p>
                  ) : favorites.length === 0 ? (
                    <EmptyFavorites />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {favorites.slice(0, 4).map((p) => (
                        <FavoriteCard key={p.id} panel={p} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-1">Atalhos</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acesse rapidamente as principais áreas do portal.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <ShortcutLink to="/paineis" icon={LayoutGrid} label="Galeria de Painéis" />
                    <ShortcutLink
                      to="/solicitar-acesso-painel"
                      icon={Lock}
                      label="Solicitar acesso a painéis"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {section === "dados" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-1 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Dados pessoais
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Atualize as informações exibidas no portal.
                </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Para alterar o e-mail, contate o administrador.
                    </p>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Perfil de acesso</span>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> {primaryRole}
                    </Badge>
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? "Salvando…" : "Salvar alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {section === "favoritos" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    Painéis favoritos
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {favorites.length} {favorites.length === 1 ? "painel" : "painéis"}
                  </span>
                </div>
                {loadingFavs ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : favorites.length === 0 ? (
                  <EmptyFavorites />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {favorites.map((p) => (
                      <FavoriteCard
                        key={p.id}
                        panel={p}
                        onRemove={() => handleRemoveFav(String(p.id))}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {section === "senha" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-1 flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Alterar senha
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Por segurança, é necessário informar sua senha atual.
                </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Use pelo menos 8 caracteres.
                    </p>
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
          )}
        </section>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint?: string;
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-3xl font-bold leading-none">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </CardContent>
  </Card>
);

const FavoriteCard = ({
  panel,
  onRemove,
}: {
  panel: (typeof PAINEIS)[number];
  onRemove?: () => void;
}) => {
  const c = getAreaColor(panel.areaSlug);
  return (
    <div className="border border-border rounded-lg p-4 flex flex-col hover:shadow-elegant transition-smooth">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="outline" className={`text-xs gap-1.5 border-transparent ${c.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          {panel.areaNome}
        </Badge>
        {panel.restrito && (
          <Badge className="bg-warning text-warning-foreground gap-1 text-xs">
            <Lock className="h-3 w-3" /> Restrito
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-sm mb-3 flex-1">{panel.titulo}</h3>
      <div className="flex items-center justify-between">
        <Link
          to={`/paineis/${panel.id}`}
          className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
        >
          Visualizar <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
};

const EmptyFavorites = () => (
  <div className="border border-dashed border-border rounded-md p-8 text-center">
    <Star className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground mb-3">
      Você ainda não favoritou nenhum painel.
    </p>
    <Button asChild size="sm" variant="outline">
      <Link to="/paineis">Explorar Galeria de Painéis</Link>
    </Button>
  </div>
);

const ShortcutLink = ({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) => (
  <Link
    to={to}
    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-smooth group"
  >
    <span className="flex items-center gap-3 text-sm font-medium">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </span>
    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
  </Link>
);

export const Route = createFileRoute("/perfil")({ component: Perfil });
