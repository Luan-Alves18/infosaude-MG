/**
 * Arredonda o total de acessos para baixo, em múltiplos de 10,
 * e formata como "+N" (ex.: 64 -> "+60", 1234 -> "+1230",
 * 12500 -> "+12 mil"). Mantém o visual aproximado do indicador.
 */
export function formatVisitsApprox(total: number | null | undefined): string {
  const n = Math.max(0, Math.floor(Number(total ?? 0)));
  if (n < 10) return "+0";
  const rounded = Math.floor(n / 10) * 10;
  if (rounded >= 1000) {
    const mil = Math.floor(rounded / 1000);
    return `+${mil} mil`;
  }
  return `+${rounded}`;
}