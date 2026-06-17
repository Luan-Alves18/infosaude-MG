// Normaliza string para buscas tolerantes:
// - minúsculas
// - remove acentos / diacríticos
// - remove pontuação extra
// - colapsa espaços
export const normalizeSearch = (s: string): string =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Indica se `haystack` contém `needle` ignorando caixa, acentos e pontuação.
export const matchesSearch = (haystack: string, needle: string): boolean => {
  const n = normalizeSearch(needle);
  if (!n) return true;
  return normalizeSearch(haystack).includes(n);
};
