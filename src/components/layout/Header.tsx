import { useState } from "react";
import { Link, NavLink, useNavigate } from "@/lib/router-compat";
import { Search, Menu, X, LogIn, LogOut, User as UserIcon, Type, Contrast } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useAccessibility } from "@/hooks/useAccessibility";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import brasaoMG from "@/assets/brasao-mg.jpg";
import { HideInModoEleitoral, isModoEleitoral } from "@/lib/modoEleitoral";
import { primaryRoleLabel } from "@/lib/roleLabel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_NAV_ITEMS = [
  { to: "/", label: "Início" },
  { to: "/paineis", label: "Galeria de Painéis" },
  { to: "/dados-abertos", label: "Dados Abertos" },
  { to: "/sobre", label: "Sobre", hideInModoEleitoral: true },
  { to: "/contato", label: "Contato" },
];
const navItems = isModoEleitoral()
  ? ALL_NAV_ITEMS.filter((i) => !i.hideInModoEleitoral)
  : ALL_NAV_ITEMS;

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user, signOut, roles } = useAuth();
  const { toggleContrast, cycleFont } = useAccessibility();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      {/* Topbar gov */}
      <div className="bg-primary text-primary-foreground text-xs">
        <div className="container mx-auto flex items-center justify-between h-8 px-4">
          <a
            href="https://www.mg.gov.br"
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            GOVERNO DE MINAS GERAIS · Secretaria de Estado de Saúde
          </a>
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={cycleFont} className="hover:underline flex items-center gap-1" aria-label="Tamanho da fonte">
              <Type className="h-3 w-3" /> Fonte
            </button>
            <button onClick={toggleContrast} className="hover:underline flex items-center gap-1" aria-label="Alto contraste">
              <Contrast className="h-3 w-3" /> Contraste
            </button>
            <AccessibilityMenu variant="topbar" />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center">
              <img
                src={brasaoMG}
                alt="Brasão de Minas Gerais"
                className="h-full w-auto object-contain"
                loading="eager"
              />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-bold text-base sm:text-lg text-foreground truncate">InfoSaúde<span className="text-secondary"> MG</span></div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">Portal Oficial · SES-MG</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              className="hover:bg-muted"
            >
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-xs text-muted-foreground">Conectado como</div>
                    <div className="truncate">{user.email}</div>
                    {roles.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-semibold uppercase">
                          {primaryRoleLabel(roles)}
                        </span>
                      </div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/perfil")}>
                    Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/solicitar-acesso-painel")}>
                    Solicitar acesso a painel
                  </DropdownMenuItem>
                  {roles.includes("admin") && (
                    <DropdownMenuItem onClick={() => navigate("/admin/usuarios")}>
                      Gerenciar usuários
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="gap-2">
                <Link to="/auth"><LogIn className="h-4 w-4" /> Entrar</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar painéis, áreas temáticas, indicadores…"
                className="pl-12 h-12 text-base"
              />
              <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                Buscar
              </Button>
            </div>
          </form>
        )}

        {open && (
          <nav className="lg:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 pt-3 border-t border-border flex flex-wrap gap-2">
              <button onClick={cycleFont} className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 inline-flex items-center justify-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Tamanho da fonte
              </button>
              <button onClick={toggleContrast} className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 inline-flex items-center justify-center gap-1.5">
                <Contrast className="h-3.5 w-3.5" /> Alto contraste
              </button>
              <div className="flex-1 min-w-[120px] flex">
                <AccessibilityMenu variant="ghost" />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
