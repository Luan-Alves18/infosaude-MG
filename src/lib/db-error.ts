/**
 * Safe error messages for server functions.
 * Never forward raw Postgres errors to the client.
 */
export function safeDbError(error: Error | { message?: string } | null | undefined, fallback = "Falha ao processar solicitação."): Error {
  if (!error) return new Error(fallback);
  const raw = (error as Error).message ?? String(error);
  // Log raw error server-side for debugging
  console.error("[db]", raw);
  // Map known error patterns to friendly messages
  if (/duplicate|unique|already exists/i.test(raw)) {
    return new Error("Registro já existe ou está duplicado.");
  }
  if (/foreign key|violates foreign key/i.test(raw)) {
    return new Error("Referência inválida. Verifique os dados e tente novamente.");
  }
  if (/not null|cannot be null/i.test(raw)) {
    return new Error("Campos obrigatórios não preenchidos.");
  }
  if (/check constraint|violates check/i.test(raw)) {
    return new Error("Dados inválidos. Verifique as informações e tente novamente.");
  }
  return new Error(fallback);
}
