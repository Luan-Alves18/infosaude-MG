import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navigate } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldCheck, ArrowDownAZ, CheckCheck, FileClock, UserPlus, BarChart3, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AREAS_TEMATICAS, PAINEIS } from "@/data/site";
import {
  approveAccountRequest,
  approvePanelAccessRequest,
  getPanelVisitsStats,
  listAccountRequests,
  listUsers,
  listPanelAccessRequests,
  listPanelPermissions,
  rejectAccountRequest,
  setPanelPermission,
} from "@/lib/admin.functions";

type AdminUser = { id: string; email: string; name: string; created_at: string; roles: string[] };
type PanelAccessRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  panelIds: string[];
  motivo: string;
  status: string;
  createdAt: string;
};
type AccountRequest = {
  id: string;
  nomeCompleto: string;
  email: string;
  instituicao: string;
  chefiaImediata: string;
  motivo: string;
  status: string;
  createdAt: string;
};
type Period = "week" | "month" | "year";

const AdminUsuarios = () => {
  const { user, loading: authLoading, roles } = useAuth();
  const listFn = useServerFn(listUsers);
  const listRequestsFn = useServerFn(listPanelAccessRequests);
  const listAccountReqsFn = useServerFn(listAccountRequests);
  const approveAccountFn = useServerFn(approveAccountRequest);
  const rejectAccountFn = useServerFn(rejectAccountRequest);
  const listPermsFn = useServerFn(listPanelPermissions);
  const setPermFn = useServerFn(setPanelPermission);
  const approveRequestFn = useServerFn(approvePanelAccessRequest);
  const getStatsFn = useServerFn(getPanelVisitsStats);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<PanelAccessRequest[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [loadingAccountRequests, setLoadingAccountRequests] = useState(false);
  const [processingAccountId, setProcessingAccountId] = useState<string | null>(null);

  const [statsPeriod, setStatsPeriod] = useState<Period>("month");
  const [statsCounts, setStatsCounts] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userPanelIds, setUserPanelIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);

  const restritos = useMemo(() => PAINEIS.filter((p) => p.restrito), []);
  const isAdmin = roles.includes("admin");

  const panelLabel = (panelId: string) =>
    restritos.find((panel) => String(panel.id) === String(panelId))?.titulo ?? `Painel ${panelId}`;

  const upsertUserFromRequest = (request: PanelAccessRequest) => {
    setUsers((prev) => {
      const existing = prev.find((item) => item.id === request.userId);
      if (existing) {
        return prev.map((item) =>
          item.id === request.userId
            ? { ...item, email: request.userEmail, name: request.userName || item.name }
            : item,
        );
      }

      return [
        {
          id: request.userId,
          email: request.userEmail,
          name: request.userName,
          created_at: request.createdAt,
          roles: ["user"],
        },
        ...prev,
      ];
    });
  };

  const loadUsers = (q = "") => {
    setLoadingUsers(true);
    listFn({ data: { search: q } })
      .then((res) => setUsers(res.users))
      .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingUsers(false));
  };

  const loadRequests = () => {
    setLoadingRequests(true);
    listRequestsFn()
      .then((res) => setRequests(res.requests))
      .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadRequests();
    }
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

  const approveRequest = async (request: PanelAccessRequest) => {
    setApprovingRequestId(request.id);
    try {
      await approveRequestFn({ data: { requestId: request.id } });
      upsertUserFromRequest(request);
      setSelectedUser({
        id: request.userId,
        email: request.userEmail,
        name: request.userName,
        created_at: request.createdAt,
        roles: users.find((item) => item.id === request.userId)?.roles ?? ["user"],
      });
      setUserPanelIds(request.panelIds);
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      toast({ title: "Solicitação aprovada", description: "Os painéis foram liberados para o usuário." });
    } catch (e) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha ao aprovar solicitação.",
        variant: "destructive",
      });
    } finally {
      setApprovingRequestId(null);
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

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="solicitacoes" className="gap-2">
            Solicitações pendentes
            {requests.length > 0 && <Badge variant="secondary">{requests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
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
                            <span
                              key={r}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold uppercase"
                            >
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
        </TabsContent>

        <TabsContent value="solicitacoes">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Solicitações de acesso a painéis</h2>
                  <p className="text-sm text-muted-foreground">
                    Solicitações enviadas pelos usuários para liberação de painéis restritos.
                  </p>
                </div>
                <Button variant="outline" onClick={loadRequests} disabled={loadingRequests}>
                  {loadingRequests ? "Atualizando…" : "Atualizar"}
                </Button>
              </div>

              {loadingRequests && (
                <p className="text-sm text-muted-foreground py-6 text-center">Carregando solicitações…</p>
              )}

              {!loadingRequests && requests.length === 0 && (
                <div className="border border-dashed border-border rounded-md p-6 text-center text-sm text-muted-foreground">
                  <FileClock className="h-5 w-5 mx-auto mb-2" />
                  Nenhuma solicitação pendente no momento.
                </div>
              )}

              {!loadingRequests && requests.map((request) => (
                <div key={request.id} className="border border-border rounded-md p-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium truncate">{request.userName || "Usuário sem nome"}</div>
                      <div className="text-sm text-muted-foreground break-all">{request.userEmail}</div>
                      <div className="text-xs text-muted-foreground">
                        Solicitado em {new Date(request.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <Button
                      onClick={() => approveRequest(request)}
                      disabled={approvingRequestId === request.id}
                      className="gap-2"
                    >
                      <CheckCheck className="h-4 w-4" />
                      {approvingRequestId === request.id ? "Aprovando…" : "Aprovar acesso"}
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Painéis solicitados</p>
                    <div className="flex flex-wrap gap-2">
                      {request.panelIds.map((panelId) => (
                        <Badge key={panelId} variant="secondary">
                          {panelLabel(panelId)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Motivo</p>
                    <p className="text-sm leading-relaxed">{request.motivo}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute("/admin/usuarios")({ component: AdminUsuarios });
