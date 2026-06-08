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
import { Search, ShieldCheck, ArrowDownAZ, CheckCheck, FileClock, UserPlus, BarChart3, X, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AREAS_TEMATICAS, PAINEIS } from "@/data/site";
import {
  approveAccountRequest,
  approvePanelAccessRequest,
  deleteUser,
  getPanelVisitsStats,
  listAccountRequests,
  listUsers,
  listPanelAccessRequests,
  listPanelPermissions,
  rejectAccountRequest,
  rejectPanelAccessRequest,
  setPanelPermission,
} from "@/lib/admin.functions";
import { getAreaColor } from "@/lib/areaColors";

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
  const rejectRequestFn = useServerFn(rejectPanelAccessRequest);
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
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  const restritos = useMemo(() => PAINEIS.filter((p) => p.restrito), []);
  const isAdmin = roles.includes("admin");

  const panelInfo = (panelId: string) =>
    restritos.find((panel) => String(panel.id) === String(panelId));
  const panelLabel = (panelId: string) =>
    panelInfo(panelId)?.titulo ?? `Painel ${panelId}`;
  const panelArea = (panelId: string) => panelInfo(panelId)?.areaNome ?? "—";

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

  const loadAccountRequests = () => {
    setLoadingAccountRequests(true);
    listAccountReqsFn()
      .then((res) => setAccountRequests(res.requests))
      .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingAccountRequests(false));
  };

  const loadStats = (period: Period) => {
    setLoadingStats(true);
    getStatsFn({ data: { period } })
      .then((res) => setStatsCounts(res.countsByPanelId))
      .catch((e) => toast({ title: "Erro", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingStats(false));
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadRequests();
      loadAccountRequests();
      loadStats(statsPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) loadStats(statsPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsPeriod]);


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

  const rejectRequest = async (request: PanelAccessRequest) => {
    setRejectingRequestId(request.id);
    try {
      await rejectRequestFn({ data: { requestId: request.id } });
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      toast({ title: "Solicitação recusada" });
    } catch (e) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha ao recusar solicitação.",
        variant: "destructive",
      });
    } finally {
      setRejectingRequestId(null);
    }
  };

  const handleApproveAccount = async (req: AccountRequest) => {
    setProcessingAccountId(req.id);
    try {
      await approveAccountFn({ data: { requestId: req.id } });
      setAccountRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast({
        title: "Conta criada",
        description: `Um e-mail de definição de senha foi enviado para ${req.email}.`,
      });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Falha ao aprovar.", variant: "destructive" });
    } finally {
      setProcessingAccountId(null);
    }
  };

  const handleRejectAccount = async (req: AccountRequest) => {
    setProcessingAccountId(req.id);
    try {
      await rejectAccountFn({ data: { requestId: req.id } });
      setAccountRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast({ title: "Solicitação recusada" });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Falha ao recusar.", variant: "destructive" });
    } finally {
      setProcessingAccountId(null);
    }
  };

  // Agrupa estatísticas por área temática e por tipo (público/restrito).
  const statsByArea = AREAS_TEMATICAS.map((a) => {
    const paneis = PAINEIS.filter((p) => p.areaSlug === a.slug);
    const total = paneis.reduce((acc, p) => acc + (statsCounts[String(p.id)] ?? 0), 0);
    return { area: a, total, paneis };
  })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  const panelsWithCounts = PAINEIS.map((p) => ({
    panel: p,
    count: statsCounts[String(p.id)] ?? 0,
  })).filter((s) => s.count > 0);

  const publicPanels = panelsWithCounts.filter((s) => !s.panel.restrito).sort((a, b) => b.count - a.count);
  const restrictedPanels = panelsWithCounts.filter((s) => s.panel.restrito).sort((a, b) => b.count - a.count);



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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="solicitacoes" className="gap-2">
            Acesso a painéis
            {requests.length > 0 && <Badge variant="secondary">{requests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="contas" className="gap-2">
            Criação de conta
            {accountRequests.length > 0 && <Badge variant="secondary">{accountRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Estatísticas
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
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => rejectRequest(request)}
                        disabled={
                          rejectingRequestId === request.id || approvingRequestId === request.id
                        }
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        {rejectingRequestId === request.id ? "Recusando…" : "Recusar"}
                      </Button>
                      <Button
                        onClick={() => approveRequest(request)}
                        disabled={
                          approvingRequestId === request.id || rejectingRequestId === request.id
                        }
                        className="gap-2"
                      >
                        <CheckCheck className="h-4 w-4" />
                        {approvingRequestId === request.id ? "Aprovando…" : "Aprovar acesso"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Painéis solicitados</p>
                    <ul className="space-y-1.5">
                      {request.panelIds.map((panelId) => {
                        const color = getAreaColor(panelInfo(panelId)?.areaSlug ?? "");
                        return (
                          <li
                            key={panelId}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <span className="font-medium">{panelLabel(panelId)}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] gap-1.5 border-transparent ${color.bg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                              {panelArea(panelId)}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
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

        <TabsContent value="contas">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Solicitações de criação de conta
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ao aprovar, a conta é criada e um e-mail de definição de senha é enviado ao solicitante.
                  </p>
                </div>
                <Button variant="outline" onClick={loadAccountRequests} disabled={loadingAccountRequests}>
                  {loadingAccountRequests ? "Atualizando…" : "Atualizar"}
                </Button>
              </div>

              {loadingAccountRequests && (
                <p className="text-sm text-muted-foreground py-6 text-center">Carregando solicitações…</p>
              )}

              {!loadingAccountRequests && accountRequests.length === 0 && (
                <div className="border border-dashed border-border rounded-md p-6 text-center text-sm text-muted-foreground">
                  <FileClock className="h-5 w-5 mx-auto mb-2" />
                  Nenhuma solicitação de conta pendente.
                </div>
              )}

              {!loadingAccountRequests && accountRequests.map((req) => (
                <div key={req.id} className="border border-border rounded-md p-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium truncate">{req.nomeCompleto}</div>
                      <div className="text-sm text-muted-foreground break-all">{req.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Solicitado em {new Date(req.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectAccount(req)}
                        disabled={processingAccountId === req.id}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" /> Recusar
                      </Button>
                      <Button
                        onClick={() => handleApproveAccount(req)}
                        disabled={processingAccountId === req.id}
                        className="gap-2"
                      >
                        <CheckCheck className="h-4 w-4" />
                        {processingAccountId === req.id ? "Processando…" : "Aprovar e criar conta"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Instituição</p>
                      <p>{req.instituicao}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Chefia imediata</p>
                      <p>{req.chefiaImediata}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Motivo</p>
                    <p className="text-sm leading-relaxed">{req.motivo}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas">
          <Card>
            <CardContent className="p-4 space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Acessos por painel
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Visualizações registradas nas páginas de painéis.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statsPeriod} onValueChange={(v) => setStatsPeriod(v as Period)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="year">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => loadStats(statsPeriod)} disabled={loadingStats}>
                    {loadingStats ? "Atualizando…" : "Atualizar"}
                  </Button>
                </div>
              </div>

              {loadingStats ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Carregando estatísticas…</p>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-border rounded-md p-4">
                      <h3 className="font-medium mb-3 flex items-center justify-between">
                        Painéis públicos
                        <Badge variant="secondary">
                          {publicPanels.reduce((acc, s) => acc + s.count, 0)} acessos
                        </Badge>
                      </h3>
                      {publicPanels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem acessos no período.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {publicPanels.map(({ panel, count }) => (
                            <li key={panel.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <span className="truncate">
                                <span className="font-medium">{panel.titulo}</span>
                                <span className="block text-xs text-muted-foreground">{panel.areaNome}</span>
                              </span>
                              <Badge variant="outline">{count}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="border border-border rounded-md p-4">
                      <h3 className="font-medium mb-3 flex items-center justify-between">
                        Painéis restritos
                        <Badge variant="secondary">
                          {restrictedPanels.reduce((acc, s) => acc + s.count, 0)} acessos
                        </Badge>
                      </h3>
                      {restrictedPanels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem acessos no período.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {restrictedPanels.map(({ panel, count }) => (
                            <li key={panel.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <span className="truncate">
                                <span className="font-medium">{panel.titulo}</span>
                                <span className="block text-xs text-muted-foreground">{panel.areaNome}</span>
                              </span>
                              <Badge variant="outline">{count}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Acessos por área temática</h3>
                      <Badge variant="secondary">
                        {statsByArea.reduce((acc, s) => acc + s.total, 0)} acessos
                      </Badge>
                    </div>
                    {statsByArea.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem acessos no período.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {statsByArea.map(({ area, total, paneis }) => {
                          const color = getAreaColor(area.slug);
                          const panelsWithCountsInArea = paneis
                            .map((p) => ({ p, count: statsCounts[String(p.id)] ?? 0 }))
                            .filter((s) => s.count > 0)
                            .sort((a, b) => b.count - a.count);
                          return (
                            <div
                              key={area.slug}
                              className={`relative overflow-hidden border border-border rounded-lg p-4 ${color.bg}`}
                            >
                              <div
                                className={`absolute inset-y-0 left-0 w-1 ${color.dot}`}
                                aria-hidden
                              />
                              <div className="flex items-baseline justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Área temática
                                  </p>
                                  <p className="font-semibold text-sm leading-snug truncate">
                                    {area.nome}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-2xl font-bold leading-none">{total}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">
                                    acessos
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {panelsWithCountsInArea.length} de {paneis.length}{" "}
                                {paneis.length === 1 ? "painel" : "painéis"} com registros
                              </p>
                              {panelsWithCountsInArea.length > 0 && (
                                <ul className="space-y-1 max-h-32 overflow-auto">
                                  {panelsWithCountsInArea.slice(0, 5).map(({ p, count }) => (
                                    <li
                                      key={p.id}
                                      className="flex items-center justify-between gap-2 text-xs"
                                    >
                                      <span className="truncate">{p.titulo}</span>
                                      <span className="font-semibold tabular-nums">{count}</span>
                                    </li>
                                  ))}
                                  {panelsWithCountsInArea.length > 5 && (
                                    <li className="text-[10px] text-muted-foreground italic">
                                      + {panelsWithCountsInArea.length - 5} outros
                                    </li>
                                  )}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute("/admin/usuarios")({ component: AdminUsuarios });
