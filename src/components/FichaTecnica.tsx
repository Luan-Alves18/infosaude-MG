import { Building2, UserCog, Code2, Users } from "lucide-react";

type Card = {
  icon: typeof Building2;
  label: string;
  primary: string[];
  secondary?: string;
  code?: string;
};

const cards: Card[] = [
  {
    icon: Building2,
    label: "Realização",
    primary: ["NIGD"],
    secondary: "Núcleo de Inteligência e Governança de Dados — Secretaria de Estado de Saúde de Minas Gerais",
    code: "SES/GAB/ATI-NIGD",
  },
  {
    icon: UserCog,
    label: "Coordenação NIGD",
    primary: ["Guilherme Amaral Bernardino"],
    secondary: "Coordenação geral do projeto InfoSaúde MG.",
  },
  {
    icon: Code2,
    label: "Desenvolvimento",
    primary: ["Luan Alves Rodrigues"],
    secondary: "Desenvolvimento e manutenção do portal.",
  },
  {
    icon: Users,
    label: "TIME DE ANÁLISE",
    primary: ["Luísa Almeida Sousa", "Flávio Ferreira da Silva Junior"],
    secondary: "Tratamento e análise dos dados publicados.",
  },
];

export const FichaTecnica = () => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c) => (
        <article
          key={c.label}
          className="group relative h-full p-6 bg-card rounded-xl border border-border shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-lg gradient-hero flex items-center justify-center shadow-soft shrink-0">
              <c.icon className="h-5 w-5 text-primary-foreground" />
            </div>
             <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs bg-primary text-primary-foreground tracking-[0.05em] uppercase">
              {c.label}
            </span>
          </div>

          <div className="flex-1 flex flex-col">
            <ul className="space-y-1.5">
              {c.primary.map((name) => (
                <li
                  key={name}
                  className="text-base font-bold text-foreground leading-snug"
                >
                  {name}
                </li>
              ))}
            </ul>

            {c.secondary && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {c.secondary}
              </p>
            )}
          </div>

          {c.code && (
            <div className="mt-5 pt-4 border-t border-border/60">
              <p className="text-[11px] text-muted-foreground/80 font-mono tracking-wider">
                {c.code}
              </p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default FichaTecnica;