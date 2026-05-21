import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navigate } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, ArrowDownAZ } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PAINEIS } from "@/data/site";
import { listUsers, listPanelPermissions, setPanelPermission } from "@/lib/admin.functions";

type AdminUser = { id: string; email: string; name: string; created_at: string; roles: string[] };

const AdminUsuarios = () => {
  const { user, loading: authLoading, roles } = useAuth();
  const listFn = useServerFn(listUsers);
  const listPermsFn = useServerFn(listPanelPermissions);
  const setPermFn = useServerFn(setPanelPermission);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userPanelIds, setUserPanelIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const restritos = useMemo(() => PAINEIS.filter((p) => p.restrito), []);
  const isAdmin = roles.includes("admin");

  const loadUsers = (q = "") => {
    setLoadingUsers(true);
    listFn({ data: { search: q } })
      .then((res) => setUsers(res.users))
      .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedUser) {
      setUserPanelIds([]);
      return;
    }
    listPermsFn({ data: { userId: selectedUser.id } })
      .then((res) => setUserPanelIds(res.panelIds))
      .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }));
  }, [selectedUser, listPermsFn]);

  if (authLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">Esta área é exclusiva para administradores.</p>
      </div>
    );
  }

  const togglePanel = async (panelId: string, granted: boolean) => {
    if (!selectedUser) return;
    try {
      await setPermFn({ data: { userId: selectedUser.id, panelId, granted } });
      setUserPanelIds((prev) =>
        granted ? [...prev, panelId] : prev.filter((p) => p !== panelId),
      );
    } catch (e) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha ao alterar permissão.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 animate-fade-in">
      <Badge variant="secondary" className="mb-3">
        <ShieldCheck className="h-3 w-3 mr-1" /> Administração
      </Badge>
      <h1 className="text-3xl font-bold mb-2">Gerenciar usuários</h1>
      <p className="text-muted-foreground mb-6">
        Visualize usuários cadastrados e gerencie permissões de acesso a painéis restritos.
      </p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por nome ou e-mail…"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => loadUsers(search)} className="gap-2">
                <Search className="h-4 w-4" /> Buscar
              </Button>
              <Button variant="outline" onClick={() => loadUsers("")} className="gap-2" title="Mais recentes">
                <ArrowDownAZ className="h-4 w-4" /> Recentes
              </Button>
            </div>

            <div className="divide-y divide-border">
              {loadingUsers && <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>}
              {!loadingUsers && users.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum usuário encontrado.</p>
              )}
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left py-3 px-2 rounded-md hover:bg-muted/60 transition-colors ${
                    selectedUser?.id === u.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.name || "(sem nome)"}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {u.roles.map((r) => (
                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-semibold uppercase">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-1">Painéis restritos</h2>
            {selectedUser ? (
              <p className="text-xs text-muted-foreground mb-3 truncate">{selectedUser.email}</p>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">Selecione um usuário para gerenciar.</p>
            )}

            {restritos.length === 0 && (
              <p className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-3">
                Nenhum painel restrito cadastrado. Quando houver painéis com a flag <code>restrito</code> no portal, eles aparecerão aqui.
              </p>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {restritos.map((p) => {
                const checked = userPanelIds.includes(String(p.id));
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-2 p-2 rounded-md ${
                      selectedUser ? "cursor-pointer hover:bg-muted" : "opacity-50"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!selectedUser}
                      onCheckedChange={(v) => togglePanel(String(p.id), Boolean(v))}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{p.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{p.areaNome}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/admin/usuarios")({ component: AdminUsuarios });
