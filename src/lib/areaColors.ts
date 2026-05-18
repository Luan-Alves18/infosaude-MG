// Cores compartilhadas das áreas temáticas (legendas + ícones)
// Mantém classes Tailwind estáticas para o JIT detectar.

export const AREA_COLORS: Record<string, { bg: string; dot: string; icon: string; iconBg: string }> = {
  "vigilancia-epidemiologica": { bg: "bg-red-200", dot: "bg-red-600", icon: "text-red-600", iconBg: "bg-red-100" },
  "estudos-tecnicos": { bg: "bg-blue-200", dot: "bg-blue-600", icon: "text-blue-600", iconBg: "bg-blue-100" },
  "gestao": { bg: "bg-purple-200", dot: "bg-purple-600", icon: "text-purple-600", iconBg: "bg-purple-100" },
  "regulacao": { bg: "bg-cyan-200", dot: "bg-cyan-600", icon: "text-cyan-600", iconBg: "bg-cyan-100" },
  "atencao-primaria": { bg: "bg-green-200", dot: "bg-green-600", icon: "text-green-600", iconBg: "bg-green-100" },
  "regionalizacao": { bg: "bg-yellow-200", dot: "bg-yellow-600", icon: "text-yellow-600", iconBg: "bg-yellow-100" },
  "vigilancia-sanitaria": { bg: "bg-orange-200", dot: "bg-orange-600", icon: "text-orange-600", iconBg: "bg-orange-100" },
  "auditoria-sus": { bg: "bg-fuchsia-300", dot: "bg-fuchsia-700", icon: "text-fuchsia-700", iconBg: "bg-fuchsia-100" },
  "saude-digital": { bg: "bg-slate-300", dot: "bg-slate-600", icon: "text-slate-600", iconBg: "bg-slate-100" },
  "atencao-especializada": { bg: "bg-lime-200", dot: "bg-lime-600", icon: "text-lime-600", iconBg: "bg-lime-100" },
};

const fallbackColor = { bg: "bg-muted", dot: "bg-muted-foreground", icon: "text-muted-foreground", iconBg: "bg-muted" };

export const getAreaColor = (slug: string) => AREA_COLORS[slug] ?? fallbackColor;