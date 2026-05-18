import { useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "@/lib/router-compat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Search } from "lucide-react";
import { AREAS_TEMATICAS, PAINEIS } from "@/data/site";

// Normaliza string: minúsculas, sem acentos, sem pontuação extra
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Atalhos de página: várias palavras-chave (já normalizadas) -> rota
const PAGE_SHORTCUTS: { keywords: string[]; path: string }[] = [
  {
    path: "/",
    keywords: [
      "inicio", "home", "pagina inicial", "principal", "infosaude",
      "infosaude mg", "portal", "tela inicial",
    ],
  },
  {
    path: "/paineis",
    keywords: [
      "paineis", "painel", "galeria", "galeria de paineis",
      "galeria paineis", "dashboards", "dashboard", "power bi", "powerbi",
    ],
  },
  {
    path: "/dados-abertos",
    keywords: [
      "dados", "dados abertos", "open data", "dataset", "datasets",
      "portal de dados", "transparencia",
    ],
  },
  {
    path: "/sobre",
    keywords: [
      "sobre", "quem somos", "institucional", "about", "sobre nos", "sobre o portal",
    ],
  },
  {
    path: "/contato",
    keywords: [
      "contato", "contatos", "fale conosco", "atendimento", "suporte",
      "telefone", "email", "e mail",
    ],
  },
  {
    path: "/auth",
    keywords: [
      "entrar", "login", "logar", "acessar", "autenticar",
      "cadastro", "cadastrar", "registrar", "criar conta", "signup", "sign in",
    ],
  },
  {
    path: "/painel",
    keywords: [
      "meu painel", "minha conta", "perfil", "area do usuario", "dashboard usuario",
    ],
  },
];

const findShortcut = (q: string): string | null => {
  const n = normalize(q);
  if (!n) return null;
  for (const s of PAGE_SHORTCUTS) {
    if (s.keywords.some((k) => k === n)) return s.path;
  }
  // tenta token a token (ex: "paineis covid" -> /paineis se algum token bate exato)
  const tokens = n.split(" ");
  for (const s of PAGE_SHORTCUTS) {
    if (tokens.some((t) => s.keywords.includes(t))) return s.path;
  }
  return null;
};

const Buscar = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const raw = params.get("q") || "";
  const q = normalize(raw);

  // Redireciona automaticamente quando a busca casa com uma página do site
  useEffect(() => {
    const path = findShortcut(raw);
    if (path) navigate(path, { replace: true });
  }, [raw, navigate]);

  const areas = useMemo(
    () =>
      AREAS_TEMATICAS.filter(
        (a) => normalize(a.nome).includes(q) || normalize(a.descricao).includes(q)
      ),
    [q]
  );
  const paineis = useMemo(
    () => PAINEIS.filter((p) => normalize(p.titulo).includes(q)),
    [q]
  );

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <Badge variant="secondary" className="mb-3"><Search className="h-3 w-3 mr-1" /> Resultados</Badge>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Busca: "{raw}"</h1>
      <p className="text-muted-foreground mb-10">
        {areas.length + paineis.length} resultado(s) encontrado(s).
      </p>

      {areas.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Áreas Temáticas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a) => (
              <Link key={a.id} to={`/paineis?area=${a.slug}`}>
                <Card className="hover:shadow-elegant transition-smooth h-full">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{a.nome}</h3>
                    <p className="text-sm text-muted-foreground">{a.descricao}</p>
                    <div className="mt-3 text-sm text-primary inline-flex items-center gap-1">
                      Ver área <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {paineis.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Painéis</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paineis.map((p) => (
              <Link key={p.id} to={`/paineis/${p.id}`}>
                <Card className="hover:shadow-elegant transition-smooth h-full">
                  <CardContent className="p-5">
                    <Badge variant="outline" className="mb-3 text-xs">{p.areaNome}</Badge>
                    <h3 className="font-semibold">{p.titulo}</h3>
                    <div className="mt-3 text-sm text-primary inline-flex items-center gap-1">
                      Visualizar <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {areas.length + paineis.length === 0 && (
        <p className="text-center py-20 text-muted-foreground">
          Nenhum resultado encontrado para sua busca.
        </p>
      )}
    </div>
  );
};

export default Buscar;
