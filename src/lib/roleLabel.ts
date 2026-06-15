// Devolve apenas o papel de maior privilégio para exibição,
// evitando selos redundantes (um "owner" também é admin e user).
const ORDER = ["owner", "admin", "gestor", "user"] as const;
type R = typeof ORDER[number];

export function primaryRoleKey(roles: string[]): R | null {
  for (const r of ORDER) if (roles.map((x) => x.toLowerCase()).includes(r)) return r;
  return null;
}

export function primaryRoleLabel(roles: string[]): string {
  const r = primaryRoleKey(roles);
  switch (r) {
    case "owner":
      return "Owner";
    case "admin":
      return "Administrador";
    case "gestor":
      return "Gestor";
    case "user":
      return "Usuário";
    default:
      return "—";
  }
}
